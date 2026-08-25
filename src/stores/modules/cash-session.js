import { create } from 'zustand';

import cashSessionApi from '@api/cash-session.js';
import { API_ERROR_CATEGORY } from '@api/index.js';

let latestCurrentRequestId = 0;

const useCashSessionStore = create((set, get) => ({
    currentSession: null,
    currentStatus: 'idle',
    currentError: null,
    lastCheckedAt: null,
    isOpening: false,
    openingError: null,

    getCurrentSession: async options => {
        const requestId = ++latestCurrentRequestId;
        set({ currentStatus: 'loading', currentError: null });

        try {
            const { data: response } = await cashSessionApi.getCurrentSession(options);
            if (requestId === latestCurrentRequestId) {
                set({
                    currentSession: response.data,
                    currentStatus: 'ready',
                    currentError: null,
                    lastCheckedAt: Date.now()
                });
            }
            return response.data;
        } catch (error) {
            if (requestId !== latestCurrentRequestId) {
                throw error;
            }

            if (error?.category === API_ERROR_CATEGORY.NOT_FOUND || error?.status === 404) {
                set({
                    currentSession: null,
                    currentStatus: 'ready',
                    currentError: null,
                    lastCheckedAt: Date.now()
                });
                return null;
            }

            set({ currentStatus: 'error', currentError: error });
            throw error;
        }
    },

    openSession: async (payload, options) => {
        if (get().isOpening) return null;

        set({ isOpening: true, openingError: null });
        try {
            const { data: response } = await cashSessionApi.openSession(payload, options);
            latestCurrentRequestId += 1;
            set({
                currentSession: response.data,
                currentStatus: 'ready',
                currentError: null,
                lastCheckedAt: Date.now(),
                openingError: null
            });
            return response.data;
        } catch (error) {
            set({ openingError: error });
            throw error;
        } finally {
            set({ isOpening: false });
        }
    },

    clearOpeningError: () => set({ openingError: null })
}));

export default useCashSessionStore;
