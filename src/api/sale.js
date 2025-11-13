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
        url: SALE.detail(code),
        method: 'GET'
    }, options)
}

const createSale = async (payload, options) => {
    return api({
        url: SALE.create,
        method: 'POST',
        ...payload
    }, options);
}

export default {
    getSaleList,
    getSaleDetails,
    createSale
}