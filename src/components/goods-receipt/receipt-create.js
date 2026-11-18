import { isValidDateInput } from '@utils/date-utils.js';
import { normalizeQuantity } from '@utils/quantity-utils.js';
import { paymentRequest, validatePayment } from '@utils/supplier-payment-utils.js';

export const RECEIPT_OFFSETS = {
    '+07:00': 'WIB (UTC+07)',
    '+08:00': 'WITA (UTC+08)',
    '+09:00': 'WIT (UTC+09)'
};

export const newReceiptDraft = () => ({
    code: '',
    supplier: null,
    receivedDate: '',
    receivedTime: '',
    offset: '',
    description: '',
    initialPayment: null,
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
    const [whole, fraction = ''] = String(value).trim().split('.');

    return (BigInt(whole) * 10000n) + BigInt(fraction.padEnd(4, '0'));
};

const fromScaledDecimal = value => {
    const sign = value < 0n ? '-' : '';
    const absolute = value < 0n ? -value : value;
    const whole = absolute / 10000n;
    const fraction = String(absolute % 10000n).padStart(4, '0').replace(/0+$/, '');

    return `${ sign }${ whole }${ fraction ? `.${ fraction }` : '' }`;
};

// Matches Java String.strip(); the backend returns the canonical saved identity.
export const stripReceiptCode = value => String(value || '').replace(
    // eslint-disable-next-line no-control-regex -- Java strip includes ASCII control whitespace.
    /^[\u0009-\u000d\u001c-\u0020\u1680\u2000-\u2006\u2008-\u200a\u2028\u2029\u205f\u3000]+|[\u0009-\u000d\u001c-\u0020\u1680\u2000-\u2006\u2008-\u200a\u2028\u2029\u205f\u3000]+$/gu,
    ''
);

export const validateReceiptCode = value => {
    if (!value) return '';
    if (value.length > 100) return 'Kode penerimaan maksimal 100 karakter, termasuk spasi tepi.';

    const code = stripReceiptCode(value);
    return !code || /[\p{Z}\p{Cc}]/u.test(code)
        ? 'Gunakan kode tanpa spasi di dalam atau karakter kontrol, atau kosongkan untuk kode otomatis.'
        : '';
};

export const getReceiptOutstandingInputEstimate = draft => {
    const total = getReceiptInputEstimate(draft.items);
    if (total === null || !draft.initialPayment) return total;
    if (validatePayment(draft.initialPayment)) return null;

    return fromScaledDecimal(toScaledCanonicalDecimal(total)
        - toScaledCanonicalDecimal(draft.initialPayment.amount));
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
    errors.code = validateReceiptCode(draft.code);
    if (draft.initialPayment) {
        errors['initialPayment.amount'] = validatePayment(draft.initialPayment);
        if ((draft.initialPayment.reference?.length || 0) > 255) {
            errors['initialPayment.reference'] = 'Referensi maksimal 255 karakter.';
        }
        if ((draft.initialPayment.note?.length || 0) > 255) {
            errors['initialPayment.note'] = 'Catatan maksimal 255 karakter.';
        }
    }
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

export const receiptRequest = (draft, paidAt = new Date().toISOString()) => {
    const isoDate = receiptDateToIso(draft.receivedDate);

    return {
        ...(draft.code ? { code: draft.code } : {}),
        supplierCode: draft.supplier.code,
        receivedDate: new Date(
            `${ isoDate }T${ draft.receivedTime }:00${ draft.offset }`
        ).toISOString(),
        description: draft.description.trim(),
        ...(draft.initialPayment ? {
            initialPayment: paymentRequest(draft.initialPayment, paidAt)
        } : {}),
        items: draft.items.map(line => ({
            itemSku: line.item.sku,
            quantity: normalizeQuantity(line.quantity),
            purchasePrice: normalizeQuantity(line.purchasePrice),
            stockLocation: line.stockLocation
        }))
    };
};

const receiptLineKey = line => JSON.stringify([
    line.itemSku || line.item?.sku,
    normalizeQuantity(String(line.quantity)),
    normalizeQuantity(String(line.purchasePrice)),
    line.stockLocation
]);

export const isReceiptSubmissionResult = (result, request) => {
    if (!result?.code || !['POSTED', 'CANCELLED'].includes(result.status)
        || !['UNPAID', 'PARTIALLY_PAID', 'PAID'].includes(result.paymentStatus)
        || result.supplierCode !== request.supplierCode
        || !Array.isArray(result.items) || result.items.length !== request.items.length
        || ['totalAmount', 'paidAmount', 'outstandingAmount'].some(field => result[field] == null)
        || (request.code && result.code !== stripReceiptCode(request.code))) {
        return false;
    }

    const requestedLines = request.items.map(receiptLineKey).sort();
    const savedLines = result.items.map(receiptLineKey).sort();
    if (requestedLines.some((line, index) => line !== savedLines[index])) return false;

    const payment = result.initialPayment;
    const expected = request.initialPayment;
    if (!expected) return payment == null;

    return Boolean(payment?.id && payment.paymentReference
        && payment.receiptCode === result.code
        && payment.paymentMethod === expected.paymentMethod
        && normalizeQuantity(String(payment.amount)) === normalizeQuantity(expected.amount)
        && Date.parse(payment.paidAt) === Date.parse(expected.paidAt)
        && (expected.paymentMethod !== 'CASH' || payment.cashSessionId));
};

export const migrateReceiptDraft = draft => {
    if (!draft || Object.hasOwn(draft, 'receivedDate')) {
        return {
            ...newReceiptDraft(),
            ...draft
        };
    }

    const [legacyDate = '', legacyTime = ''] = String(draft.receivedTime || '').split('T');
    const [year = '', month = '', day = ''] = legacyDate.split('-');

    return {
        ...newReceiptDraft(),
        ...draft,
        receivedDate: year && month && day ? `${ day }-${ month }-${ year }` : '',
        receivedTime: legacyTime
    };
};
