export const GOODS_RECEIPT_REFERENCE_MAX_LENGTH = 100;

export const GOODS_RECEIPT_STATUS_LABELS = {
    POSTED: 'Dibukukan',
    CANCELLED: 'Dibatalkan'
};

export const GOODS_RECEIPT_PAYMENT_STATUS_LABELS = {
    UNPAID: 'Belum dibayar',
    PARTIALLY_PAID: 'Dibayar sebagian',
    PAID: 'Lunas'
};

export const GOODS_RECEIPT_LOCATION_LABELS = {
    STORE: 'Toko',
    WAREHOUSE: 'Gudang'
};

export const getGoodsReceiptStatusColor = value => value === 'PAID' || value === 'POSTED'
    ? 'success'
    : value === 'PARTIALLY_PAID' ? 'warning' : 'default';

export const isValidGoodsReceiptReference = reference => typeof reference === 'string'
    && Boolean(reference.trim())
    && reference.length <= GOODS_RECEIPT_REFERENCE_MAX_LENGTH;
