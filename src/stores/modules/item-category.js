import { create } from 'zustand'
import api from '@api/item-category.js'

const useItemCategoryStore = create((set) => ({
    itemCategoryList: [],
    itemCategoryPaging: {},

    getItemCategoryList: async payload => {
        try {
            const { data: response } = await api.getItemCategoryList(payload)
            set({
                itemCategoryList: response.data.content,
                itemCategoryPaging: { ...response.data }
            })
            return response
        } catch (error) {
            console.error('Error getting item category list:', error);
            throw error?.response?.data || error
        }
    },

    createItemCategory: async payload => {
        try {
            return await api.createItemCategory(payload, {
                useLoader: true
            })
        } catch (error) {
            console.error('Error logout: ', error);
            throw error?.response?.data || error
        }
    },

    updateItemCategory: async (code, payload) => {
        try {
            return await api.updateItemCategory(code, payload, {
                useLoader: true
            })
        } catch (error) {
            console.error('Error logout: ', error);
            throw error?.response?.data || error
        }
    },

    deactivateItemCategory: async code => {
        try {
            return await api.deactivateItemCategory(code, {
                useLoader: true
            })
        } catch (error) {
            console.error('Error logout: ', error);
            throw error?.response?.data || error
        }
    }
}));

export default useItemCategoryStore;
