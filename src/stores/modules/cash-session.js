import { create } from 'zustand';

import cashSessionApi from '@api/cash-session.js';
import { API_ERROR_CATEGORY } from '@api/index.js';

let latestCurrentRequestId = 0;

const useCashSessionStore = create((set, get) => ({
    currentSession: null,
    currentStatus: 'idle',
    currentError: null,
    lastCheckedAt: null,
    drawerActionsEnabled: false,
    isOpening: false,
    openingError: null,
    isClosing: false,
    closingError: null,

    getCurrentSession: async options => {
        const requestId = ++latestCurrentRequestId;
        set({
            currentStatus: 'loading',
            currentError: null,
            drawerActionsEnabled: false
        });

        try {
            const { data: response } = await cashSessionApi.getCurrentSession(options);
            if (requestId === latestCurrentRequestId) {
                set({
                    currentSession: response.data,
                    currentStatus: 'ready',
                    currentError: null,
                    lastCheckedAt: Date.now(),
                    drawerActionsEnabled: response.data?.status === 'OPEN'
                });
            }
            return response.data;
        } catch (error) {
            if (requestId !== latestCurrentRequestId) {
                throw error;
            }

            set({
                currentStatus: 'error',
                currentError: error,
                drawerActionsEnabled: false
            });
            throw error;
        }
    },

    getSessionDetails: async (sessionId, options) => {
        latestCurrentRequestId += 1;
        set({
            currentStatus: 'loading',
            currentError: null,
            drawerActionsEnabled: false
        });

        try {
            const { data: response } = await cashSessionApi.getSessionDetails(sessionId, options);
            set({
                currentSession: response.data,
                currentStatus: 'ready',
                currentError: null,
                lastCheckedAt: Date.now(),
                drawerActionsEnabled: response.data?.status === 'OPEN'
            });
            return response.data;
        } catch (error) {
            set({
                currentStatus: 'error',
                currentError: error,
                drawerActionsEnabled: false
            });
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
                drawerActionsEnabled: response.data?.status === 'OPEN',
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

    closeSession: async (sessionId, payload, options) => {
        if (get().isClosing || !get().drawerActionsEnabled) return null;

        set({
            isClosing: true,
            closingError: null,
            drawerActionsEnabled: false
        });
        try {
            const { data: response } = await cashSessionApi.closeSession(
                sessionId,
                payload,
                options
            );
            latestCurrentRequestId += 1;
            set({
                currentSession: response.data,
                currentStatus: 'ready',
                currentError: null,
                lastCheckedAt: Date.now(),
                drawerActionsEnabled: false,
                closingError: null
            });
            return response.data;
        } catch (error) {
            set({
                closingError: error,
                drawerActionsEnabled: error?.category === API_ERROR_CATEGORY.VALIDATION
                    && get().currentStatus === 'ready'
                    && get().currentSession?.status === 'OPEN'
            });
            throw error;
        } finally {
            set({ isClosing: false });
        }
    },

    clearOpeningError: () => set({ openingError: null }),
    clearClosingError: () => set({ closingError: null })
}));

export default useCashSessionStore;
