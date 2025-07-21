import api from "@api/index.js";

export const getCurrentUser = async () => {
    const res = await api.get('/api/auth/current')
    return res.data
}

export const login = async (data) => {
    await api.post('/api/auth/login', data)
}

export const logout = async () => {
    await api.post('/api/auth/logout')
}