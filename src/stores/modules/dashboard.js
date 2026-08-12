import { create } from 'zustand'

import api from '@api/dashboard.js'

let latestDashboardRequestId = 0;

const useDashboardStore = create((set) => ({
    dashboardData: null,
    lastSuccessfulAt: null,
    isLoading: false,
    error: null,

    getDashboardOverview: async (options) => {
        const requestId = ++latestDashboardRequestId;
        set({ isLoading: true, error: null });
        try {
            const { data: response } = await api.getDashboardOverview(options)

            if (requestId !== latestDashboardRequestId) {
                return response
            }

            set({
                dashboardData: response.data,
                lastSuccessfulAt: Date.now(),
                isLoading: false,
                error: null
            })
            return response
        } catch (error) {
            if (requestId === latestDashboardRequestId) {
                set({ error, isLoading: false });
            }
            throw error
        }
    }
}));

export default useDashboardStore;
