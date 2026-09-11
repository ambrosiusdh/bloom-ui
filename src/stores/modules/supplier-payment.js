import { create } from 'zustand';
import {
    createJSONStorage,
    persist
} from 'zustand/middleware';

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import goodsReceiptApi from '@api/goods-receipt.js';
import supplierPaymentApi, { SUPPLIER_PAYMENT_TIMEOUT_MS } from '@api/supplier-payment.js';
import useAuthStore from '@stores/modules/auth.js';
import useCashSessionStore from '@stores/modules/cash-session.js';
import useGoodsReceiptStore from '@stores/modules/goods-receipt.js';
import { validatePayment } from '@utils/supplier-payment-utils.js';

const STORAGE_KEY = 'bloom-supplier-payment-v1';
const createSupplierPaymentState = (code, owner = null) => ({
    code,
    owner,
    draft: { amount: '', paymentMethod: 'BANK_TRANSFER', reference: '', note: '' },
    attempt: null,
    result: null,
    outcome: 'editing',
    error: '',
    pending: false,
    refreshStatus: 'idle'
});

const currentOwner = () => {
    const auth = useAuthStore.getState();
    return auth.authStatus === 'authenticated' ? auth.currentUser?.username : null;
};
export const canUsePayment = (state, owner = currentOwner()) => !!owner && state.owner === owner;
export const isPaymentLocked = state => state.pending || !!state.attempt || !!state.result
    || ['loading', 'error'].includes(state.refreshStatus);
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
        } catch { /* Submit checks durability. */
        }
    },
    removeItem: key => {
        try {
            sessionStorage.removeItem(key);
        } catch { /* Retain in memory. */
        }
    }
};

// One unresolved payment per tab, including across navigation and authentication redirects.
const useSupplierPaymentStore = create(persist((set, get) => ({
    ...createSupplierPaymentState(''),
    select: code => {
        const owner = currentOwner();
        if (owner && !isPaymentLocked(get()) && (get().code !== code || get().owner !== owner)) {
            set(createSupplierPaymentState(code, owner));
        }
    },

    edit: draft => {
        if (canUsePayment(get()) && !isPaymentLocked(get())) {
            set({ draft, error: '' });
        }
    },

    next: () => {
        if (canUsePayment(get()) && get().result && !get().pending && get().refreshStatus === 'ready') {
            set(createSupplierPaymentState(get().code, get().owner));
        }
    },

    refresh: async () => {
        const { code, owner } = get();
        if (!canUsePayment(get()) || get().refreshStatus === 'loading') {
            return;
        }
        set({ refreshStatus: 'loading' });
        try {
            const { data: response } = await goodsReceiptApi.getGoodsReceiptDetails(code, { timeout: SUPPLIER_PAYMENT_TIMEOUT_MS });
            const receipt = response?.data;
            if (receipt?.code !== code || !receipt.status || !receipt.paymentStatus
                || ['totalAmount', 'paidAmount', 'outstandingAmount'].some(field => receipt[field] == null)) {
                throw new Error('Incomplete receipt response');
            }
            if (get().code !== code || get().owner !== owner) {
                return;
            }
            if (!canUsePayment(get())) {
                set({ refreshStatus: 'idle' });
                return;
            }
            if (useGoodsReceiptStore.getState().goodsReceiptDetails?.code === code) {
                useGoodsReceiptStore.setState({ goodsReceiptDetails: receipt });
            }
            set({ refreshStatus: 'ready' });
        } catch {
            if (get().code === code && get().owner === owner) {
                set({ refreshStatus: canUsePayment(get()) ? 'error' : 'idle' });
            }
        }
    },

    submit: async confirmation => {
        if (!canUsePayment(get()) || get().pending || get().result || get().outcome === 'keyConflict') {
            return;
        }
        const replay = !!get().attempt;
        const { code, owner } = get();
        if (!replay) {
            if (isPaymentLocked(get()) || confirmation?.code !== code || confirmation?.owner !== owner) {
                return;
            }
            const error = validatePayment(confirmation.request);
            if (error) {
                set({ error });
                return;
            }
            const cash = useCashSessionStore.getState();
            if (confirmation.request.paymentMethod === 'CASH' && (cash.currentStatus !== 'ready' || !cash.drawerActionsEnabled)) {
                set({ outcome: 'sessionConflict' });
                return;
            }
        }
        const attempt = get().attempt || {
            code,
            key: `payment-${ crypto.randomUUID() }`,
            request: { ...confirmation.request }
        };
        const { amount, paymentMethod, reference, note } = attempt.request;
        const draft = { amount, paymentMethod, reference: reference || '', note: note || '' };
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: 0,
                state: {
                    code, owner, draft, attempt, result: null, outcome: 'uncertain'
                }
            }));
        } catch {
            set({ outcome: 'storageUnavailable' });
            return;
        }
        set({ draft, attempt, pending: true, outcome: 'pending', error: '' });
        try {
            const { data: response } = await supplierPaymentApi.createSupplierPayment(attempt.code, attempt.request, attempt.key);
            const result = response?.data;
            if (!result?.id || result.receiptCode !== attempt.code || result.idempotencyKey !== attempt.key
                || result.amount == null || result.paymentMethod !== attempt.request.paymentMethod
                || typeof result.voided !== 'boolean'
                || (result.paymentMethod === 'CASH' && !result.cashSessionId)) {
                throw new Error('Incomplete payment response');
            }
            set({ result, attempt: null, outcome: 'success', refreshStatus: 'idle' });
            await get().refresh();
        } catch (error) {
            const keyConflict = error.domainCode === API_DOMAIN_ERROR_CODE.SUPPLIER_PAYMENT_IDEMPOTENCY_CONFLICT;
            const sessionConflict = error.domainCode === API_DOMAIN_ERROR_CODE.CASH_SESSION_CONFLICT;
            const rejected = !replay && !keyConflict && [400, 401, 403, 404, 409, 422].includes(error.status);
            set({
                attempt: rejected ? null : attempt,
                outcome: keyConflict ? 'keyConflict' : !rejected ? 'uncertain'
                    : sessionConflict ? 'sessionConflict'
                        : error.status === 409 ? 'conflict'
                            : error.validationErrors?.some(({ field }) => field === 'paidAt') ? 'clockInvalid' : 'rejected'
            });
            if (sessionConflict && canUsePayment(get())) {
                await useCashSessionStore.getState().getCurrentSession({ timeout: SUPPLIER_PAYMENT_TIMEOUT_MS }).catch(() => {
                });
            }
            if (rejected) {
                await get().refresh();
            }
        } finally {
            set({ pending: false });
        }
        if (attempt.request.paymentMethod === 'CASH' && get().result && canUsePayment(get())) {
            await useCashSessionStore.getState().getCurrentSession({ timeout: SUPPLIER_PAYMENT_TIMEOUT_MS }).catch(() => {
            });
        }
    }
}), {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => storage),
    partialize: ({ code, owner, draft, attempt, result, outcome }) => ({
        code, owner, draft, attempt, result,
        outcome: attempt && outcome !== 'keyConflict' ? 'uncertain' : outcome
    })
}));

export default useSupplierPaymentStore;
