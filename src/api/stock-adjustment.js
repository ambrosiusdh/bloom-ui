import api from "@api/index.js";
import { STOCK_ADJUSTMENT } from "@api/path/index.js";

const getStockAdjustmentList = async (payload, options) => {
    return api({
        url: STOCK_ADJUSTMENT.list,
        method: 'GET',
        ...payload
    }, options);
}

const getStockAdjustmentDetails = async (payload, options) => {
    return api({
        url: STOCK_ADJUSTMENT.detail,
        method: 'GET',
        ...payload
    }, options)
}

const createStockAdjustment = async (payload, options) => {
    return api({
        url: STOCK_ADJUSTMENT.create,
        method: 'POST',
        data: payload
    }, options);
}

const parseStockAdjustmentCsv = async (file, options) => {
    const formData = new FormData();
    formData.append('file', file);

    return api({
        url: STOCK_ADJUSTMENT.csvParse,
        method: 'POST',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }, options);
}

const downloadStockAdjustmentTemplate = async (options) => {
    return api({
        url: STOCK_ADJUSTMENT.template,
        method: 'GET',
        responseType: 'blob'
    }, options);
}

export default {
    getStockAdjustmentList,
    getStockAdjustmentDetails,
    createStockAdjustment,
    parseStockAdjustmentCsv,
    downloadStockAdjustmentTemplate
}
