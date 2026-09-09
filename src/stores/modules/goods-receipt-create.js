import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import goodsReceiptApi from '@api/goods-receipt.js';
import { newReceiptDraft, receiptRequest, validateReceipt } from '@components/goods-receipt/receipt-create.js';

const STORAGE_KEY = 'bloom-receipt-create-v1';
const tabStorage = {
    getItem: name => { try { return sessionStorage.getItem(name); } catch { return null; } },
    setItem: (name, value) => { try { sessionStorage.setItem(name, value); } catch { /* Posting checks durable recovery below. */ } },
    removeItem: name => { try { sessionStorage.removeItem(name); } catch { /* Keep the in-memory draft. */ } }
};

// Separate from paged receipt reads: a pending operation survives route changes.
const useGoodsReceiptCreateStore = create(persist((set, get) => ({
    draft: newReceiptDraft(), attempt: null, result: null, pending: false,
    outcome: 'editing', errors: {},
    updateDraft: draft => { if (!get().attempt && !get().result) set({ draft, errors: {} }); },
    reset: () => { if (!get().attempt && !get().pending) set({ draft: newReceiptDraft(), result: null, outcome: 'editing', errors: {} }); },
    submit: async () => {
        if (get().pending || get().result) return;
        const uncertain = !!get().attempt;
        const errors = validateReceipt(get().draft);
        if (!uncertain && Object.keys(errors).length) { set({ errors }); return; }
        const attempt = get().attempt || {
            key: `receipt-${ crypto.randomUUID() }`, request: receiptRequest(get().draft)
        };
        try {
            // Do not send until the exact recovery payload is durably saved in this tab.
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 0, state: {
                draft: get().draft, attempt, result: null, outcome: 'uncertain'
            } }));
        } catch {
            set({ outcome: 'storageUnavailable' });
            return;
        }
        set({ attempt, pending: true, outcome: 'pending', errors: {} });
        try {
            const response = await goodsReceiptApi.createGoodsReceipt(attempt.request, attempt.key, { useLoader: false });
            const result = response?.data?.data;
            if (!result?.code || !result.status || !result.paymentStatus
                || !Array.isArray(result.items) || !result.items.length
                || ['totalAmount', 'paidAmount', 'outstandingAmount'].some(field => result[field] == null)) {
                throw new Error('Incomplete receipt response');
            }
            set({ result, attempt: null, outcome: 'success' });
        } catch (error) {
            const keyConflict = error.domainCode === API_DOMAIN_ERROR_CODE.GOODS_RECEIPT_IDEMPOTENCY_CONFLICT;
            // A rejection of a replay does not prove the earlier request rolled back.
            const rejected = !uncertain && !keyConflict && [400, 401, 403, 404, 409, 422].includes(error.status);
            const errors = {};
            error.validationErrors?.forEach(({ field }) => {
                const name = ({ supplierCode: 'supplier', receivedDate: 'receivedTime' })[field] || field;
                errors[name] = 'Nilai ditolak server. Periksa kembali masukan ini.';
            });
            set({ attempt: rejected ? null : attempt, errors,
                outcome: keyConflict ? 'keyConflict' : rejected
                    ? error.status === 409 ? 'conflict' : error.status === 401 ? 'authentication'
                        : error.status === 403 ? 'authorization' : 'rejected'
                    : 'uncertain' });
        } finally { set({ pending: false }); }
    }
}), {
    name: STORAGE_KEY, storage: createJSONStorage(() => tabStorage),
    partialize: ({ draft, attempt, result, outcome }) => ({
        draft, attempt, result, outcome: attempt && outcome !== 'keyConflict' ? 'uncertain' : outcome
    })
}));

export default useGoodsReceiptCreateStore;
