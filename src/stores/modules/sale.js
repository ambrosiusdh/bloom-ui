import { create } from 'zustand'

import api from '@api/sale.js'

let latestSaleListRequestId = 0;
let latestSaleDetailRequestId = 0;

const createSaleState = () => ({
    saleList: [],
    salePaging: {},
    saleListStatus: 'idle',
    saleListError: null,
    saleDetails: null,
    saleDetailStatus: 'idle',
    saleDetailError: null,
});

const createSaleAction = set => ({
    getSaleList: async (params, config, options) => {
        const requestId = ++latestSaleListRequestId;
        set({
            saleList: [],
            salePaging: {},
            saleListStatus: 'loading',
            saleListError: null
        });

        try {
            const { data: response } = await api.getSaleList(params, config, options)
            const { content = [], ...salePaging } = response.data || {}
            if (requestId === latestSaleListRequestId && !config?.signal?.aborted) {
                set({
                    saleList: content,
                    salePaging,
                    saleListStatus: 'ready',
                    saleListError: null
                });
            }
            return response
        } catch (error) {
            if (requestId === latestSaleListRequestId && !config?.signal?.aborted) {
                set({
                    saleList: [],
                    salePaging: {},
                    saleListStatus: 'error',
                    saleListError: error
                });
            }
            throw error
        }
    },

    getSaleDetails: async (code, config, options) => {
        const requestId = ++latestSaleDetailRequestId;
        set({
            saleDetails: null,
            saleDetailStatus: 'loading',
            saleDetailError: null
        })

        try {
            const { data: response } = await api.getSaleDetails(code, config, options)
            if (requestId === latestSaleDetailRequestId && !config?.signal?.aborted) {
                set({
                    saleDetails: response.data,
                    saleDetailStatus: 'ready',
                    saleDetailError: null
                })
            }
            return response
        } catch (error) {
            if (requestId === latestSaleDetailRequestId && !config?.signal?.aborted) {
                set({
                    saleDetails: null,
                    saleDetailStatus: 'error',
                    saleDetailError: error
                })
            }
            throw error
        }
    },

    createSale: async (data, idempotencyKey, options) => {
        try {
            const { data: response } = await api.createSale(data, idempotencyKey, options)
            return response
        } catch (error) {
            console.error('Error create sale: ', error);
            throw error
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
            throw error
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
