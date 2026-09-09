export const SUPPLIER_CODE_MAX_LENGTH = 255;

export const isValidSupplierCode = code => typeof code === 'string'
    && Boolean(code.trim())
    && code.length <= SUPPLIER_CODE_MAX_LENGTH;

export const getSupplierListReturnTo = value => typeof value === 'string'
    && (value === '/suppliers' || value.startsWith('/suppliers?'))
    ? value
    : '/suppliers';

export const getSupplierDetailReturnTo = value => typeof value === 'string'
    && (value === '/payables' || value.startsWith('/payables?'))
    ? value
    : getSupplierListReturnTo(value);
