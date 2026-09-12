import { create } from 'zustand';
import {
    createJSONStorage,
    persist
} from 'zustand/middleware';

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import expenseApi, { EXPENSE_TIMEOUT_MS } from '@api/expense.js';
import useAuthStore from '@stores/modules/auth.js';
import useCashSessionStore from '@stores/modules/cash-session.js';
import {
    expenseRequest,
    hasExpectedExpenseSession,
    validateExpense
} from '@utils/expense-utils.js';

const STORAGE_KEY = 'bloom-expense-v1';
const createExpenseState = (ownerAccountId = null) => ({
    ownerAccountId,
    draft: { amount: '', category: 'STORE_OPERATIONAL', description: '' },
    attempt: null,
    result: null,
    pending: false,
    outcome: 'editing'
});

const currentAccountId = () => {
    const auth = useAuthStore.getState();
    return auth.authStatus === 'authenticated' ? auth.currentUser?.accountId : null;
};
export const canUseExpense = state => !!currentAccountId()
    && state.ownerAccountId === currentAccountId();
export const isExpenseLocked = state => state.pending || !!state.attempt || !!state.result;
const isFreshExpenseState = state => !state.ownerAccountId
    && !state.attempt
    && !state.result
    && state.outcome === 'editing'
    && !state.draft.amount
    && state.draft.category === 'STORE_OPERATIONAL'
    && !state.draft.description;
export const hasExpenseSession = () => {
    const cash = useCashSessionStore.getState();
    return cash.currentStatus === 'ready' && cash.drawerActionsEnabled
        && hasExpectedExpenseSession({ expectedCashSessionId: cash.currentSession?.id })
        && cash.currentSession.status === 'OPEN';
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
        } catch { /* Checked before posting. */
        }
    },
    removeItem: key => {
        try {
            sessionStorage.removeItem(key);
        } catch { /* Retain in memory. */
        }
    }
};
const refreshSession = () => useCashSessionStore.getState().getCurrentSession({ timeout: EXPENSE_TIMEOUT_MS });

// One unresolved expense per tab. A replay failure never proves the first request failed.
const useExpenseStore = create(persist((set, get) => ({
    ...createExpenseState(),
    select: () => {
        const accountId = currentAccountId();
        if (accountId && !isExpenseLocked(get()) && isFreshExpenseState(get())) {
            set(createExpenseState(accountId));
        }
    },

    edit: draft => {
        if (canUseExpense(get()) && !isExpenseLocked(get())) {
            set({ draft, outcome: 'editing' });
        }
    },

    next: () => {
        if (canUseExpense(get()) && get().result && !get().pending) {
            set(createExpenseState(get().ownerAccountId));
        }
    },

    submit: async confirmation => {
        if (!canUseExpense(get()) || get().pending || get().result || get().outcome === 'keyConflict') {
            return;
        }
        const replay = !!get().attempt;
        const { ownerAccountId } = get();
        // Never infer missing historical session intent from today's open session.
        if (replay && !hasExpectedExpenseSession(get().attempt.request)) {
            set({ outcome: 'unboundSession' });
            return;
        }
        if (!replay && (confirmation?.ownerAccountId !== ownerAccountId || !hasExpenseSession()
            || !hasExpectedExpenseSession(confirmation.request)
            || Object.values(validateExpense(confirmation.request)).some(Boolean))) {
            return;
        }
        set({ pending: true, outcome: 'pending' });
        let attempt = get().attempt;
        try {
            if (!replay) {
                const session = await refreshSession();
                if (!canUseExpense(get()) || !hasExpenseSession() || session?.id !== confirmation.request.expectedCashSessionId) {
                    set({ outcome: 'sessionConflict' });
                    return;
                }
                attempt = {
                    ownerAccountId,
                    key: `expense-${ crypto.randomUUID() }`,
                    request: expenseRequest({
                        ...confirmation.request,
                        description: confirmation.request.description || ''
                    }, confirmation.request.expectedCashSessionId)
                };
            }
            const { amount, category, description } = attempt.request;
            const draft = { amount, category, description: description || '' };
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                    version: 0,
                    state: {
                        ownerAccountId,
                        draft,
                        attempt,
                        result: null,
                        outcome: 'uncertain'
                    }
                }));
            } catch {
                set({ outcome: 'storageUnavailable' });
                return;
            }
            set({ draft, attempt });
            const { data: response } = await expenseApi.createExpense(attempt.request, attempt.key);
            if (get().ownerAccountId !== ownerAccountId) {
                set({ outcome: 'uncertain' });
                return;
            }
            const result = response?.data;
            if (!result?.id || result.cashSessionId !== attempt.request.expectedCashSessionId || result.amount == null || !result.category
                || typeof result.voided !== 'boolean' || typeof result.operationalExpense !== 'boolean'
                || !result.createdAt || !result.createdBy) {
                throw new Error('Incomplete expense response');
            }
            set({ result, attempt: null, outcome: 'success' });
        } catch (error) {
            const keyConflict = error.domainCode === API_DOMAIN_ERROR_CODE.EXPENSE_IDEMPOTENCY_CONFLICT;
            const sessionConflict = error.domainCode === API_DOMAIN_ERROR_CODE.CASH_SESSION_CONFLICT;
            const rejected = !replay && !keyConflict && ([400, 401, 403, 422].includes(error.status)
                || sessionConflict);
            set({
                attempt: rejected ? null : get().attempt,
                outcome: keyConflict ? 'keyConflict' : !attempt ? 'sessionError'
                    : !rejected ? 'uncertain' : sessionConflict ? 'sessionConflict' : 'rejected'
            });
            if (sessionConflict && canUseExpense(get())) {
                await refreshSession().catch(() => {
                });
            }
        } finally {
            set({ pending: false });
        }
        if (get().result && canUseExpense(get())) {
            await refreshSession().catch(() => {
            });
        }
    }
}), {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => storage),
    partialize: ({ ownerAccountId, draft, attempt, result, outcome }) => ({
        ownerAccountId,
        draft,
        attempt,
        result,
        outcome: attempt && outcome !== 'keyConflict' ? 'uncertain' : outcome
    })
}));

export default useExpenseStore;
