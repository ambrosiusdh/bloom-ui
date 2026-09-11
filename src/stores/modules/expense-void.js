import { create } from 'zustand';
import {
    createJSONStorage,
    persist
} from 'zustand/middleware';

import cashSessionApi from '@api/cash-session.js';
import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import expenseApi, { EXPENSE_TIMEOUT_MS } from '@api/expense.js';
import useAuthStore from '@stores/modules/auth.js';
import useCashSessionStore from '@stores/modules/cash-session.js';
import {
    canVoidExpense,
    validateExpenseVoidReason
} from '@utils/expense-utils.js';

const STORAGE_KEY = 'bloom-expense-void-v1';

const initial = {
    owner: null,
    open: false,
    record: null,
    reason: '',
    attempt: null,
    pending: false,
    outcome: 'idle',
    notice: '',
    session: null,
    refreshError: false,
    revision: 0
};

const storage = {
    getItem: key => {
        try {
            return sessionStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            sessionStorage.setItem(key, value);
        } catch {
            /* Checked before posting. */
        }
    },
    removeItem: key => {
        try {
            sessionStorage.removeItem(key);
        } catch {
            /* Keep in memory. */
        }
    }
};

const currentOwner = () => {
    const auth = useAuthStore.getState();
    return auth.authStatus === 'authenticated' ? auth.currentUser?.username : null;
};

export const canUseExpenseVoid = state => !!currentOwner() && state.owner === currentOwner();

const validRecord = (record, original) => record?.id === original.id && record.cashSessionId === original.cashSessionId
    && record.amount != null && !!record.category && !!record.createdAt && !!record.createdBy
    && typeof record.voided === 'boolean' && (!record.voided || (!!record.voidedReason && !!record.voidedAt && !!record.voidedBy));

// Replays target one immutable expense ID. Never invent a key or replace the confirmed reason.
const useExpenseVoidStore = create(persist((set, get) => {
    const refresh = async (afterPost = false) => {
        const original = get().record;
        set({
            refreshError: false,
            session: null
        });

        try {
            const { data: response } = await expenseApi.getExpense(original.id);
            const record = response?.data;
            if (!validRecord(record, original) || (original.voided && !record.voided)) throw new Error('Invalid expense result');
            set({
                record,
                outcome: record.voided ? 'confirmed' : get().attempt ? 'uncertain' : 'ready',
                ...(record.voided ? { attempt: null } : {}),
                revision: get().revision + 1
            });
        } catch {
            set({
                refreshError: true,
                outcome: get().outcome === 'confirmed' ? 'confirmed' : get().attempt ? 'uncertain' : 'readError'
            });
        }

        if (!canUseExpenseVoid(get())) return;
        if (afterPost || get().record.voided || get().attempt) {
            const results = await Promise.allSettled([
                cashSessionApi.getSessionDetails(original.cashSessionId, { timeout: EXPENSE_TIMEOUT_MS }),
                useCashSessionStore.getState().getCurrentSession({ timeout: EXPENSE_TIMEOUT_MS })
            ]);
            const session = results[0].status === 'fulfilled' ? results[0].value.data?.data : null;
            if (session?.id === original.cashSessionId && session.expectedClosingCash != null && ['OPEN', 'CLOSED'].includes(session.status)) {
                set({ session });
            } else set({ refreshError: true });
            if (results[1].status === 'rejected') set({ refreshError: true });
        }
    };

    return {
        ...initial,
        begin: async record => {
            if (!currentOwner() || get().pending || get().attempt || (get().record && get().outcome === 'confirmed')) return;

            set({
                ...initial,
                revision: get().revision,
                owner: currentOwner(),
                record,
                open: true,
                pending: true,
                outcome: 'loading'
            });

            await refresh();
            set({ pending: false });
        },

        resume: () => {
            if (canUseExpenseVoid(get())) set({ open: true });
        },

        close: () => {
            if (!canUseExpenseVoid(get()) || get().pending) return;
            set({ open: false });
        },

        dismiss: () => {
            if (canUseExpenseVoid(get()) && !get().pending && !get().open && !get().attempt) set({
                ...initial,
                revision: get().revision
            });
        },

        edit: reason => {
            if (canUseExpenseVoid(get()) && !get().pending && !get().attempt && get().outcome === 'ready') set({ reason });
        },

        refresh: async () => {
            if (!canUseExpenseVoid(get()) || !get().record || get().pending) return;
            set({ pending: true });
            await refresh();
            set({ pending: false });
        },

        submit: async () => {
            const state = get();
            if (!canUseExpenseVoid(state) || state.pending || state.record?.voided
                || (!state.attempt && (state.outcome !== 'ready' || !canVoidExpense(state.record)))
                || validateExpenseVoidReason(state.attempt || state.reason)) return;

            const attempt = state.attempt || state.reason.trim();

            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                    version: 0,
                    state: {
                        owner: state.owner,
                        record: state.record,
                        reason: attempt,
                        attempt,
                        open: true,
                        outcome: 'uncertain'
                    }
                }));
            } catch {
                set({ outcome: 'storageError' });
                return;
            }

            set({
                pending: true,
                attempt,
                reason: attempt,
                outcome: 'sending'
            });

            try {
                const { data: response } = await expenseApi.voidExpense(state.record.id, { reason: attempt });
                if (!validRecord(response?.data, state.record) || !response.data.voided) throw new Error('Unconfirmed void');
                set({
                    record: response.data,
                    attempt: null,
                    outcome: 'confirmed',
                    revision: get().revision + 1
                });
            } catch (error) {
                const rejected = !state.attempt && ([400, 401, 403, 404, 422].includes(error.status)
                    || error.domainCode === API_DOMAIN_ERROR_CODE.CASH_SESSION_CONFLICT);
                set({
                    attempt: rejected ? null : attempt,
                    outcome: 'uncertain',
                    notice: error.domainCode === API_DOMAIN_ERROR_CODE.CASH_SESSION_CONFLICT ? 'Sesi kas berubah atau sudah ditutup. Periksa hasil terbaru.'
                        : rejected ? 'Permintaan ditolak. Periksa data dan alasan sebelum mencoba lagi.'
                            : 'Hasil permintaan belum pasti atau data berubah. Periksa hasil sebelum memulihkan pembatalan yang sama.'
                });
                // Refresh before offering another confirmation; a failed replay never disproves the first request.
            }

            if (canUseExpenseVoid(get())) await refresh(true);
            set({ pending: false });
        }
    };
}, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => storage),
    partialize: ({ owner, record, reason, attempt, outcome }) => ({
        owner,
        record,
        reason,
        attempt,
        open: !!record,
        outcome: attempt ? 'uncertain' : outcome === 'confirmed' ? outcome : 'readError'
    })
}));

export default useExpenseVoidStore;
