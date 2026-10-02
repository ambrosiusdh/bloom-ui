import { isValidDateInput } from '@utils/date-utils.js';
import { normalizeQuantity } from '@utils/quantity-utils.js';

export const RECEIPT_OFFSETS = {
    '+07:00': 'WIB (UTC+07)',
    '+08:00': 'WITA (UTC+08)',
    '+09:00': 'WIT (UTC+09)'
};

export const newReceiptDraft = () => ({
    supplier: null,
    receivedDate: '',
    receivedTime: '',
    offset: '',
    description: '',
    items: []
});

const receiptDateToIso = value => {
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value || '');
    if (!match) return '';

    const [, day, month, year] = match;
    const isoDate = `${ year }-${ month }-${ day }`;

    return isValidDateInput(isoDate) ? isoDate : '';
};

export const validateReceiptDecimal = (draft, fractional = true) => {
    const value = draft.trim().replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(value) || !/[1-9]/.test(value)) {
        return 'Masukkan nilai lebih dari 0.';
    }

    const [whole, fraction = ''] = value.split('.');
    if (fraction.length > 4) {
        return 'Maksimal 4 angka desimal; nilai tidak dibulatkan.';
    }
    if (whole.replace(/^0+/, '').length > 15) {
        return 'Maksimal 15 angka sebelum desimal.';
    }
    if (!fractional && /[1-9]/.test(fraction)) {
        return 'Barang ini harus diterima dalam jumlah utuh.';
    }

    return '';
};

const toScaledDecimal = value => {
    if (validateReceiptDecimal(value)) return null;

    const [whole, fraction = ''] = normalizeQuantity(value).split('.');

    return (BigInt(whole) * 10000n) + BigInt(fraction.padEnd(4, '0'));
};

const toScaledCanonicalDecimal = value => {
    const [whole, fraction = ''] = String(value).split('.');

    return (BigInt(whole) * 10000n) + BigInt(fraction.padEnd(4, '0'));
};

const fromScaledDecimal = value => {
    const whole = value / 10000n;
    const fraction = String(value % 10000n).padStart(4, '0').replace(/0+$/, '');

    return fraction ? `${ whole }.${ fraction }` : String(whole);
};

// Mirrors backend line rounding only as a non-authoritative input aid.
export const getReceiptLineInputEstimate = line => {
    const quantity = toScaledDecimal(line.quantity);
    const purchasePrice = toScaledDecimal(line.purchasePrice);
    if (quantity === null || purchasePrice === null) return null;

    const productAtEightDecimals = quantity * purchasePrice;
    const roundedAtFourDecimals = (productAtEightDecimals + 5000n) / 10000n;

    return fromScaledDecimal(roundedAtFourDecimals);
};

export const getReceiptInputEstimate = items => {
    if (!items.length) return null;

    const lineEstimates = items.map(getReceiptLineInputEstimate);
    if (lineEstimates.some(value => value === null)) return null;

    const total = lineEstimates.reduce(
        (sum, value) => sum + toScaledCanonicalDecimal(value),
        0n
    );

    return fromScaledDecimal(total);
};

export const formatReceiptDraftDateTime = draft => {
    const isoDate = receiptDateToIso(draft.receivedDate);
    if (!isoDate || !RECEIPT_OFFSETS[draft.offset]) return '-';

    const formattedDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(new Date(`${ isoDate }T00:00:00Z`));
    const formattedTime = draft.receivedTime.replace(':', '.');

    return `${ formattedDate }, ${ formattedTime } ${ RECEIPT_OFFSETS[draft.offset] }`;
};

export const validateReceipt = draft => {
    const errors = {};
    if (!draft.supplier?.active || !draft.supplier?.code) {
        errors.supplier = 'Pilih pemasok aktif dari hasil pencarian.';
    }
    if (!receiptDateToIso(draft.receivedDate)) {
        errors.receivedDate = 'Isi tanggal valid dengan format DD-MM-YYYY.';
    }
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.receivedTime)) {
        errors.receivedTime = 'Isi waktu 24 jam dengan format HH:mm.';
    }
    if (!RECEIPT_OFFSETS[draft.offset]) {
        errors.offset = 'Pilih zona waktu penerimaan.';
    }
    if (!draft.items.length) {
        errors.items = 'Tambahkan minimal satu barang.';
    }

    draft.items.forEach((line, index) => {
        errors[`items[${ index }].quantity`] = validateReceiptDecimal(
            line.quantity,
            line.item.fractionalQuantityAllowed
        );
        errors[`items[${ index }].purchasePrice`] = validateReceiptDecimal(
            line.purchasePrice
        );
        if (!errors[`items[${ index }].quantity`]
                && !errors[`items[${ index }].purchasePrice`]
                && getReceiptLineInputEstimate(line) === '0') {
            errors[`items[${ index }].purchasePrice`] = 'Jumlah × harga harus menghasilkan nilai minimal Rp 0,0001.';
        }
        if (!['STORE', 'WAREHOUSE'].includes(line.stockLocation)) {
            errors[`items[${ index }].stockLocation`] = 'Pilih lokasi tujuan.';
        }
    });

    return Object.fromEntries(
        Object.entries(errors).filter(([, message]) => message)
    );
};

export const receiptRequest = draft => {
    const isoDate = receiptDateToIso(draft.receivedDate);

    return {
        supplierCode: draft.supplier.code,
        receivedDate: new Date(
            `${ isoDate }T${ draft.receivedTime }:00${ draft.offset }`
        ).toISOString(),
        description: draft.description.trim(),
        items: draft.items.map(line => ({
            itemSku: line.item.sku,
            quantity: normalizeQuantity(line.quantity),
            purchasePrice: normalizeQuantity(line.purchasePrice),
            stockLocation: line.stockLocation
        }))
    };
};

export const migrateReceiptDraft = draft => {
    if (!draft || Object.hasOwn(draft, 'receivedDate')) {
        return draft || newReceiptDraft();
    }

    const [legacyDate = '', legacyTime = ''] = String(draft.receivedTime || '').split('T');
    const [year = '', month = '', day = ''] = legacyDate.split('-');

    return {
        ...draft,
        receivedDate: year && month && day ? `${ day }-${ month }-${ year }` : '',
        receivedTime: legacyTime
    };
};
