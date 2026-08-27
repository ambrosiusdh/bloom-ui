const UNIT_OF_MEASURE_LABELS = {
    PIECE: 'pcs',
    METER: 'meter',
    KILOGRAM: 'kg',
    LITER: 'liter'
};

const quantityFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 4
});

/**
 * Formats a backend quantity for display only. It does not calculate or change
 * stock values; STORE and WAREHOUSE remain separate backend-owned balances.
 */
const formatQuantity = (value, unitOfMeasure) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const numericValue = Number(value);
    const formattedValue = Number.isFinite(numericValue)
        ? quantityFormatter.format(numericValue)
        : '-';
    const unitLabel = UNIT_OF_MEASURE_LABELS[unitOfMeasure] || unitOfMeasure;

    return unitLabel ? `${formattedValue} ${unitLabel}` : formattedValue;
};

const formatUnitOfMeasure = unitOfMeasure => UNIT_OF_MEASURE_LABELS[unitOfMeasure]
    || unitOfMeasure
    || '-';

const normalizeQuantity = value => {
    const normalizedSeparator = String(value ?? '').trim().replace(',', '.');
    const [integerPart = '', fractionalPart = ''] = normalizedSeparator.split('.');
    const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';
    const normalizedFraction = fractionalPart.replace(/0+$/, '');

    return normalizedFraction
        ? `${ normalizedInteger }.${ normalizedFraction }`
        : normalizedInteger;
};

const validateQuantity = (value, fractionalQuantityAllowed) => {
    const normalizedSeparator = String(value ?? '').trim().replace(',', '.');

    if (!/^\d+(?:\.\d+)?$/.test(normalizedSeparator)) {
        return 'Masukkan jumlah lebih dari 0.';
    }

    const [integerPart, fractionalPart = ''] = normalizedSeparator.split('.');
    if (fractionalPart.length > 4) {
        return 'Jumlah maksimal memiliki 4 angka desimal.';
    }

    if (!fractionalQuantityAllowed && /[1-9]/.test(fractionalPart)) {
        return 'Barang ini hanya dapat dijual dalam jumlah utuh.';
    }

    if (/^0+$/.test(integerPart) && !/[1-9]/.test(fractionalPart)) {
        return 'Masukkan jumlah lebih dari 0.';
    }

    return '';
};

const toScaledQuantity = value => {
    const [integerPart, fractionalPart = ''] = normalizeQuantity(value).split('.');
    return BigInt(integerPart) * 10000n
        + BigInt(fractionalPart.padEnd(4, '0'));
};

const incrementQuantityByOne = value => {
    const scaled = toScaledQuantity(value) + 10000n;
    const integerPart = scaled / 10000n;
    const fractionalPart = String(scaled % 10000n).padStart(4, '0').replace(/0+$/, '');

    return fractionalPart ? `${ integerPart }.${ fractionalPart }` : String(integerPart);
};

const isQuantityAboveAvailability = (quantity, availability) => {
    if (availability === null || availability === undefined || availability === '') {
        return false;
    }

    return toScaledQuantity(quantity) > toScaledQuantity(availability);
};

export {
    formatQuantity,
    formatUnitOfMeasure,
    incrementQuantityByOne,
    isQuantityAboveAvailability,
    normalizeQuantity,
    validateQuantity
};
