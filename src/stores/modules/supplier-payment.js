import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import goodsReceiptApi from '@api/goods-receipt.js';
import { createSupplierPayment } from '@api/supplier-payment.js';
import { getMoneySign, validateCashAmount } from '@components/cash-session/cash-session-money.js';
import useCashSessionStore from '@stores/modules/cash-session.js';
import useGoodsReceiptStore from '@stores/modules/goods-receipt.js';

const STORAGE_KEY = 'bloom-supplier-payment-v1';
const initial = code => ({ code, draft: { amount: '', paymentMethod: 'BANK_TRANSFER', reference: '', note: '' },
    attempt: null, result: null, outcome: 'editing', error: '', pending: false, refreshStatus: 'idle' });
const storage = {
    getItem: key => { try { return sessionStorage.getItem(key); } catch { return null; } },
    setItem: (key, value) => { try { sessionStorage.setItem(key, value); } catch { /* Submit checks durability. */ } },
    removeItem: key => { try { sessionStorage.removeItem(key); } catch { /* Retain in memory. */ } }
};
export const validatePayment = draft => validateCashAmount(draft.amount, 'Nominal pembayaran')
    || (getMoneySign(draft.amount) <= 0 ? 'Nominal pembayaran harus lebih dari nol.' : '')
    || (!['CASH', 'BANK_TRANSFER', 'QRIS'].includes(draft.paymentMethod) ? 'Pilih metode pembayaran.' : '')
    || (draft.reference.length > 255 || draft.note.length > 255 ? 'Referensi dan catatan maksimal 255 karakter.' : '');

// One unresolved payment per tab, including across navigation and authentication redirects.
const useSupplierPaymentStore = create(persist((set, get) => ({
    ...initial(''),
    select: code => { if (get().code !== code && !get().attempt && !get().pending) set(initial(code)); },
    edit: draft => { if (!get().attempt && !get().pending && !get().result) set({ draft, error: '' }); },
    next: () => { if (!get().attempt && !get().pending && get().refreshStatus === 'ready') set(initial(get().code)); },
    refresh: async () => {
        const code = get().code;
        if (get().refreshStatus === 'loading') return;
        set({ refreshStatus: 'loading' });
        try {
            const { data: response } = await goodsReceiptApi.getGoodsReceiptDetails(code);
            const receipt = response?.data;
            if (receipt?.code !== code || !receipt.status || !receipt.paymentStatus
                || ['totalAmount', 'paidAmount', 'outstandingAmount'].some(field => receipt[field] == null)) {
                throw new Error('Incomplete receipt response');
            }
            if (get().code !== code) return;
            if (useGoodsReceiptStore.getState().goodsReceiptDetails?.code === code) {
                useGoodsReceiptStore.setState({ goodsReceiptDetails: receipt });
            }
            set({ refreshStatus: 'ready' });
        } catch { if (get().code === code) set({ refreshStatus: 'error' }); }
    },
    submit: async paidAt => {
        if (get().pending || get().result || get().outcome === 'keyConflict') return;
        const replay = !!get().attempt;
        const { draft, code } = get();
        if (!replay) {
            const error = validatePayment(draft);
            if (error) { set({ error }); return; }
            if (draft.paymentMethod === 'CASH' && !useCashSessionStore.getState().drawerActionsEnabled) {
                set({ outcome: 'sessionConflict' }); return;
            }
        }
        const attempt = get().attempt || { code, key: `payment-${ crypto.randomUUID() }`,
            request: { amount: draft.amount.trim(), paymentMethod: draft.paymentMethod, paidAt,
                reference: draft.reference.trim() || null, note: draft.note.trim() || null } };
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 0, state: {
                code, draft, attempt, result: null, outcome: 'uncertain'
            } }));
        } catch { set({ outcome: 'storageUnavailable' }); return; }
        set({ attempt, pending: true, outcome: 'pending', error: '' });
        try {
            const { data: response } = await createSupplierPayment(attempt.code, attempt.request, attempt.key);
            const result = response?.data;
            if (!result?.id || result.receiptCode !== attempt.code || result.idempotencyKey !== attempt.key
                || result.amount == null || result.paymentMethod !== attempt.request.paymentMethod
                || typeof result.voided !== 'boolean'
                || (result.paymentMethod === 'CASH' && !result.cashSessionId)) {
                throw new Error('Incomplete payment response');
            }
            set({ result, attempt: null, outcome: 'success' });
            await get().refresh();
        } catch (error) {
            const keyConflict = error.domainCode === 'supplier_payment_idempotency_conflict';
            const rejected = !replay && !keyConflict && [400, 401, 403, 404, 409, 422].includes(error.status);
            set({ attempt: rejected ? null : attempt, outcome: keyConflict ? 'keyConflict' : !rejected ? 'uncertain'
                : error.domainCode === 'cash_session_conflict' ? 'sessionConflict'
                    : error.status === 409 ? 'conflict' : 'rejected' });
            if (error.domainCode === 'cash_session_conflict') {
                await useCashSessionStore.getState().getCurrentSession().catch(() => {});
            }
            if (rejected) await get().refresh();
        } finally { set({ pending: false }); }
        if (attempt.request.paymentMethod === 'CASH' && get().result) {
            await useCashSessionStore.getState().getCurrentSession().catch(() => {});
        }
    }
}), {
    name: STORAGE_KEY, storage: createJSONStorage(() => storage),
    partialize: ({ code, draft, attempt, result, outcome }) => ({ code, draft, attempt, result,
        outcome: attempt && outcome !== 'keyConflict' ? 'uncertain' : outcome })
}));

export default useSupplierPaymentStore;
