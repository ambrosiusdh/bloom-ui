import api from "@api/index.js";
import { SALE } from "@api/path/index.js";

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

const getSaleList = async (payload, options) => {
    return api({
        url: SALE.list,
        method: 'GET',
        ...payload
    }, options);
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

const createSale = async (payload, options) => {
    return api({
        url: SALE.create,
        method: 'POST',
        ...payload
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
    printReceipt
}
