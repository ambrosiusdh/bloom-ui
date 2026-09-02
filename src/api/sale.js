import api from "@api/index.js";
import { SALE } from "@api/path/index.js";

const CHECKOUT_TIMEOUT_MS = 20_000;

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

const getSaleList = async (params, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);

    return api({
        url: SALE.list,
        method: 'GET',
        ...request.config,
        params
    }, request.options);
}

const getSaleDetails = async (code, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);
    const { params, ...config } = request.config;

    return api({
        url: SALE.detail,
        method: 'GET',
        ...config,
        params: {
            ...params,
            code
        }
    }, request.options)
}

const createSale = async (data, idempotencyKey, options) => {
    return api({
        url: SALE.create,
        method: 'POST',
        timeout: CHECKOUT_TIMEOUT_MS,
        data,
        headers: {
            'Idempotency-Key': idempotencyKey
        }
    }, options);
}

const getCheckoutStatus = async (idempotencyKey, config = {}, options) => {
    return api({
        url: SALE.checkoutStatus,
        method: 'GET',
        timeout: CHECKOUT_TIMEOUT_MS,
        ...config,
        headers: {
            ...config.headers,
            'Idempotency-Key': idempotencyKey
        }
    }, options);
}

const printReceipt = async (saleCode, options) => {
    return api({
        url: SALE.print,
        method: 'POST',
        data: {
            saleCode
        }
    }, options);
}

export default {
    getSaleList,
    getSaleDetails,
    createSale,
    getCheckoutStatus,
    printReceipt
}
