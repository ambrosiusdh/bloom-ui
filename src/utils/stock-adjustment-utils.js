const ACTION_TYPES = ['ADD', 'REMOVE', 'CORRECTION'];
const STOCK_LOCATIONS = ['STORE', 'WAREHOUSE'];
const DECIMAL_PATTERN = /^\d+(?:[.,]\d+)?$/;

const normalizeAdjustmentQuantity = value => String(value ?? '').trim().replace(',', '.');

const validateAdjustmentQuantity = (value, item, actionType) => {
    const editingValue = String(value ?? '').trim();
    if (!editingValue) {
        return 'Jumlah wajib diisi.';
    }
    if (!DECIMAL_PATTERN.test(editingValue)) {
        return 'Gunakan angka tanpa pemisah ribuan; desimal boleh memakai koma atau titik.';
    }

    const normalized = normalizeAdjustmentQuantity(editingValue);
    const [integerPart, fractionalPart = ''] = normalized.split('.');
    if (integerPart.length > 15) {
        return 'Maksimal 15 angka sebelum tanda desimal.';
    }
    if (fractionalPart.length > 4) {
        return 'Maksimal 4 angka di belakang tanda desimal.';
    }
    if (!item) {
        return 'Pilih barang sebelum mengisi jumlah.';
    }
    if (!item.fractionalQuantityAllowed && /[1-9]/.test(fractionalPart)) {
        return 'Barang ini hanya dapat disesuaikan dalam jumlah utuh.';
    }
    if (actionType !== 'CORRECTION'
        && !/[1-9]/.test(`${ integerPart }${ fractionalPart }`)) {
        return 'ADD dan REMOVE memerlukan jumlah lebih besar dari 0.';
    }
    return '';
};

const validateAdjustmentLine = line => ({
    itemSku: line.item ? '' : 'Barang wajib dipilih.',
    stockLocation: STOCK_LOCATIONS.includes(line.stockLocation)
        ? '' : 'Lokasi stok wajib dipilih.',
    actionType: ACTION_TYPES.includes(line.actionType)
        ? '' : 'Tindakan penyesuaian wajib dipilih.',
    changeQuantity: validateAdjustmentQuantity(
        line.changeQuantity,
        line.item,
        line.actionType
    )
});

const validateStockAdjustment = (reason, lines) => {
    const lineErrors = lines.map(validateAdjustmentLine);
    const seenSkus = new Set();
    lines.forEach((line, index) => {
        if (line.item?.sku && seenSkus.has(line.item.sku)) {
            lineErrors[index].itemSku = 'Barang yang sama hanya boleh muncul satu kali.';
        }
        if (line.item?.sku) {
            seenSkus.add(line.item.sku);
        }
    });

    return {
        reason: reason.trim() ? '' : 'Alasan penyesuaian wajib diisi.',
        lines: lineErrors
    };
};

const hasStockAdjustmentErrors = errors => !!errors.reason
    || errors.lines.some(line => Object.values(line).some(Boolean));

const createStockAdjustmentPayload = (reason, lines) => ({
    reason: reason.trim(),
    items: lines.map(line => ({
        itemSku: line.item.sku,
        changeQuantity: normalizeAdjustmentQuantity(line.changeQuantity),
        actionType: line.actionType,
        stockLocation: line.stockLocation
    }))
});

export {
    ACTION_TYPES,
    STOCK_LOCATIONS,
    createStockAdjustmentPayload,
    hasStockAdjustmentErrors,
    normalizeAdjustmentQuantity,
    validateAdjustmentQuantity,
    validateStockAdjustment
};
