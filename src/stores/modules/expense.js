import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createExpense, EXPENSE_TIMEOUT_MS } from '@api/expense.js';
import useAuthStore from '@stores/modules/auth.js';
import useCashSessionStore from '@stores/modules/cash-session.js';
import { expenseRequest, hasExpectedExpenseSession, validateExpense } from '@utils/expense-utils.js';

const STORAGE_KEY = 'bloom-expense-v1';
const initial = (owner = null) => ({
    owner, draft: { amount: '', category: 'STORE_OPERATIONAL', description: '' },
    attempt: null, result: null, pending: false, outcome: 'editing'
});
const currentOwner = () => {
    const auth = useAuthStore.getState();
    return auth.authStatus === 'authenticated' ? auth.currentUser?.username : null;
};
export const canUseExpense = state => !!currentOwner() && state.owner === currentOwner();
export const isExpenseLocked = state => state.pending || !!state.attempt || !!state.result;
export const hasExpenseSession = () => {
    const cash = useCashSessionStore.getState();
    return cash.currentStatus === 'ready' && cash.drawerActionsEnabled
        && hasExpectedExpenseSession({ expectedCashSessionId: cash.currentSession?.id })
        && cash.currentSession.status === 'OPEN';
};
const storage = {
    getItem: key => { try { return sessionStorage.getItem(key); } catch { return null; } },
    setItem: (key, value) => { try { sessionStorage.setItem(key, value); } catch { /* Checked before posting. */ } },
    removeItem: key => { try { sessionStorage.removeItem(key); } catch { /* Retain in memory. */ } }
};
const refreshSession = () => useCashSessionStore.getState().getCurrentSession({ timeout: EXPENSE_TIMEOUT_MS });

// One unresolved expense per tab. A replay failure never proves the first request failed.
const useExpenseStore = create(persist((set, get) => ({
    ...initial(),
    select: () => {
        if (currentOwner() && !isExpenseLocked(get()) && !canUseExpense(get())) set(initial(currentOwner()));
    },
    edit: draft => {
        if (canUseExpense(get()) && !isExpenseLocked(get())) set({ draft, outcome: 'editing' });
    },
    next: () => {
        if (canUseExpense(get()) && get().result && !get().pending) set(initial(get().owner));
    },
    submit: async confirmation => {
        if (!canUseExpense(get()) || get().pending || get().result || get().outcome === 'keyConflict') return;
        const replay = !!get().attempt;
        const { owner } = get();
        // Never infer missing historical session intent from today's open session.
        if (replay && !hasExpectedExpenseSession(get().attempt.request)) {
            set({ outcome: 'unboundSession' });
            return;
        }
        if (!replay && (confirmation?.owner !== owner || !hasExpenseSession()
            || !hasExpectedExpenseSession(confirmation.request)
            || Object.values(validateExpense(confirmation.request)).some(Boolean))) return;
        set({ pending: true, outcome: 'pending' });
        let attempt = get().attempt;
        try {
            if (!replay) {
                const session = await refreshSession();
                if (!canUseExpense(get()) || !hasExpenseSession() || session?.id !== confirmation.request.expectedCashSessionId) {
                    set({ outcome: 'sessionConflict' });
                    return;
                }
                attempt = { key: `expense-${ crypto.randomUUID() }`, request: expenseRequest({
                    ...confirmation.request, description: confirmation.request.description || ''
                }, confirmation.request.expectedCashSessionId) };
            }
            const { amount, category, description } = attempt.request;
            const draft = { amount, category, description: description || '' };
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 0, state: {
                    owner, draft, attempt, result: null, outcome: 'uncertain'
                } }));
            } catch {
                set({ outcome: 'storageUnavailable' });
                return;
            }
            set({ draft, attempt });
            const { data: response } = await createExpense(attempt.request, attempt.key);
            const result = response?.data;
            if (!result?.id || result.cashSessionId !== attempt.request.expectedCashSessionId || result.amount == null || !result.category
                || typeof result.voided !== 'boolean' || typeof result.operationalExpense !== 'boolean'
                || !result.createdAt || !result.createdBy) throw new Error('Incomplete expense response');
            set({ result, attempt: null, outcome: 'success' });
        } catch (error) {
            const keyConflict = error.domainCode === 'expense_idempotency_conflict';
            const rejected = !replay && !keyConflict && ([400, 401, 403, 422].includes(error.status)
                || error.domainCode === 'cash_session_conflict');
            set({
                attempt: rejected ? null : get().attempt,
                outcome: keyConflict ? 'keyConflict' : !attempt ? 'sessionError'
                    : !rejected ? 'uncertain' : error.domainCode === 'cash_session_conflict' ? 'sessionConflict' : 'rejected'
            });
            if (error.domainCode === 'cash_session_conflict' && canUseExpense(get())) {
                await refreshSession().catch(() => {});
            }
        } finally {
            set({ pending: false });
        }
        if (get().result && canUseExpense(get())) await refreshSession().catch(() => {});
    }
}), {
    name: STORAGE_KEY, storage: createJSONStorage(() => storage),
    partialize: ({ owner, draft, attempt, result, outcome }) => ({
        owner, draft, attempt, result, outcome: attempt && outcome !== 'keyConflict' ? 'uncertain' : outcome
    })
}));

export default useExpenseStore;
