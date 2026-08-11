import { create } from 'zustand'

import api from '@api/sale.js'

const createSaleState = () => ({
    saleList: [],
    salePaging: {},
    saleDetails: {},
});

const createSaleAction = set => ({
    getSaleList: async (payload, options) => {
        try {
            const { data: response } = await api.getSaleList(payload, options)
            const { content, ...salePaging } = response.data
            set({ saleList: content, salePaging })
            return response
        } catch (error) {
            console.error('Error getting sale list:', error);
            throw error?.response?.data || error
        }
    },

    getSaleDetails: async (code, options) => {
        try {
            const { data: response } = await api.getSaleDetails(code, options)
            set({ saleDetails: response.data })
            return response
        } catch (error) {
            console.error('Error getting sale details: ', error);
            throw error?.response?.data || error
        }
    },

    createSale: async (payload, options) => {
        try {
            const { data: response } = await api.createSale(payload, options)
            return response
        } catch (error) {
            console.error('Error create sale: ', error);
            throw error?.response?.data || error
        }
    },

    printReceipt: async (saleCode, options) => {
        const { data: response } = await api.printReceipt(saleCode, options)

        if (response?.data !== true) {
            throw new Error('Backend tidak mengonfirmasi pencetakan struk.')
        }

        return response
    }
})

const useSaleStore = create((set, get) => ({
    ...createSaleState(),
    ...createSaleAction(set, get)
}));

export default useSaleStore;
