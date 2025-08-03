import { create } from 'zustand'
import api from '@api/item.js'

const useItemStore = create((set) => ({
    itemList: [],
    itemDetails: {},

    getItemList: async payload => {
        try {
            const { data: response } = await api.getItemList(payload)
            set({ itemList: response.data })
            return response
        } catch (error) {
            console.error('Error getting item list:', error);
            return error.response.data
        }
    },

    getItemDetails: async sku => {
        try {
            const { data: response } = await api.getItemDetails(sku)
            set({ itemDetails: response.data })
            return response
        } catch (error) {
            console.error('Error getting item details: ', error);
            return error.response.data
        }
    },

    createItem: async payload => {
        try {
            return await api.createItem(payload, {
                useLoader: true
            })
        } catch (error) {
            console.error('Error logout: ', error);
            return error.response.data
        }
    },

    updateItem: async (sku, payload) => {
        try {
            return await api.updateItem(sku, payload, {
                useLoader: true
            })
        } catch (error) {
            console.error('Error logout: ', error);
            return error.response.data
        }
    },

    deactivateItem: async sku => {
        try {
            return await api.deactivateItem(sku, {
                useLoader: true
            })
        } catch (error) {
            console.error('Error logout: ', error);
            return error.response.data
        }
    }
}));

export default useItemStore;
