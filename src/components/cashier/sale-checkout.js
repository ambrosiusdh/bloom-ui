const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;
const DECIMAL_SCALE = 10000n;

const toScaledDecimal = value => {
    const normalized = String(value ?? '').trim().replace(',', '.');
    if (!/^\d+(?:\.\d{0,4})?$/.test(normalized)) return null;

    const [integerPart, fractionalPart = ''] = normalized.split('.');
    return (BigInt(integerPart || '0') * DECIMAL_SCALE)
        + BigInt(fractionalPart.padEnd(4, '0'));
};

const fromScaledDecimal = value => {
    const integerPart = value / DECIMAL_SCALE;
    const fractionalPart = String(value % DECIMAL_SCALE).padStart(4, '0').replace(/0+$/, '');

    return fractionalPart ? `${ integerPart }.${ fractionalPart }` : String(integerPart);
};

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

export const validateDiscountAmount = value => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return '';
    if (!DECIMAL_PATTERN.test(trimmedValue)) return 'Masukkan nominal diskon yang valid.';

    const [integerPart, fractionalPart = ''] = trimmedValue.split('.');
    if (integerPart.length > 15) return 'Maksimal 15 angka sebelum tanda desimal.';
    if (fractionalPart.length > 4) return 'Maksimal 4 angka di belakang tanda desimal.';
    return '';
};

export const getAdvisorySaleEstimate = (items, discountAmount = '0') => {
    const lineAmounts = {};
    let subtotal = 0n;
    let hasInvalidLine = false;

    items.forEach(item => {
        const price = toScaledDecimal(item.price);
        const quantity = toScaledDecimal(item.quantity);

        if (price === null || quantity === null) {
            hasInvalidLine = true;
            return;
        }

        const lineAmount = ((price * quantity) + (DECIMAL_SCALE / 2n)) / DECIMAL_SCALE;
        lineAmounts[item.sku] = fromScaledDecimal(lineAmount);
        subtotal += lineAmount;
    });

    const discount = toScaledDecimal(discountAmount) ?? 0n;
    const total = subtotal > discount ? subtotal - discount : 0n;

    return {
        lineAmounts,
        subtotalAmount: fromScaledDecimal(subtotal),
        totalAmount: fromScaledDecimal(total),
        hasInvalidLine
    };
};

export const createSaleRequest = (
    items,
    paymentType,
    paidAmount,
    discountAmount = '0',
    description = ''
) => ({
    discountAmount: discountAmount.trim() || '0',
    paidAmount: paidAmount.trim(),
    description: description.trim(),
    paymentType,
    saleItemList: items.map(item => ({
        itemSku: item.sku,
        quantity: item.quantity,
        stockLocation: 'STORE'
    }))
});

export const getSaleRequestSignature = request => JSON.stringify(request);
