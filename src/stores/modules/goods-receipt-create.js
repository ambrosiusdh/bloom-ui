import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import goodsReceiptApi from '@api/goods-receipt.js';
import {
    isReceiptSubmissionResult,
    migrateReceiptDraft,
    newReceiptDraft,
    receiptRequest,
    validateReceipt
} from '@components/goods-receipt/receipt-create.js';
import useAuthStore from '@stores/modules/auth.js';
import useCashSessionStore from '@stores/modules/cash-session.js';

const STORAGE_KEY = 'bloom-receipt-create-v1';
const STORAGE_VERSION = 2;
const currentAccountId = () => {
    const auth = useAuthStore.getState();
    return auth.authStatus === 'authenticated' ? auth.currentUser?.accountId : null;
};

export const canUseReceiptCreate = (state, accountId = currentAccountId()) => Boolean(
    accountId && (state.ownerAccountId === accountId
        || (!state.ownerAccountId && !state.attempt && !state.result))
);
const tabStorage = {
    getItem: name => {
        try {
            return sessionStorage.getItem(name);
        } catch {
            return null;
        }
    },
    setItem: (name, value) => {
        try {
            sessionStorage.setItem(name, value);
        } catch {
            // Posting checks durable recovery below.
        }
    },
    removeItem: name => {
        try {
            sessionStorage.removeItem(name);
        } catch {
            // Keep the in-memory draft.
        }
    }
};

