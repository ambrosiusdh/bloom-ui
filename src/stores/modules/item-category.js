import { create } from 'zustand'

import api from '@api/item-category.js'


const useItemCategoryStore = create((set) => ({
    itemCategoryList: [],
    itemCategoryPaging: {},
    itemCategoryDetails: {},
    itemCategoriesItemCount: {},

    getItemCategoryList: async (payload, options) => {
        const { data: response } = await api.getItemCategoryList(payload, options)
        const { content, ...itemCategoryPaging } = response.data
        set({ itemCategoryList: content, itemCategoryPaging })
        return response
    },

    getItemCategoryDetails: async (code, options) => {
        const { data: response } = await api.getItemCategoryDetails(code, options)
        set({ itemCategoryDetails: response.data })
        return response
    },

    createItemCategory: (payload, options) => api.createItemCategory(payload, options),

    updateItemCategory: (code, payload, options) => api.updateItemCategory(code, payload, options),

    deactivateItemCategory: (code, options) => api.deactivateItemCategory(code, options),

    getItemCategoriesItemCount: async (code, options) => {
        const { data: response } = await api.getItemCategoriesItemCount(code, options)
        set({ itemCategoriesItemCount: response.data })
        return response
    }
}));

export default useItemCategoryStore;
