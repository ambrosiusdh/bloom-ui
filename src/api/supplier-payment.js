import api from '@api/index.js';

export const createSupplierPayment = (code, request, key) => api({
    url: `/api/goods-receipts/${ encodeURIComponent(code) }/payments`,
    method: 'POST', data: request, headers: { 'Idempotency-Key': key }
});
