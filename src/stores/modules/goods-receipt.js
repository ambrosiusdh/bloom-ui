import { create } from 'zustand'

import api from '@api/goods-receipt.js'

const createGoodsReceiptState = () => ({
    goodsReceiptList: [],
    goodsReceiptPaging: {},
    goodsReceiptDetails: {},
    isSubmitting: false,
    errors: null
});

const createGoodsReceiptAction = (set, get) => ({
    getGoodsReceiptList: async (payload, options) => {
        try {
            const { data: response } = await api.getGoodsReceiptList(payload, options)
            const { content, ...goodsReceiptPaging } = response.data
            set({ goodsReceiptList: content, goodsReceiptPaging })
            return response
        } catch (error) {
            console.error('Error getting goods receipt list:', error);
            throw error?.response?.data || error
        }
    },

    getGoodsReceiptDetails: async (payload, options) => {
        try {
            const { data: response } = await api.getGoodsReceiptDetails(payload, options)
            set({ goodsReceiptDetails: response.data })
            return response
        } catch (error) {
            console.error('Error getting goods receipt details: ', error);
            throw error?.response?.data || error
        }
    },

    createGoodsReceipt: async (payload, options) => {
        set({ isSubmitting: true, errors: null })
        try {
            const { data: response } = await api.createGoodsReceipt(payload, options)
            return response
        } catch (error) {
            console.error('Error create goods receipt: ', error);
            const errData = error?.response?.data || error;
            set({ errors: errData })
            throw errData
        } finally {
            set({ isSubmitting: false })
        }
    }
})

const useGoodsReceiptStore = create((set, get) => ({
    ...createGoodsReceiptState(),
    ...createGoodsReceiptAction(set, get)
}));

export default useGoodsReceiptStore;
