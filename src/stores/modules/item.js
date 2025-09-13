import { create } from 'zustand'

import api from '@api/item.js'


const useItemStore = create((set) => ({
    itemList: [],
    itemPaging: {},
    itemDetails: {},

    getItemList: async (payload, options) => {
        try {
            const { data: response } = await api.getItemList(payload, options)
            const { content, ...itemPaging } = response.data
            set({ itemList: content, itemPaging })
            return response
        } catch (error) {
            console.error('Error getting item list:', error);
            throw error?.response?.data || error
        }
    },

    getItemDetails: async (sku, options) => {
        try {
            const { data: response } = await api.getItemDetails(sku, options)
            set({ itemDetails: response.data })
            return response
        } catch (error) {
            console.error('Error getting item details: ', error);
            throw error?.response?.data || error
        }
    },

    createItem: async (payload, options) => {
        try {
            const { data: response } = await api.createItem(payload, options)
            return response
        } catch (error) {
            console.error('Error logout: ', error);
            throw error?.response?.data || error
        }
    },

    updateItem: async (sku, payload, options) => {
        try {
            const { data: response } = await api.updateItem(sku, payload, options)
            return response
        } catch (error) {
            console.error('Error logout: ', error);
            throw error?.response?.data || error
        }
    },

    deactivateItem: async (sku, options) => {
        try {
            const { data: response } = await api.deactivateItem(sku, options)
            return response
        } catch (error) {
            console.error('Error logout: ', error);
            throw error?.response?.data || error
        }
    }
}));

export default useItemStore;
