import { create } from 'zustand'

const useAuthStore = create((set) => ({
    currentUser: null,

    getCurrentUser: async () => {
        try {
            const response = await fetch('/api/auth/current', {
                credentials: 'include'
            })

            if (!response.ok) {
                window.location.href = "/login"
            }

            const data = await response.json()

            set({ currentUser: data })
        } catch (error) {
            console.error('Error fetching current user:', error);
            set({ currentUser: null })
        }
    }
}));

export default useAuthStore;
