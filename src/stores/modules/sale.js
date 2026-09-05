import { create } from 'zustand'

import api from '@api/sale.js'
import { RECEIPT_PRINT_STATUS } from '@constants/receipt-print.js'

let nextReceiptPrintRequestId = 0;

const createSaleState = () => ({
    saleList: [],
    salePaging: {},
    saleDetails: {},
    receiptPrintStateBySale: {},
});

const setReceiptPrintState = (set, saleCode, printState) => set(state => ({
    receiptPrintStateBySale: {
        ...state.receiptPrintStateBySale,
        [saleCode]: printState
    }
}));

const createSaleAction = (set, get) => ({
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
        const currentPrintState = get().receiptPrintStateBySale[saleCode];
        if (currentPrintState?.status === RECEIPT_PRINT_STATUS.PENDING) {
            return undefined;
        }

        const requestId = ++nextReceiptPrintRequestId;
        setReceiptPrintState(set, saleCode, {
            status: RECEIPT_PRINT_STATUS.PENDING,
            error: null,
            requestId
        });

        try {
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

            if (get().receiptPrintStateBySale[saleCode]?.requestId === requestId) {
                setReceiptPrintState(set, saleCode, {
                    status: RECEIPT_PRINT_STATUS.SUCCESS,
                    error: null,
                    requestId
                });
            }

            return response
        } catch (error) {
            const printError = error?.response?.data || error;
            if (get().receiptPrintStateBySale[saleCode]?.requestId === requestId) {
                setReceiptPrintState(set, saleCode, {
                    status: RECEIPT_PRINT_STATUS.ERROR,
                    error: printError,
                    requestId
                });
            }
            throw printError
        }
    }
})

const useSaleStore = create((set, get) => ({
    ...createSaleState(),
    ...createSaleAction(set, get)
}));

export default useSaleStore;
