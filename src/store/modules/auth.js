import { create } from 'zustand'
import api from '@api/auth.js'

const useAuthStore = create((set) => ({
    currentUser: null,

    getCurrentUser: async () => {
        try {
            const response = await api.getCurrentUser()
            if (response.status !== 200) {
                set({ currentUser: {} })
                return
            }

            set({ currentUser: response.data })
            return response
        } catch (error) {
            console.error('Error fetching current user:', error);
            set({ currentUser: {} })
        }
    },

    doLogin: async payload => {
        try {
            return await api.doLogin(payload)
        } catch (error) {
            console.error('Error login: ', error);
            return error.response
        }
    },

    doLogout: async () => {
        try {
            const response = await api.doLogout()
            set({ currentUser: {} })
            return response
        } catch (error) {
            console.error('Error logout: ', error);
            return error.response
        }
    }
}));

export default useAuthStore;
