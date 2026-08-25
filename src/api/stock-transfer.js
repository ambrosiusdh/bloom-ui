import api from '@api/index.js';
import { STOCK_TRANSFER } from '@api/path/index.js';

const createStockTransfer = (payload, requestKey, options) => api({
    url: STOCK_TRANSFER.create,
    method: 'POST',
    data: payload?.data,
    headers: {
        ...payload?.headers,
        'Idempotency-Key': requestKey
    }
}, options);

export default {
    createStockTransfer
};
