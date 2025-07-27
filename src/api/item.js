import api from "@api/index.js";
import { ITEM } from "@api/path/index.js";

const getItemList = async (payload) => {
    return api({
        url: ITEM.list,
        method: 'GET',
        ...payload
    });
}

const getItemDetails = async sku => {
    return api({
        url: ITEM.detail(sku),
        method: 'GET'
    })
}

const createItem = async payload => {
    return api({
        url: ITEM.create,
        method: 'POST',
        ...payload
    });
}

const updateItem = async (sku, payload) => {
    return api({
        url: ITEM.update(sku),
        method: 'PUT',
        ...payload
    });
}

const deactivateItem = async sku => {
    return api({
        url: ITEM.deactivate(sku),
        method: 'PATCH'
    })
}

export default {
    getItemList,
    getItemDetails,
    createItem,
    updateItem,
    deactivateItem
}