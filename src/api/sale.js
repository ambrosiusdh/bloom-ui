import api from "@api/index.js";
import { SALE } from "@api/path/index.js";

const getSaleList = async (payload, options) => {
    return api({
        url: SALE.list,
        method: 'GET',
        ...payload
    }, options);
}

const getSaleDetails = async (code, options) => {
    return api({
        url: SALE.detail,
        method: 'GET',
        params: {
            code
        }
    }, options)
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
