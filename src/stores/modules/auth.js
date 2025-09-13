import { create } from 'zustand'

import api from '@api/auth.js'


const useAuthStore = create((set) => ({
    currentUser: null,

    getCurrentUser: async () => {
        try {
            const response = await api.getCurrentUser()
            if (response.status !== 200) {
                console.log(response)
                set({ currentUser: {} })
                return
            }

            set({ currentUser: response.data.data })
            return response
        } catch (error) {
            console.error('Error fetching current user:', error);
            set({ currentUser: {} })
        }
    },

    doLogin: async (payload, options) => {
        try {
            const { data: response } = await api.doLogin(payload, options)
            return response
        } catch (error) {
            console.error('Error login: ', error);
            throw error?.response?.data || error
        }
    },

    doLogout: async () => {
        try {
            const { data: response } = await api.doLogout()
            set({ currentUser: {} })
            return response
        } catch (error) {
            console.error('Error logout: ', error);
            throw error?.response?.data || error
        }
    }
}));

export default useAuthStore;
