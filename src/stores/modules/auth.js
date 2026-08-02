import { create } from 'zustand'

import api from '@api/auth.js'

let currentUserRequestId = 0;

const useAuthStore = create((set) => ({
    currentUser: null,
    authStatus: 'checking',

    getCurrentUser: async () => {
        const requestId = ++currentUserRequestId;
        set({ authStatus: 'checking' });

        try {
            const response = await api.getCurrentUser()
            const currentUser = response.data?.data;

            if (requestId !== currentUserRequestId) {
                return null;
            }

            if (response.status !== 200 || !currentUser?.username) {
                set({ currentUser: null, authStatus: 'unauthenticated' })
                return null;
            }

            set({ currentUser, authStatus: 'authenticated' })
            return response
        } catch (error) {
            if (requestId === currentUserRequestId) {
                set({ currentUser: null, authStatus: 'unauthenticated' })
            }

            return null;
        }
    },

    doLogin: async (payload, options) => {
        const { data: response } = await api.doLogin(payload, options)
        return response
    },

    doLogout: async () => {
        const { data: response } = await api.doLogout()
        currentUserRequestId += 1;
        set({ currentUser: null, authStatus: 'unauthenticated' })
        return response
    }
}));

export default useAuthStore;
