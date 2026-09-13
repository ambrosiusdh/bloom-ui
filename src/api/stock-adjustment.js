import api from '@api/index.js';
import { STOCK_ADJUSTMENT } from '@api/path/index.js';

const getReadRequestArguments = (configOrOptions = {}, options) => {
    const {
        useLoader,
        ...config
    } = configOrOptions || {};

    return {
        config,
        options: options ?? (useLoader === undefined ? undefined : { useLoader })
    };
};

const getStockAdjustmentList = async (params, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);

    return api({
        url: STOCK_ADJUSTMENT.list,
        method: 'GET',
        ...request.config,
        params
    }, request.options);
};

const getStockAdjustmentDetails = async (code, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);
    const {
        params,
        ...config
    } = request.config;

    return api({
        url: STOCK_ADJUSTMENT.detail,
        method: 'GET',
        ...config,
        params: {
            ...params,
            code
        }
    }, request.options);
};

const createStockAdjustment = async (payload, options) => api({
    url: STOCK_ADJUSTMENT.create,
    method: 'POST',
    data: payload
}, options);

export default {
    getStockAdjustmentList,
    getStockAdjustmentDetails,
    createStockAdjustment
};
