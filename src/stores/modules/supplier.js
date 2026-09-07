import { create } from 'zustand';

import supplierApi from '@api/supplier.js';

let latestListRequestId = 0;
let latestDetailRequestId = 0;

const initialState = {
    supplierList: [],
    supplierPaging: {},
    listStatus: 'idle',
    listError: null,
    supplierDetails: null,
    detailStatus: 'idle',
    detailError: null
};

const useSupplierStore = create(set => ({
    ...initialState,

    getSupplierList: async (config, options) => {
        const requestId = ++latestListRequestId;
        set({ listStatus: 'loading', listError: null });

        try {
            const { data: response } = await supplierApi.getSupplierList(config, options);
            if (requestId === latestListRequestId) {
                const { content = [], ...supplierPaging } = response.data || {};
                set({
                    supplierList: content,
                    supplierPaging,
                    listStatus: 'ready',
                    listError: null
                });
            }
            return response.data;
        } catch (error) {
            if (requestId === latestListRequestId) {
                set({
                    supplierList: [],
                    supplierPaging: {},
                    listStatus: 'error',
                    listError: error
                });
            }
            throw error;
        }
    },

    getSupplierDetails: async (code, config, options) => {
        const requestId = ++latestDetailRequestId;
        set({ detailStatus: 'loading', detailError: null });

        try {
            const { data: response } = await supplierApi.getSupplierDetails(code, config, options);
            if (requestId === latestDetailRequestId) {
                set({
                    supplierDetails: response.data,
                    detailStatus: 'ready',
                    detailError: null
                });
            }
            return response.data;
        } catch (error) {
            if (requestId === latestDetailRequestId) {
                set({
                    supplierDetails: null,
                    detailStatus: 'error',
                    detailError: error
                });
            }
            throw error;
        }
    },

    clearSupplierDetails: () => {
        latestDetailRequestId += 1;
        set({
            supplierDetails: null,
            detailStatus: 'idle',
            detailError: null
        });
    }
}));

export default useSupplierStore;
