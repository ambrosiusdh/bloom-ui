import api from "@api/index.js";
import { ITEM_CATEGORY } from "@api/path/index.js";

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

const getItemCategoryList = async (payload, options) => {
    return api({
        url: ITEM_CATEGORY.list,
        method: 'GET',
        ...payload
    }, options);
}

const getItemCategoryDetails = async (code, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);
    return api({
        url: ITEM_CATEGORY.detail(code),
        method: 'GET',
        ...request.config
    }, request.options)
}

const createItemCategory = async (payload, options) => {
    return api({
        url: ITEM_CATEGORY.create,
        method: 'POST',
        ...payload
    }, options);
}

const updateItemCategory = async (code, payload, options) => {
    return api({
        url: ITEM_CATEGORY.update(code),
        method: 'PUT',
        ...payload
    }, options);
}

const deactivateItemCategory = async (code, options) => {
    return api({
        url: ITEM_CATEGORY.deactivate(code),
        method: 'PATCH'
    }, options)
}

const getItemCategoriesItemCount = async (code, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);
    return api({
        url: ITEM_CATEGORY.itemCount(code),
        method: 'GET',
        ...request.config
    }, request.options)
}

export default {
    getItemCategoryList,
    getItemCategoryDetails,
    createItemCategory,
    updateItemCategory,
    deactivateItemCategory,
    getItemCategoriesItemCount
}
