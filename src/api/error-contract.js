export const API_DOMAIN_ERROR_CODE = Object.freeze({
    ITEM_CATEGORY_ALREADY_EXISTS: 'item_category_already_exists',
    PRINTER_NOT_FOUND: 'printer_not_found',
    SALE_NOT_FOUND: 'sale_not_found',
    SALE_INSUFFICIENT_STOCK: 'sale_insufficient_stock',
    SALE_PAID_LESS_THAN_TOTAL: 'sale_paid_less_than_total',
    SALE_QRIS_PAYMENT_MISMATCH: 'sale_qris_payment_mismatch',
    CASH_SESSION_CONFLICT: 'cash_session_conflict',
    CHECKOUT_IDEMPOTENCY_CONFLICT: 'checkout_idempotency_conflict'
});

const STRUCTURED_DOMAIN_CODES = new Set([
    API_DOMAIN_ERROR_CODE.SALE_INSUFFICIENT_STOCK,
    API_DOMAIN_ERROR_CODE.SALE_PAID_LESS_THAN_TOTAL,
    API_DOMAIN_ERROR_CODE.SALE_QRIS_PAYMENT_MISMATCH
]);

const DOMAIN_ERROR_TYPES = Object.freeze({
    CashSessionConflictException: API_DOMAIN_ERROR_CODE.CASH_SESSION_CONFLICT,
    CheckoutIdempotencyConflictException: API_DOMAIN_ERROR_CODE.CHECKOUT_IDEMPOTENCY_CONFLICT
});

const LEGACY_DOMAIN_ERRORS = Object.freeze({
    '400:ResponseStatusException:Item Category already exists': API_DOMAIN_ERROR_CODE.ITEM_CATEGORY_ALREADY_EXISTS,
    '404:ResponseStatusException:Transaksi tidak ditemukan': API_DOMAIN_ERROR_CODE.SALE_NOT_FOUND,
    '500:ResponseStatusException:Printer tidak ditemukan': API_DOMAIN_ERROR_CODE.PRINTER_NOT_FOUND
});

export const getLegacyDomainErrorCode = (status, data) => {
    if (typeof data?.code === 'string' && STRUCTURED_DOMAIN_CODES.has(data.code)) {
        return data.code;
    }

    if (status === 409 && DOMAIN_ERROR_TYPES[data?.errorType]) {
        return DOMAIN_ERROR_TYPES[data.errorType];
    }

    const key = `${ status }:${ data?.errorType }:${ data?.message }`;
    return LEGACY_DOMAIN_ERRORS[key] || null;
};
