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
    goodsReceiptDetailError: null
});

const createGoodsReceiptAction = (set, get) => ({
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
                const { content, ...goodsReceiptPaging } = response.data || {}
                set({
                    goodsReceiptList: Array.isArray(content) ? content : [],
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

    clearGoodsReceiptDetails: () => {
        latestGoodsReceiptDetailRequestId += 1;
        set({
            goodsReceiptDetails: null,
            goodsReceiptDetailStatus: 'idle',
            goodsReceiptDetailError: null
        });
    },

    cancelGoodsReceipt: async (code, reason) => {
        const { data: response } = await api.cancelGoodsReceipt(code, reason);
        const receipt = response?.data;

        if (receipt?.code !== code || receipt.status !== 'CANCELLED'
            || receipt.canCancel !== false || !receipt.cancellationReason?.trim()
            || !receipt.cancelledBy?.trim() || !Number.isFinite(Date.parse(receipt.cancelledAt))) {
            throw new Error('Receipt cancellation result could not be confirmed');
        }

        if (get().goodsReceiptDetails?.code === code) {
            latestGoodsReceiptDetailRequestId += 1;
            set({
                goodsReceiptDetails: receipt,
                goodsReceiptDetailStatus: 'ready',
                goodsReceiptDetailError: null
            });
        }

        return receipt;
    }

})

const useGoodsReceiptStore = create((set, get) => ({
    ...createGoodsReceiptState(),
    ...createGoodsReceiptAction(set, get)
}));

export default useGoodsReceiptStore;
