import api from "@api/index.js";
import { GOODS_RECEIPT } from "@api/path/index.js";

const getReadRequestArguments = (configOrOptions = {}, options) => {
    const { useLoader, ...config } = configOrOptions || {};

    return {
        config,
        options: options ?? (useLoader === undefined ? undefined : { useLoader })
    };
};

const getGoodsReceiptList = async (params, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);

    return api({
        url: GOODS_RECEIPT.list,
        method: 'GET',
        ...request.config,
        params
    }, request.options);
}

const getGoodsReceiptDetails = async (code, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);
    const { params, ...config } = request.config;

    return api({
        url: GOODS_RECEIPT.detail,
        method: 'GET',
        ...config,
        params: { ...params, code }
    }, request.options)
}

const createGoodsReceipt = async (payload, options) => {
    return api({
        url: GOODS_RECEIPT.create,
        method: 'POST',
        data: payload
    }, options);
}

export default {
    getGoodsReceiptList,
    getGoodsReceiptDetails,
    createGoodsReceipt
}
