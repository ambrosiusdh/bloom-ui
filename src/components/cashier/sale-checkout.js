const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;
const DECIMAL_SCALE = 10000n;

export const SALE_CHECKOUT_RECOVERY_STORAGE_KEY = 'bloom-sale-checkout-recovery-v1';

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

export const getAdvisoryCashChange = (paidAmount, totalAmount) => {
    const paid = toScaledDecimal(paidAmount);
    const total = toScaledDecimal(totalAmount);

    if (paid === null || total === null || paid < total) return null;

    return fromScaledDecimal(paid - total);
};

export const getAdvisoryCashShortcuts = totalAmount => {
    const total = toScaledDecimal(totalAmount);
    if (total === null) return [];

    const wholeRupiah = (total + DECIMAL_SCALE - 1n) / DECIMAL_SCALE;
    const step = wholeRupiah <= 100000n
        ? 10000n
        : wholeRupiah <= 500000n
            ? 50000n
            : 100000n;
    const firstRoundedTender = ((wholeRupiah + step - 1n) / step) * step;
    const candidateValues = [
        fromScaledDecimal(total),
        String(firstRoundedTender),
        String(firstRoundedTender + step)
    ];

    return candidateValues.filter((value, index) => candidateValues.indexOf(value) === index);
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

const hasValidCheckoutRequest = request => request
    && typeof request === 'object'
    && Object.values(PAYMENT_TYPES).includes(request.paymentType)
    && typeof request.paidAmount === 'string'
    && typeof request.discountAmount === 'string'
    && typeof request.description === 'string'
    && Array.isArray(request.saleItemList)
    && request.saleItemList.length > 0
    && request.saleItemList.every(line => line
        && typeof line.itemSku === 'string'
        && !!line.itemSku
        && typeof line.quantity === 'string'
        && line.stockLocation === 'STORE');

const hasValidCheckoutAttempt = attempt => attempt
    && typeof attempt === 'object'
    && typeof attempt.ownerAccountId === 'string'
    && !!attempt.ownerAccountId
    && typeof attempt.key === 'string'
    && !!attempt.key
    && attempt.key.length <= 100
    && hasValidCheckoutRequest(attempt.request)
    && attempt.signature === getSaleRequestSignature(attempt.request)
    && Array.isArray(attempt.displayLines)
    && attempt.displayLines.every(line => line
        && typeof line.sku === 'string'
        && !!line.sku
        && typeof line.name === 'string'
        && typeof line.quantity === 'string'
        && typeof line.baseUnitOfMeasure === 'string');

export const readSaleCheckoutRecovery = ownerAccountId => {
    let rawState;

    try {
        rawState = sessionStorage.getItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY);
    } catch {
        return { status: 'unavailable' };
    }

    if (!rawState) return { status: 'empty' };

    try {
        const persistedState = JSON.parse(rawState);
        const attempt = persistedState?.attempt;

        if (persistedState?.version !== 1 || !hasValidCheckoutAttempt(attempt)
            || persistedState.ownerAccountId !== attempt.ownerAccountId) {
            return { status: 'quarantined' };
        }

        if (!ownerAccountId || persistedState.ownerAccountId !== ownerAccountId) {
            return { status: 'foreign' };
        }

        return {
            status: 'available',
            attempt
        };
    } catch {
        return { status: 'quarantined' };
    }
};

export const persistSaleCheckoutAttempt = (ownerAccountId, attempt) => {
    if (!ownerAccountId || attempt?.ownerAccountId !== ownerAccountId
        || !hasValidCheckoutAttempt(attempt)) {
        throw new Error('Checkout recovery identity or request is invalid.');
    }

    const serializedState = JSON.stringify({
        version: 1,
        ownerAccountId,
        attempt
    });

    sessionStorage.setItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY, serializedState);

    if (sessionStorage.getItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY) !== serializedState) {
        throw new Error('Checkout recovery state was not durably stored.');
    }
};

export const clearSaleCheckoutRecovery = (ownerAccountId, expectedKey) => {
    try {
        const rawState = sessionStorage.getItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY);
        if (!rawState) return;

        const persistedState = JSON.parse(rawState);
        if (persistedState?.version === 1
            && persistedState.ownerAccountId === ownerAccountId
            && persistedState.attempt?.key === expectedKey) {
            sessionStorage.removeItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY);
        }
    } catch {
        // A retained exact attempt is safer than deleting unknown or differently owned state.
    }
};
