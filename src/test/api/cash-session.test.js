import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import cashSessionApi from '@api/cash-session.js';

describe('cash session API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('gets the globally current cash session', async () => {
        const options = { signal: new AbortController().signal };

        await cashSessionApi.getCurrentSession(options);

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/cash-sessions/current',
            method: 'GET'
        }, options);
    });

    it('posts only the verified opening-cash field', async () => {
        await cashSessionApi.openSession({ data: { openingCash: '500000.5000' } });

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/cash-sessions/open',
            method: 'POST',
            data: { openingCash: '500000.5000' }
        }, undefined);
    });
});
