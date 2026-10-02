import api from '@api/index.js';
import { SUPPLIER_PAYMENT } from '@api/path/index.js';

export const SUPPLIER_PAYMENT_TIMEOUT_MS = 15000;

const getReadRequestArguments = (configOrOptions = {}, options) => {
    const { useLoader, ...config } = configOrOptions || {};

    return {
        config,
        options: options ?? (useLoader === undefined ? undefined : { useLoader })
    };
};

const getSupplierPaymentHistory = async (code, params, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);

    return api({
        url: SUPPLIER_PAYMENT.history,
        method: 'GET',
        ...request.config,
        params: {
            ...params,
            code
        }
    }, request.options);
};

const createSupplierPayment = async (code, payload, idempotencyKey, options) => {
    return api({
        url: SUPPLIER_PAYMENT.create,
        method: 'POST',
        params: { code },
        data: payload,
        headers: { 'Idempotency-Key': idempotencyKey },
        timeout: SUPPLIER_PAYMENT_TIMEOUT_MS
    }, options);
};

export default {
    getSupplierPaymentHistory,
    createSupplierPayment
};
