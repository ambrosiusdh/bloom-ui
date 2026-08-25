const MONEY_PATTERN = /^\d+(?:\.\d+)?$/;

export const normalizeMoney = value => value.trim();

export const validateCashAmount = (value, label) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return `${ label } wajib diisi.`;
    }
    if (!MONEY_PATTERN.test(trimmedValue)) {
        return 'Masukkan nominal uang yang valid.';
    }

    const [integerPart, fractionalPart = ''] = normalizeMoney(trimmedValue).split('.');
    if (integerPart.length > 15) {
        return 'Maksimal 15 angka sebelum tanda desimal.';
    }
    if (fractionalPart.length > 4) {
        return 'Maksimal 4 angka di belakang tanda desimal.';
    }
    return '';
};

export const formatRupiah = value => {
    const canonicalValue = String(value ?? '0').replace(',', '.');
    const isNegative = canonicalValue.startsWith('-');
    const unsignedValue = isNegative ? canonicalValue.slice(1) : canonicalValue;
    const [rawInteger = '0', rawFraction = ''] = unsignedValue.split('.');
    const integer = rawInteger.replace(/^0+(?=\d)/, '') || '0';
    const fraction = rawFraction.replace(/0+$/, '');
    const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${ isNegative ? '-' : '' }Rp ${ groupedInteger }${
        fraction ? `,${ fraction }` : ''
    }`;
};

export const getMoneySign = value => {
    const canonicalValue = String(value ?? '0').trim().replace(',', '.');
    const isNegative = canonicalValue.startsWith('-');
    const digits = (isNegative ? canonicalValue.slice(1) : canonicalValue)
        .replace('.', '')
        .replace(/^0+/, '');

    if (!digits) return 0;
    return isNegative ? -1 : 1;
};
