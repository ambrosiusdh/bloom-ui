import api from '@api/index.js';
import { STOCK_MOVEMENT } from '@api/path/index.js';

const getStockMovementList = (payload, options) => api({
    url: STOCK_MOVEMENT.list,
    method: 'GET',
    ...payload
}, options);

export default {
    getStockMovementList
};
