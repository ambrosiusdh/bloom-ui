import { create } from 'zustand'

import api from '@api/dashboard.js'

const useDashboardStore = create((set) => ({
    dashboardData: null,
    isLoading: false,
    error: null,

    getDashboardOverview: async (options) => {
        set({ isLoading: true, error: null });
        try {
            const { data: response } = await api.getDashboardOverview(options)
            set({ dashboardData: response.data, isLoading: false, error: null })
            return response
        } catch (error) {
            set({ error, isLoading: false });
            throw error
        }
    }
}));

export default useDashboardStore;
