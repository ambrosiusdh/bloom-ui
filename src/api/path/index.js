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
    auditLog: sku => `/api/items/${sku}/audit-log`,
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
    create: '/api/sales',
    checkoutStatus: '/api/sales/checkout-status',
    print: '/api/print'
}

const GOODS_RECEIPT = {
    list: '/api/goods-receipts',
    create: '/api/goods-receipts',
    detail: '/api/goods-receipts/details',
}

const STOCK_ADJUSTMENT = {
    list: '/api/stock-adjustments',
    create: '/api/stock-adjustments',
    detail: `/api/stock-adjustments/details`,
    csvParse: '/api/stock-adjustments/csv-parse',
    template: '/api/stock-adjustments/template'
}

const STOCK_MOVEMENT = {
    list: '/api/stock-movements'
}

const STOCK_TRANSFER = {
    create: '/api/stock-transfers'
}

const CASH_SESSION = {
    list: '/api/cash-sessions',
    current: '/api/cash-sessions/current',
    open: '/api/cash-sessions/open',
    detail: sessionId => `/api/cash-sessions/${ sessionId }`,
    expectedCash: sessionId => `/api/cash-sessions/${ sessionId }/expected-cash`,
    close: sessionId => `/api/cash-sessions/${ sessionId }/close`
}

const DASHBOARD = {
    overview: '/api/dashboard/overview'
}

export {
    AUTH,
    ITEM,
    ITEM_CATEGORY,
    SALE,
    GOODS_RECEIPT,
    STOCK_ADJUSTMENT,
    STOCK_MOVEMENT,
    STOCK_TRANSFER,
    CASH_SESSION,
    DASHBOARD
}
