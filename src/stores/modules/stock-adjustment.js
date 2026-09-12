import { create } from 'zustand';

import api from '@api/stock-adjustment.js';

let latestListRequestId = 0;
let latestDetailRequestId = 0;

const initialState = {
    stockAdjustmentList: [],
    stockAdjustmentPaging: {},
    stockAdjustmentDetails: null,
    stockAdjustmentListStatus: 'idle',
    stockAdjustmentListError: null,
    stockAdjustmentDetailStatus: 'idle',
    stockAdjustmentDetailError: null,
    stockAdjustmentCreateStatus: 'idle',
    stockAdjustmentCreateError: null,
    lastCreatedStockAdjustment: null
};

const useStockAdjustmentStore = create((set, get) => ({
    ...initialState,

    getStockAdjustmentList: async (params, config, options) => {
        const requestId = ++latestListRequestId;
        set({
            stockAdjustmentList: [],
            stockAdjustmentPaging: {},
            stockAdjustmentListStatus: 'loading',
            stockAdjustmentListError: null
        });

        try {
            const { data: response } = await api.getStockAdjustmentList(
                params,
                config,
                options
            );
            if (requestId === latestListRequestId && !config?.signal?.aborted) {
                const {
                    content,
                    ...paging
                } = response.data || {};
                set({
                    stockAdjustmentList: Array.isArray(content) ? content : [],
                    stockAdjustmentPaging: paging,
                    stockAdjustmentListStatus: 'ready',
                    stockAdjustmentListError: null
                });
            }
            return response;
        } catch (error) {
            if (requestId === latestListRequestId && !config?.signal?.aborted) {
                set({
                    stockAdjustmentList: [],
                    stockAdjustmentPaging: {},
                    stockAdjustmentListStatus: 'error',
                    stockAdjustmentListError: error
                });
            }
            throw error;
        }
    },

    getStockAdjustmentDetails: async (code, config, options) => {
        const requestId = ++latestDetailRequestId;
        set({
            stockAdjustmentDetails: null,
            stockAdjustmentDetailStatus: 'loading',
            stockAdjustmentDetailError: null
        });

        try {
            const { data: response } = await api.getStockAdjustmentDetails(
                code,
                config,
                options
            );
            if (requestId === latestDetailRequestId && !config?.signal?.aborted) {
                set({
                    stockAdjustmentDetails: response.data,
                    stockAdjustmentDetailStatus: 'ready',
                    stockAdjustmentDetailError: null
                });
            }
            return response;
        } catch (error) {
            if (requestId === latestDetailRequestId && !config?.signal?.aborted) {
                set({
                    stockAdjustmentDetails: null,
                    stockAdjustmentDetailStatus: 'error',
                    stockAdjustmentDetailError: error
                });
            }
            throw error;
        }
    },

    createStockAdjustment: async (payload, options) => {
        if (get().stockAdjustmentCreateStatus === 'pending') {
            return null;
        }
        set({
            stockAdjustmentCreateStatus: 'pending',
            stockAdjustmentCreateError: null
        });

        try {
            const { data: response } = await api.createStockAdjustment(payload, options);
            set({
                stockAdjustmentCreateStatus: 'success',
                stockAdjustmentCreateError: null,
                lastCreatedStockAdjustment: response.data
            });
            return response;
        } catch (error) {
            set({
                stockAdjustmentCreateStatus: 'error',
                stockAdjustmentCreateError: error
            });
            throw error;
        }
    },

    clearStockAdjustmentDetails: () => {
        latestDetailRequestId += 1;
        set({
            stockAdjustmentDetails: null,
            stockAdjustmentDetailStatus: 'idle',
            stockAdjustmentDetailError: null
        });
    },

    clearCreatedStockAdjustment: () => set({
        stockAdjustmentCreateStatus: 'idle',
        stockAdjustmentCreateError: null,
        lastCreatedStockAdjustment: null
    })
}));

export default useStockAdjustmentStore;
