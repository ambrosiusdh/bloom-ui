import axios from 'axios'

import { useLoaderStore } from "@stores/index.js";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BE_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

axiosInstance.interceptors.response.use(response => response, error => {
    const location = window.location.pathname;

    if (error.response?.status === 401 && location !== "/login") {
        window.location.href = "/login";
    }

    return Promise.reject(error)
})

export default async function (config, options = {}) {
    const { showLoader, hideLoader } = useLoaderStore.getState();
    const {
        useLoader = false
    } = options;

    if (useLoader) {
        showLoader();
    }

    try {
        return await axiosInstance({
            method: config.method || 'POST',
            ...config
        });
    } finally {
        if (useLoader) {
            hideLoader();
        }
    }
}