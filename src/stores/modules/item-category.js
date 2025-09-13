import { create } from 'zustand'

import api from '@api/item-category.js'


const useItemCategoryStore = create((set) => ({
    itemCategoryList: [],
    itemCategoryPaging: {},
    itemCategoryDetails: {},

    getItemCategoryList: async (payload, options) => {
        try {
            const { data: response } = await api.getItemCategoryList(payload, options)
            const { content, ...itemCategoryPaging } = response.data
            set({ itemCategoryList: content, itemCategoryPaging })
            return response
        } catch (error) {
            console.error('Error getting item category list:', error);
            throw error?.response?.data || error
        }
    },

    getItemCategoryDetails: async (code, options) => {
        try {
            const { data: response } = await api.getItemCategoryDetails(code, options)
            set({ itemCategoryDetails: response.data })
            return response
        } catch (error) {
            console.error('Error getting item category details: ', error);
            throw error?.response?.data || error
        }
    },

    createItemCategory: async (payload, options) => {
        try {
            return await api.createItemCategory(payload, options)
        } catch (error) {
            console.error('Error logout: ', error);
            throw error?.response?.data || error
        }
    },

    updateItemCategory: async (code, payload, options) => {
        try {
            return await api.updateItemCategory(code, payload, options)
        } catch (error) {
            console.error('Error logout: ', error);
            throw error?.response?.data || error
        }
    },

    deactivateItemCategory: async (code, options) => {
        try {
            return await api.deactivateItemCategory(code, options)
        } catch (error) {
            console.error('Error logout: ', error);
            throw error?.response?.data || error
        }
    }
}));

export default useItemCategoryStore;
