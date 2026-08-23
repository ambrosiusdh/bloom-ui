import api from "@api/index.js";
import { ITEM } from "@api/path/index.js";

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

const getItemList = async (payload, options) => {
    return api({
        url: ITEM.list,
        method: 'GET',
        ...payload
    }, options);
}

const getItemDetails = async (sku, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);
    return api({
        url: ITEM.detail(sku),
        method: 'GET',
        ...request.config
    }, request.options)
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

const getItemAuditLog = async (sku, payload, options) => {
    return api({
        url: ITEM.auditLog(sku),
        method: 'GET',
        ...payload
    }, options)
}

export default {
    getItemList,
    getItemDetails,
    createItem,
    updateItem,
    deactivateItem,
    getItemAuditLog
}
