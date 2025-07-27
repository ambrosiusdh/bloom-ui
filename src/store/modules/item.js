import { create } from 'zustand'
import api from '@api/item.js'

const useItemStore = create((set) => ({
    itemList: [],
    itemDetails: {},

    getItemList: async payload => {
        try {
            const response = await api.getItemList(payload)
            set({ itemList: response.data })
            return response
        } catch (error) {
            console.error('Error getting item list:', error);
            set({ currentUser: {} })
        }
    },

    getItemDetails: async sku => {
        try {
            const response = await api.getItemDetails(sku)
            set({ itemDetails: response.data })
            return response
        } catch (error) {
            console.error('Error getting item details: ', error);
            return error.response
        }
    },

    createItem: async payload => {
        try {
            return await api.createItem(payload)
        } catch (error) {
            console.error('Error logout: ', error);
            return error.response
        }
    },

    updateItem: async (sku, payload) => {
        try {
            return await api.createItem(sku, payload)
        } catch (error) {
            console.error('Error logout: ', error);
            return error.response
        }
    },

    deactivateItem: async sku => {
        try {
            return await api.deactivateItem(sku)
        } catch (error) {
            console.error('Error logout: ', error);
            return error.response
        }
    }
}));

export default useItemStore;
