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
        try {
            const { data: response } = await api.getItemList(payload, options)
            const { content, ...itemPaging } = response.data
            set({ itemList: content, itemPaging })
            return response
        } catch (error) {
            console.error('Error getting item list:', error);
            throw error?.response?.data || error
        }
    },

    createItem: async (payload, options) => {
        try {
            const { data: response } = await api.createItem(payload, options)
            return response
        } catch (error) {
            console.error('Error creating item:', error);
            throw error?.response?.data || error
        }
    },

    getItemDetails: async (sku, options) => {
        try {
            const { data: response } = await api.getItemDetails(sku, options)
            set({ itemDetails: response.data })
            return response
        } catch (error) {
            console.error('Error getting item details:', error);
            throw error?.response?.data || error
        }
    },

    updateItem: async (sku, payload, options) => {
        try {
            const { data: response } = await api.updateItem(sku, payload, options)
            return response
        } catch (error) {
            console.error('Error udpating item:', error);
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
