import axios from 'axios'

import { useLoaderStore } from "@stores/index.js";

export const API_ERROR_CATEGORY = Object.freeze({
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    NOT_FOUND: 'not_found',
    CONFLICT: 'conflict',
    NETWORK: 'network',
    UNEXPECTED: 'unexpected'
});

const ERROR_MESSAGES = {
    [API_ERROR_CATEGORY.VALIDATION]: 'Masukan tidak valid.',
    [API_ERROR_CATEGORY.AUTHENTICATION]: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    [API_ERROR_CATEGORY.AUTHORIZATION]: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
    [API_ERROR_CATEGORY.NOT_FOUND]: 'Data yang diminta tidak ditemukan.',
    [API_ERROR_CATEGORY.CONFLICT]: 'Data telah berubah. Muat ulang dan coba lagi.',
    [API_ERROR_CATEGORY.NETWORK]: 'Gagal terhubung ke server. Periksa koneksi Anda dan coba lagi.',
    [API_ERROR_CATEGORY.UNEXPECTED]: 'Terjadi kesalahan. Silakan coba lagi.'
};

const getValidationErrors = data => {
    if (!Array.isArray(data?.message)) {
        return [];
    }

    return data.message
        .filter(detail => typeof detail?.field === 'string' && typeof detail?.message === 'string')
        .map(({ field, message }) => ({ field, message }));
};

const getCategory = (status, validationErrors, hasRequest, isValidationFailure) => {
    if (isValidationFailure || validationErrors.length || status === 422) {
        return API_ERROR_CATEGORY.VALIDATION;
    }

    switch (status) {
        case 401:
            return API_ERROR_CATEGORY.AUTHENTICATION;
        case 403:
            return API_ERROR_CATEGORY.AUTHORIZATION;
        case 404:
            return API_ERROR_CATEGORY.NOT_FOUND;
        case 409:
            return API_ERROR_CATEGORY.CONFLICT;
        default:
            return hasRequest && !status
                ? API_ERROR_CATEGORY.NETWORK
                : API_ERROR_CATEGORY.UNEXPECTED;
    }
};

/**
 * Normalizes failed API requests without exposing raw Axios or backend payloads
 * to screens. `validationErrors` contains only the backend's field/message pairs.
 */
export const normalizeApiError = error => {
    if (error?.name === 'ApiError') {
        return error;
    }

    const status = error?.response?.status ?? null;
    const responseData = error?.response?.data;
    const validationErrors = getValidationErrors(responseData);
    const category = getCategory(
        status,
        validationErrors,
        Boolean(error?.request),
        responseData?.errorType === 'ValidationFailed'
    );
    const normalizedError = new Error(ERROR_MESSAGES[category]);

    normalizedError.name = 'ApiError';
    normalizedError.status = status;
    normalizedError.category = category;
    normalizedError.validationErrors = validationErrors;

    return normalizedError;
};

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BE_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

axiosInstance.interceptors.response.use(response => response, error => {
    const location = window.location;

    if (error.response?.status === 401 && location.pathname !== "/login") {
        const redirectTarget = `${location.pathname}${location.search}${location.hash}`;
        window.location.assign(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
    }

    return Promise.reject(normalizeApiError(error))
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
