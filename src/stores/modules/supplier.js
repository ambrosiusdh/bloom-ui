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

    createSupplier: async (payload, options) => {
        const { data: response } = await supplierApi.createSupplier(payload, options);
        latestListRequestId += 1;
        set({
            supplierList: [],
            supplierPaging: {},
            listStatus: 'idle',
            listError: null
        });
        return response.data;
    },

    updateSupplier: async (code, payload, options) => {
        const { data: response } = await supplierApi.updateSupplier(code, payload, options);
        const updatedSupplier = response.data;
        latestListRequestId += 1;
        set(state => ({
            supplierDetails: state.supplierDetails?.code === updatedSupplier.code
                ? updatedSupplier
                : state.supplierDetails,
            supplierList: [],
            supplierPaging: {},
            listStatus: 'idle',
            listError: null
        }));
        return updatedSupplier;
    },

    setSupplierActive: async (code, active, options) => {
        const { data: response } = await supplierApi.setSupplierActive(code, active, options);
        const updatedSupplier = response.data;
        latestListRequestId += 1;
        set(state => ({
            supplierDetails: state.supplierDetails?.code === updatedSupplier.code
                ? updatedSupplier
                : state.supplierDetails,
            supplierList: [],
            supplierPaging: {},
            listStatus: 'idle',
            listError: null
        }));
        return updatedSupplier;
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
