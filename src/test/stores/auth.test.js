import { beforeEach, describe, expect, it, vi } from 'vitest';

const authApi = vi.hoisted(() => ({
    doLogin: vi.fn(),
    doLogout: vi.fn(),
    getCurrentUser: vi.fn()
}));

vi.mock('@api/auth.js', () => ({ default: authApi }));

import useAuthStore from '@stores/modules/auth.js';

describe('auth store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.setState({ currentUser: null, authStatus: 'checking' });
    });

    it('uses the current-session response as the authenticated state', async () => {
        authApi.getCurrentUser.mockResolvedValue({
            status: 200,
            data: { data: { username: 'kasir', name: 'Kasir' } }
        });

        await useAuthStore.getState().getCurrentUser();

        expect(useAuthStore.getState()).toMatchObject({
            authStatus: 'authenticated',
            currentUser: { username: 'kasir', name: 'Kasir' }
        });
    });

    it('clears the session when the current-session check expires', async () => {
        authApi.getCurrentUser.mockRejectedValue(new Error('expired'));

        await useAuthStore.getState().getCurrentUser();

        expect(useAuthStore.getState()).toMatchObject({
            authStatus: 'unauthenticated',
            currentUser: null
        });
    });

    it('preserves normalized login failures for the form to render safely', async () => {
        const failure = Object.assign(new Error('Sesi Anda telah berakhir.'), {
            name: 'ApiError',
            category: 'authentication'
        });
        authApi.doLogin.mockRejectedValue(failure);

        await expect(useAuthStore.getState().doLogin({ data: {} })).rejects.toBe(failure);
    });
});
