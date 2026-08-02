import { create } from 'zustand'

import api from '@api/stock-adjustment.js'

const createStockAdjustmentState = () => ({
    stockAdjustmentList: [],
    stockAdjustmentPaging: {},
    stockAdjustmentDetails: {},
    parsedItems: [], /* Items from CSV parse */
    isSubmitting: false,
    errors: null
});

const createStockAdjustmentAction = (set, get) => ({
    getStockAdjustmentList: async (payload, options) => {
        try {
            const { data: response } = await api.getStockAdjustmentList(payload, options)
            const { content, ...stockAdjustmentPaging } = response.data
            set({ stockAdjustmentList: content, stockAdjustmentPaging })
            return response
        } catch (error) {
            console.error('Error getting stock adjustment list:', error);
            throw error?.response?.data || error
        }
    },

    getStockAdjustmentDetails: async (payload, options) => {
        try {
            const { data: response } = await api.getStockAdjustmentDetails(payload, options)
            set({ stockAdjustmentDetails: response.data })
            return response
        } catch (error) {
            console.error('Error getting stock adjustment details: ', error);
            throw error?.response?.data || error
        }
    },

    createStockAdjustment: async (payload, options) => {
        set({ isSubmitting: true, errors: null })
        try {
            const { data: response } = await api.createStockAdjustment(payload, options)
            return response
        } catch (error) {
            console.error('Error create stock adjustment: ', error);
            const errData = error?.response?.data || error;
            set({ errors: errData })
            throw errData
        } finally {
            set({ isSubmitting: false })
        }
    },

    uploadCsv: async (file, options) => {
        try {
            const { data: response } = await api.parseStockAdjustmentCsv(file, options)
            set({ parsedItems: response.data })
            return response
        } catch (error) {
            console.error('Error parsing CSV: ', error);
            throw error?.response?.data || error
        }
    },

    downloadTemplate: async (options) => {
        try {
            const response = await api.downloadStockAdjustmentTemplate(options);

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Try to extract filename from content-disposition
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'stock_adjustment_template.xlsx';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch && fileNameMatch.length === 2)
                    fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            return response;
        } catch (error) {
            console.error('Error downloading template: ', error);
            throw error?.response?.data || error;
        }
    },

    clearParsedItems: () => {
        set({ parsedItems: [] })
    }
})

const useStockAdjustmentStore = create((set, get) => ({
    ...createStockAdjustmentState(),
    ...createStockAdjustmentAction(set, get)
}));

export default useStockAdjustmentStore;
