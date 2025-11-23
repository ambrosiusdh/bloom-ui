const AUTH = {
    currentUser: '/api/auth/current',
    login: '/api/auth/login',
    logout: '/api/auth/logout'
}

const ITEM = {
    list: '/api/items',
    create: '/api/items',
    update: sku => `/api/items/${sku}`,
    detail: sku => `/api/items/${sku}`,
    deactivate: sku => `/api/items/${sku}`,
}

const ITEM_CATEGORY = {
    list: '/api/item-categories',
    create: '/api/item-categories',
    detail: code => `/api/item-categories/${code}`,
    update: code => `/api/item-categories/${code}`,
    deactivate: code => `/api/item-categories/${code}`,
    itemCount: code => `/api/item-categories/${code}/items/count`,
}

const SALE = {
    list: '/api/sales',
    detail: '/api/sales/details',
    create: '/api/sales'
}

const DASHBOARD = {
    overview: '/api/dashboard/overview'
}

export {
    AUTH,
    ITEM,
    ITEM_CATEGORY,
    SALE,
    DASHBOARD
}