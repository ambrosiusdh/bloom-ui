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

    getSaleDetails: async (code, config, options) => {
        set({ saleDetails: {} })

        try {
            const { data: response } = await api.getSaleDetails(code, config, options)
            if (config?.signal?.aborted) {
                return response
            }
            set({ saleDetails: response.data })
            return response
        } catch (error) {
            if (!config?.signal?.aborted) {
                console.error('Error getting sale details: ', error);
            }
            throw error?.response?.data || error
        }
    },

    createSale: async (data, idempotencyKey, options) => {
        try {
            const { data: response } = await api.createSale(data, idempotencyKey, options)
            return response
        } catch (error) {
            console.error('Error create sale: ', error);
            throw error?.response?.data || error
        }
    },

    getCheckoutStatus: async (idempotencyKey, config, options) => {
        try {
            const { data: response } = await api.getCheckoutStatus(
                idempotencyKey,
                config,
                options
            )
            return response
        } catch (error) {
            console.error('Error getting sale checkout status: ', error);
            throw error?.response?.data || error
        }
    },

    printReceipt: async (saleCode, options) => {
        const { data: response } = await api.printReceipt(saleCode, options)

        if (response?.data !== true) {
            const contractError = new Error('Backend tidak mengonfirmasi pencetakan struk.')
            contractError.name = 'ApiError'
            contractError.category = 'unexpected'
            contractError.status = null
            contractError.domainCode = null
            contractError.validationErrors = []
            throw contractError
        }

        return response
    }
})

const useSaleStore = create((set, get) => ({
    ...createSaleState(),
    ...createSaleAction(set, get)
}));

export default useSaleStore;
