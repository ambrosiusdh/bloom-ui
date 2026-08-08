export const API_DOMAIN_ERROR_CODE = Object.freeze({
    ITEM_CATEGORY_ALREADY_EXISTS: 'item_category_already_exists'
});

const LEGACY_DOMAIN_ERRORS = Object.freeze({
    '400:ResponseStatusException:Item Category already exists': API_DOMAIN_ERROR_CODE.ITEM_CATEGORY_ALREADY_EXISTS
});

export const getLegacyDomainErrorCode = (status, data) => {
    const key = `${ status }:${ data?.errorType }:${ data?.message }`;
    return LEGACY_DOMAIN_ERRORS[key] || null;
};
