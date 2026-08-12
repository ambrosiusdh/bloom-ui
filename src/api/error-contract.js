export const API_DOMAIN_ERROR_CODE = Object.freeze({
    ITEM_CATEGORY_ALREADY_EXISTS: 'item_category_already_exists',
    PRINTER_NOT_FOUND: 'printer_not_found',
    SALE_NOT_FOUND: 'sale_not_found'
});

const LEGACY_DOMAIN_ERRORS = Object.freeze({
    '400:ResponseStatusException:Item Category already exists': API_DOMAIN_ERROR_CODE.ITEM_CATEGORY_ALREADY_EXISTS,
    '404:ResponseStatusException:Transaksi tidak ditemukan': API_DOMAIN_ERROR_CODE.SALE_NOT_FOUND,
    '500:ResponseStatusException:Printer tidak ditemukan': API_DOMAIN_ERROR_CODE.PRINTER_NOT_FOUND
});

export const getLegacyDomainErrorCode = (status, data) => {
    const key = `${ status }:${ data?.errorType }:${ data?.message }`;
    return LEGACY_DOMAIN_ERRORS[key] || null;
};
