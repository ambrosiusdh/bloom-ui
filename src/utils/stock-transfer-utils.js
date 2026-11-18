export const TRANSFER_LOCATIONS = {
    STORE: 'Toko (STORE)',
    WAREHOUSE: 'Gudang (WAREHOUSE)'
};

export const emptyTransferLine = (itemSku = '') => ({
    itemSku,
    quantity: ''
});

export const normalizeTransferQuantity = value => value.trim().replace(',', '.');

export const validateTransferQuantity = (value, item) => {
    const trimmed = value.trim();

    if (!trimmed) {
        return 'Jumlah transfer wajib diisi.';
    }
    if (/^-/.test(trimmed) || /^0+(?:[.,]0*)?$/.test(trimmed)) {
        return 'Jumlah transfer harus lebih besar dari 0.';
    }
    if (!/^\d+(?:[.,]\d+)?$/.test(trimmed)) {
        return 'Gunakan angka tanpa pemisah ribuan; desimal boleh memakai koma atau titik.';
    }

    const [integer, fraction = ''] = normalizeTransferQuantity(trimmed).split('.');

    if (integer.length > 15) {
        return 'Maksimal 15 angka sebelum tanda desimal.';
    }
    if (fraction.length > 4) {
        return 'Maksimal 4 angka di belakang tanda desimal.';
    }
    if (item && !item.fractionalQuantityAllowed && /[1-9]/.test(fraction)) {
        return 'Barang ini hanya dapat dipindahkan dalam jumlah utuh.';
    }

    return '';
};

export const validateTransferForm = (form, items) => {
    const errors = {};

    form.lines.forEach((line, index) => {
        const item = items.find(candidate => candidate.sku === line.itemSku);
        const duplicate = form.lines.some((other, otherIndex) => otherIndex !== index
            && !!line.itemSku && other.itemSku === line.itemSku);

        errors[`lines[${ index }].itemSku`] = !item
            ? line.itemSku
                ? 'Barang ini tidak tersedia pada daftar aktif. Pilih barang aktif atau hapus baris.'
                : 'Barang wajib dipilih.'
            : duplicate ? 'Barang sudah dipilih di baris lain. Pilih barang berbeda atau hapus baris.' : '';
        errors[`lines[${ index }].quantity`] = validateTransferQuantity(line.quantity, item);
    });

    errors.sourceLocation = Object.hasOwn(TRANSFER_LOCATIONS, form.sourceLocation)
        ? '' : 'Lokasi asal wajib dipilih.';
    errors.destinationLocation = Object.hasOwn(TRANSFER_LOCATIONS, form.destinationLocation)
        ? form.sourceLocation === form.destinationLocation
            ? 'Lokasi tujuan harus berbeda dari lokasi asal.' : ''
        : 'Lokasi tujuan wajib dipilih.';
    errors.description = form.description.length > 255 ? 'Keterangan maksimal 255 karakter.' : '';

    return errors;
};
