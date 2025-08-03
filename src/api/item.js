import api from "@api/index.js";
import { ITEM } from "@api/path/index.js";

const getItemList = async (payload, options) => {
    return api({
        url: ITEM.list,
        method: 'GET',
        ...payload
    }, options);
}

const getItemDetails = async (sku, options) => {
    return api({
        url: ITEM.detail(sku),
        method: 'GET'
    }, options)
}

const createItem = async (payload, options) => {
    return api({
        url: ITEM.create,
        method: 'POST',
        ...payload
    }, options);
}

const updateItem = async (sku, payload, options) => {
    return api({
        url: ITEM.update(sku),
        method: 'PUT',
        ...payload
    }, options);
}

const deactivateItem = async (sku, options) => {
    return api({
        url: ITEM.deactivate(sku),
        method: 'PATCH'
    }, options)
}

export default {
    getItemList,
    getItemDetails,
    createItem,
    updateItem,
    deactivateItem
}