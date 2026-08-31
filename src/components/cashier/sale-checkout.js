const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;

export const PAYMENT_TYPES = Object.freeze({
    CASH: 'CASH',
    QRIS: 'QRIS'
});

export const createSaleIdempotencyKey = () => {
    const identifier = globalThis.crypto?.randomUUID?.()
        || `${ Date.now() }-${ Math.random().toString(16).slice(2) }`;
    return `sale-${ identifier }`;
};

export const validatePaidAmount = value => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return 'Jumlah pembayaran wajib diisi.';
    if (!DECIMAL_PATTERN.test(trimmedValue)) return 'Masukkan nominal uang yang valid.';

    const [integerPart, fractionalPart = ''] = trimmedValue.split('.');
    if (integerPart.length > 15) return 'Maksimal 15 angka sebelum tanda desimal.';
    if (fractionalPart.length > 4) return 'Maksimal 4 angka di belakang tanda desimal.';
    return '';
};

export const createSaleRequest = (items, paymentType, paidAmount) => ({
    discountAmount: '0',
    paidAmount: paidAmount.trim(),
    description: '',
    paymentType,
    saleItemList: items.map(item => ({
        itemSku: item.sku,
        quantity: item.quantity,
        stockLocation: 'STORE'
    }))
});

export const getSaleRequestSignature = request => JSON.stringify(request);

