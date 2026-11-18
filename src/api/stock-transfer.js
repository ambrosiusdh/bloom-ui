import api from '@api/index.js';
import { STOCK_TRANSFER } from '@api/path/index.js';

const createStockTransfer = (payload, requestKey, options) => api({
    url: STOCK_TRANSFER.create,
    method: 'POST',
    timeout: 15000,
    data: payload?.data,
    headers: {
        ...payload?.headers,
        'Idempotency-Key': requestKey
    }
}, options);

const getStockTransfers = (params, config, options) => api({
    ...config,
    url: STOCK_TRANSFER.list,
    method: 'GET',
    params
}, options);

const getStockTransferDetails = (code, config, options) => api({
    ...config,
    url: STOCK_TRANSFER.details,
    method: 'GET',
    params: { code }
}, options);

export default {
    createStockTransfer,
    getStockTransfers,
    getStockTransferDetails
};
