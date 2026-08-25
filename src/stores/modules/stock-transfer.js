import { create } from 'zustand';

import api from '@api/stock-transfer.js';

const useStockTransferStore = create(set => ({
    lastCreatedTransfer: null,

    createStockTransfer: async (payload, requestKey, options) => {
        const { data: response } = await api.createStockTransfer(payload, requestKey, options);
        set({ lastCreatedTransfer: response.data });
        return response;
    },

    clearLastCreatedTransfer: () => set({ lastCreatedTransfer: null })
}));

export default useStockTransferStore;
