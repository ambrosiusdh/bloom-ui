import { create } from 'zustand'

import api from '@api/goods-receipt.js'

let latestGoodsReceiptListRequestId = 0;
let latestGoodsReceiptDetailRequestId = 0;

const createGoodsReceiptState = () => ({
    goodsReceiptList: [],
    goodsReceiptPaging: {},
    goodsReceiptDetails: null,
    goodsReceiptListStatus: 'idle',
    goodsReceiptListError: null,
    goodsReceiptDetailStatus: 'idle',
    goodsReceiptDetailError: null,
    isSubmitting: false,
    errors: null
});

const createGoodsReceiptAction = set => ({
    getGoodsReceiptList: async (params, config, options) => {
        const requestId = ++latestGoodsReceiptListRequestId;
        set({
            goodsReceiptList: [],
            goodsReceiptPaging: {},
            goodsReceiptListStatus: 'loading',
            goodsReceiptListError: null
        });

        try {
            const { data: response } = await api.getGoodsReceiptList(params, config, options)
            if (requestId === latestGoodsReceiptListRequestId && !config?.signal?.aborted) {
                const { content = [], ...goodsReceiptPaging } = response.data || {}
                set({
                    goodsReceiptList: content,
                    goodsReceiptPaging,
                    goodsReceiptListStatus: 'ready',
                    goodsReceiptListError: null
                })
            }
            return response
        } catch (error) {
            if (requestId === latestGoodsReceiptListRequestId && !config?.signal?.aborted) {
                set({
                    goodsReceiptList: [],
                    goodsReceiptPaging: {},
                    goodsReceiptListStatus: 'error',
                    goodsReceiptListError: error
                });
            }
            throw error
        }
    },

    getGoodsReceiptDetails: async (code, config, options) => {
        const requestId = ++latestGoodsReceiptDetailRequestId;
        set({
            goodsReceiptDetails: null,
            goodsReceiptDetailStatus: 'loading',
            goodsReceiptDetailError: null
        });

        try {
            const { data: response } = await api.getGoodsReceiptDetails(code, config, options)
            if (requestId === latestGoodsReceiptDetailRequestId && !config?.signal?.aborted) {
                set({
                    goodsReceiptDetails: response.data,
                    goodsReceiptDetailStatus: 'ready',
                    goodsReceiptDetailError: null
                })
            }
            return response
        } catch (error) {
            if (requestId === latestGoodsReceiptDetailRequestId && !config?.signal?.aborted) {
                set({
                    goodsReceiptDetails: null,
                    goodsReceiptDetailStatus: 'error',
                    goodsReceiptDetailError: error
                });
            }
            throw error
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
