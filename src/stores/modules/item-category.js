import { create } from 'zustand'
import api from '@api/item-category.js'

const useItemCategoryStore = create((set) => ({
    itemCategoryList: [],

    getItemCategoryList: async payload => {
        try {
            const { data: response } = await api.getItemCategoryList(payload)
            set({ itemCategoryList: response.data })
            return response
        } catch (error) {
            console.error('Error getting item category list:', error);
            return error.response.data
        }
    },

    createItemCategory: async payload => {
        try {
            return await api.createItemCategory(payload, {
                useLoader: true
            })
        } catch (error) {
            console.error('Error logout: ', error);
            return error.response.data
        }
    },

    updateItemCategory: async (code, payload) => {
        try {
            return await api.updateItemCategory(code, payload, {
                useLoader: true
            })
        } catch (error) {
            console.error('Error logout: ', error);
            return error.response.data
        }
    },

    deactivateItemCategory: async code => {
        try {
            return await api.deactivateItem(code, {
                useLoader: true
            })
        } catch (error) {
            console.error('Error logout: ', error);
            return error.response.data
        }
    }
}));

export default useItemCategoryStore;
