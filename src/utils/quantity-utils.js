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

export {
    formatQuantity,
    formatUnitOfMeasure
};
