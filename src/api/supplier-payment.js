import api from '@api/index.js';

export const SUPPLIER_PAYMENT_TIMEOUT_MS = 15000;

export const createSupplierPayment = (code, request, key) => api({
    url: `/api/goods-receipts/${ encodeURIComponent(code) }/payments`,
    method: 'POST', data: request, headers: { 'Idempotency-Key': key },
    timeout: SUPPLIER_PAYMENT_TIMEOUT_MS
});
