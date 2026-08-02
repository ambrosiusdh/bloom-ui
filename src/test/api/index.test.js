import { describe, expect, it, vi } from 'vitest';

const axiosMocks = vi.hoisted(() => {
    const request = vi.fn();
    const useResponseInterceptor = vi.fn();

    request.interceptors = {
        response: {
            use: useResponseInterceptor
        }
    };

    return {
        create: vi.fn(() => request),
        request,
        useResponseInterceptor
    };
});

vi.mock('axios', () => ({
    default: {
        create: axiosMocks.create
    }
}));

import api, { API_ERROR_CATEGORY, normalizeApiError } from '@api/index.js';

const createHttpError = (status, data = {}) => ({
    response: { status, data }
});

describe('normalizeApiError', () => {
    it.each([
        [
            'authentication failures',
            createHttpError(401, { error: 'Unauthorized' }),
            API_ERROR_CATEGORY.AUTHENTICATION,
            401
        ],
        [
            'authorization failures',
            createHttpError(403),
            API_ERROR_CATEGORY.AUTHORIZATION,
            403
        ],
        [
            'not-found failures',
            createHttpError(404),
            API_ERROR_CATEGORY.NOT_FOUND,
            404
        ],
        [
            'conflicts',
            createHttpError(409),
            API_ERROR_CATEGORY.CONFLICT,
            409
        ]
    ])('normalizes %s', (_description, error, category, status) => {
        expect(normalizeApiError(error)).toMatchObject({
            name: 'ApiError',
            category,
            status,
            validationErrors: []
        });
    });

    it('preserves safe validation details without retaining the backend payload', () => {
        const normalizedError = normalizeApiError(createHttpError(400, {
            errorType: 'ValidationFailed',
            message: [
                { field: 'name', message: 'must not be blank' },
                { field: 'quantity', message: 'must be positive' },
                { field: 42, message: 'ignored' }
            ]
        }));

        expect(normalizedError).toMatchObject({
            category: API_ERROR_CATEGORY.VALIDATION,
            status: 400,
            validationErrors: [
                { field: 'name', message: 'must not be blank' },
                { field: 'quantity', message: 'must be positive' }
            ]
        });
        expect(normalizedError.response).toBeUndefined();
    });

    it('distinguishes network and unexpected failures', () => {
        expect(normalizeApiError({ request: {} })).toMatchObject({
            category: API_ERROR_CATEGORY.NETWORK,
            status: null
        });
        expect(normalizeApiError(new Error('unexpected'))).toMatchObject({
            category: API_ERROR_CATEGORY.UNEXPECTED,
            status: null
        });
    });
});

describe('api', () => {
    it('rejects the normalized error from the existing Axios interceptor', async () => {
        const [, rejectResponse] = axiosMocks.useResponseInterceptor.mock.calls[0];
        const axiosError = createHttpError(409, { message: 'stale record' });

        axiosMocks.request.mockImplementation(() => Promise.reject(axiosError).catch(rejectResponse));

        await expect(api({ url: '/example' })).rejects.toMatchObject({
            name: 'ApiError',
            category: API_ERROR_CATEGORY.CONFLICT,
            status: 409,
            validationErrors: []
        });
    });

    it('redirects an expired session to login while preserving the internal destination', async () => {
        const [, rejectResponse] = axiosMocks.useResponseInterceptor.mock.calls[0];
        const assign = vi.fn();
        vi.stubGlobal('window', {
            location: {
                pathname: '/items',
                search: '?page=2',
                hash: '#stock',
                assign
            }
        });

        await expect(rejectResponse(createHttpError(401))).rejects.toMatchObject({
            category: API_ERROR_CATEGORY.AUTHENTICATION
        });
        expect(assign).toHaveBeenCalledWith('/login?redirect=%2Fitems%3Fpage%3D2%23stock');

        vi.unstubAllGlobals();
    });
});
