import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import authApi from '@api/auth.js';

describe('auth API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('lets protected routing handle the initial current-session rejection', async () => {
        await authApi.getCurrentUser();

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/auth/current',
            method: 'GET',
            skipAuthRedirect: true
        }, undefined);
    });
});
