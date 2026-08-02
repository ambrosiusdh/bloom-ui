import api from "@api/index.js";
import { GOODS_RECEIPT } from "@api/path/index.js";

const getGoodsReceiptList = async (payload, options) => {
    return api({
        url: GOODS_RECEIPT.list,
        method: 'GET',
        ...payload
    }, options);
}

const getGoodsReceiptDetails = async (payload, options) => {
    return api({
        url: GOODS_RECEIPT.detail,
        method: 'GET',
        ...payload
    }, options)
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
