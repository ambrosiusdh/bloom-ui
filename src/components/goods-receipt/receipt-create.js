import { isValidDateInput } from '@utils/date-utils.js';
import { normalizeQuantity } from '@utils/quantity-utils.js';

export const RECEIPT_OFFSETS = { '+07:00': 'WIB (UTC+07)', '+08:00': 'WITA (UTC+08)', '+09:00': 'WIT (UTC+09)' };
export const newReceiptDraft = () => ({ supplier: null, receivedTime: '', offset: '', description: '', items: [] });

export const validateReceiptDecimal = (draft, fractional = true) => {
    const value = draft.trim().replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(value) || !/[1-9]/.test(value)) return 'Masukkan nilai lebih dari 0.';
    const [whole, fraction = ''] = value.split('.');
    if (fraction.length > 4) return 'Maksimal 4 angka desimal; nilai tidak dibulatkan.';
    if (whole.replace(/^0+/, '').length > 15) return 'Maksimal 15 angka sebelum desimal.';
    if (!fractional && /[1-9]/.test(fraction)) return 'Barang ini harus diterima dalam jumlah utuh.';
    return '';
};

export const validateReceipt = draft => {
    const errors = {};
    if (!draft.supplier?.active || !draft.supplier?.code) errors.supplier = 'Pilih pemasok aktif dari hasil pencarian.';
    if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.receivedTime)
        || !isValidDateInput(draft.receivedTime.slice(0, 10))
        || Number.isNaN(Date.parse(`${ draft.receivedTime }Z`))) errors.receivedTime = 'Isi tanggal dan waktu penerimaan yang valid.';
    if (!RECEIPT_OFFSETS[draft.offset]) errors.offset = 'Pilih zona waktu penerimaan.';
    if (!draft.items.length) errors.items = 'Tambahkan minimal satu barang.';
    draft.items.forEach((line, index) => {
        errors[`items[${ index }].quantity`] = validateReceiptDecimal(line.quantity, line.item.fractionalQuantityAllowed);
        errors[`items[${ index }].purchasePrice`] = validateReceiptDecimal(line.purchasePrice);
        if (!['STORE', 'WAREHOUSE'].includes(line.stockLocation)) errors[`items[${ index }].stockLocation`] = 'Pilih lokasi tujuan.';
    });
    return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
};

export const receiptRequest = draft => ({
    supplierCode: draft.supplier.code,
    receivedDate: new Date(`${ draft.receivedTime }:00${ draft.offset }`).toISOString(),
    description: draft.description.trim(),
    items: draft.items.map(line => ({
        itemSku: line.item.sku, quantity: normalizeQuantity(line.quantity),
        purchasePrice: normalizeQuantity(line.purchasePrice), stockLocation: line.stockLocation
    }))
});
