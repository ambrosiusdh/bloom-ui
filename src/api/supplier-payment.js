import api from '@api/index.js';
import { SUPPLIER_PAYMENT } from '@api/path/index.js';

export const SUPPLIER_PAYMENT_TIMEOUT_MS = 15000;

const createSupplierPayment = async (code, payload, idempotencyKey, options) => {
    return api({
        url: SUPPLIER_PAYMENT.create(code),
        method: 'POST',
        data: payload,
        headers: { 'Idempotency-Key': idempotencyKey },
        timeout: SUPPLIER_PAYMENT_TIMEOUT_MS
    }, options);
};

export default {
    createSupplierPayment
};
