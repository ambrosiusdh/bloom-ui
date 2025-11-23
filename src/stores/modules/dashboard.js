import { create } from 'zustand'

import api from '@api/dashboard.js'

const useDashboardStore = create((set) => ({
    dashboardData: {},
    isLoading: false,
    error: null,

    getDashboardOverview: async (options) => {
        set({ isLoading: true, error: null });
        try {
            const { data: response } = await api.getDashboardOverview(options)
            set({ dashboardData: response.data, isLoading: false })
            return response
        } catch (error) {
            console.error('Error getting dashboard overview:', error);
            set({ error: error?.response?.data || error, isLoading: false });
            throw error?.response?.data || error
        }
    }
}));

export default useDashboardStore;
