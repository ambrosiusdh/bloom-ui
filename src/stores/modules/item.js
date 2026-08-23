import { create } from 'zustand'

import api from '@api/item.js'

const createItemState = () => ({
    itemList: [],
    itemPaging: {},
    itemDetails: {},
    auditLogs: [],
    auditLogPaging: {
        page: 0,
        hasNext: true
    },
    isFetchingAuditLogs: false
});

const createItemAction = (set, get) => ({
    getItemList: async (payload, options) => {
        const { data: response } = await api.getItemList(payload, options)
        if (payload?.signal?.aborted) {
            return response
        }
        const { content, ...itemPaging } = response.data
        set({ itemList: content, itemPaging })
        return response
    },

    createItem: (payload, options) => api.createItem(payload, options),

    getItemDetails: async (sku, config, options) => {
        const { data: response } = await api.getItemDetails(sku, config, options)
        if (config?.signal?.aborted) {
            return response
        }
        set({ itemDetails: response.data })
        return response
    },

    updateItem: async (sku, payload, options) => {
        try {
            const { data: response } = await api.updateItem(sku, payload, options)
            set({ itemDetails: response.data })
            return response
        } catch (error) {
            throw error?.response?.data || error
        }
    },

    deactivateItem: async (sku, options) => {
        try {
            const { data: response } = await api.deactivateItem(sku, options)
            return response
        } catch (error) {
            console.error('Error deactivating item:', error);
            throw error?.response?.data || error
        }
    },

    getItemAuditLog: async (sku, payload, options) => {
        const { auditLogs, isFetchingAuditLogs } = get();
        // Prevent duplicate fetch
        if (isFetchingAuditLogs) return;

        set({ isFetchingAuditLogs: true });

        try {
            const { data: response } = await api.getItemAuditLog(sku, payload, options);
            const { content, last, number } = response.data;

            set({
                auditLogs: [...auditLogs, ...content],
                auditLogPaging: {
                    page: number,
                    hasNext: !last
                }
            });
            return response;
        } catch (error) {
            console.error('Error getting item audit log:', error);
            throw error?.response?.data || error;
        } finally {
            set({ isFetchingAuditLogs: false });
        }
    },

    resetAuditLogs: () => {
        set({
            auditLogs: [],
            auditLogPaging: { page: 0, hasNext: true }
        });
    }
})

const useItemStore = create((set, get) => ({
    ...createItemState(),
    ...createItemAction(set, get)
}));

export default useItemStore;