// Separate from paged receipt reads: a pending operation survives route changes.
const useGoodsReceiptCreateStore = create(persist((set, get) => ({
    draft: newReceiptDraft(),
    ownerAccountId: null,
    attempt: null,
    result: null,
    pending: false,
    outcome: 'editing',
    errors: {},
    updateDraft: draft => {
        if (canUseReceiptCreate(get()) && !get().pending && !get().attempt && !get().result) {
            set({
                ownerAccountId: currentAccountId(),
                draft,
                errors: {}
            });
        }
    },
    reset: () => {
        if (currentAccountId() && !get().attempt && !get().pending) {
            set({
                ownerAccountId: currentAccountId(),
                draft: newReceiptDraft(),
                result: null,
                outcome: 'editing',
                errors: {}
            });
        }
    },
    resolveSubmission: async () => {
        const { attempt, ownerAccountId } = get();
        if (!canUseReceiptCreate(get()) || !attempt || get().pending || get().outcome === 'keyConflict') return;

        set({
            pending: true,
            outcome: 'checking'
        });

        try {
            const response = await goodsReceiptApi.getGoodsReceiptSubmission(attempt.key, { useLoader: false });
            const result = response?.data?.data;
            if (!isReceiptSubmissionResult(result, attempt.request)) {
                throw new Error('Incomplete receipt submission lookup');
            }
            if (get().ownerAccountId !== ownerAccountId) return;

            set({
                result,
                attempt: null,
                outcome: 'success'
            });
        } catch (error) {
            if (get().ownerAccountId !== ownerAccountId) return;

            set({
                outcome: error.domainCode === API_DOMAIN_ERROR_CODE.GOODS_RECEIPT_SUBMISSION_NOT_FOUND
                    ? 'submissionMissing' : 'uncertain'
            });
        } finally {
            if (get().ownerAccountId === ownerAccountId) set({ pending: false });
        }
    },
    submit: async (preparedRequest, expectedCashSessionId) => {
        if (!canUseReceiptCreate(get()) || get().pending || get().result) return;
        if (get().attempt) {
            await get().resolveSubmission();
            return;
        }

        const errors = validateReceipt(get().draft);
        if (Object.keys(errors).length) {
            set({ errors });

            return;
        }

        const ownerAccountId = currentAccountId();
        const attempt = {
            key: `receipt-${ crypto.randomUUID() }`,
            request: preparedRequest || receiptRequest(get().draft)
        };

        set({
            ownerAccountId,
            pending: true,
            errors: {}
        });

        if (attempt.request.initialPayment?.paymentMethod === 'CASH') {
            try {
                const session = await useCashSessionStore.getState().getCurrentSession({ timeout: 15000 });
                if (session?.status !== 'OPEN'
                    || (expectedCashSessionId != null && session.id !== expectedCashSessionId)) {
                    throw new Error('Cash session changed');
                }
            } catch {
                set({
                    pending: false,
                    outcome: 'sessionConflict',
                    errors: {
                        'initialPayment.paymentMethod': 'Periksa sesi kas yang terbuka lalu tinjau pembayaran awal kembali.'
                    }
                });
                return;
            }
        }

        if (currentAccountId() !== ownerAccountId) {
            set({ pending: false });
            return;
        }

        try {
            // Do not send until the exact recovery payload is durably saved in this tab.
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: STORAGE_VERSION,
                state: {
                    ownerAccountId,
                    draft: get().draft,
                    attempt,
                    result: null,
                    outcome: 'uncertain'
                }
            }));
        } catch {
            set({
                pending: false,
                outcome: 'storageUnavailable'
            });

            return;
        }

        set({
            attempt,
            pending: true,
            outcome: 'pending',
            errors: {}
        });

        try {
            const response = await goodsReceiptApi.createGoodsReceipt(
                attempt.request,
                attempt.key,
                { useLoader: false }
            );
            const result = response?.data?.data;
            if (!isReceiptSubmissionResult(result, attempt.request)) {
                throw new Error('Incomplete receipt response');
            }

            set({
                result,
                attempt: null,
                outcome: 'success'
            });
        } catch (error) {
            const keyConflict = error.domainCode === API_DOMAIN_ERROR_CODE.GOODS_RECEIPT_IDEMPOTENCY_CONFLICT;
            const rejected = !keyConflict
                && [400, 401, 403, 404, 409, 422].includes(error.status);
            const errors = {};

            error.validationErrors?.forEach(({ field }) => {
                const name = ({
                    supplierCode: 'supplier',
                    receivedDate: 'receivedDate',
                    'initialPayment.paidAt': 'initialPayment.paymentMethod'
                })[field] || field;
                errors[name] = field === 'initialPayment.paidAt'
                    ? 'Waktu pembayaran ditolak. Periksa jam perangkat lalu buka tinjauan kembali.'
                    : 'Nilai ditolak server. Periksa kembali masukan ini.';
            });

            if (error.domainCode === API_DOMAIN_ERROR_CODE.GOODS_RECEIPT_CODE_ALREADY_EXISTS) {
                errors.code = 'Kode penerimaan sudah digunakan. Gunakan kode lain atau kosongkan untuk kode otomatis. Kode penerimaan yang dibatalkan tetap terpakai.';
            }
            if (error.domainCode === API_DOMAIN_ERROR_CODE.GOODS_RECEIPT_CODE_INVALID) {
                errors.code = 'Kode ditolak. Gunakan maksimal 100 karakter tanpa spasi di dalam atau karakter kontrol.';
            }
            if (error.domainCode === API_DOMAIN_ERROR_CODE.SUPPLIER_PAYMENT_CONFLICT) {
                errors['initialPayment.amount'] = 'Pembayaran awal ditolak. Periksa nominal terhadap total resmi penerimaan.';
            }
            if (error.domainCode === API_DOMAIN_ERROR_CODE.CASH_SESSION_CONFLICT) {
                errors['initialPayment.paymentMethod'] = 'Pembayaran tunai memerlukan sesi kas terbuka dan waktu pembayaran yang sesuai. Periksa sesi serta jam perangkat.';
            }

            set({
                attempt: rejected ? null : attempt,
                errors,
                outcome: keyConflict
                    ? 'keyConflict'
                    : rejected
                    ? error.status === 409 ? 'conflict' : error.status === 401 ? 'authentication'
                        : error.status === 403 ? 'authorization' : 'rejected'
                    : 'uncertain'
            });
        } finally {
            set({ pending: false });
        }
    }
}), {
    name: STORAGE_KEY,
    version: STORAGE_VERSION,
    storage: createJSONStorage(() => tabStorage),
    migrate: persisted => ({
        ...persisted,
        draft: migrateReceiptDraft(persisted?.draft)
    }),
    partialize: ({ ownerAccountId, draft, attempt, result, outcome }) => ({
        ownerAccountId,
        draft,
        attempt,
        result,
        outcome: attempt && outcome !== 'keyConflict' ? 'uncertain' : outcome
    })
}));

export default useGoodsReceiptCreateStore;
