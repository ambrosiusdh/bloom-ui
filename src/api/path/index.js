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

export {
    AUTH,
    ITEM
}