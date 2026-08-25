import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import cashSessionApi from '@api/cash-session.js';

describe('cash session API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('gets paginated cash-session history with supported filters', async () => {
        const payload = {
            params: { page: 2, size: 20, status: 'CLOSED' },
            signal: new AbortController().signal
        };

        await cashSessionApi.getSessionHistory(payload);

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/cash-sessions',
            method: 'GET',
            ...payload
        }, undefined);
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

    it('gets the server reconciliation preview for one session', async () => {
        const options = { signal: new AbortController().signal };

        await cashSessionApi.getExpectedCash(17, options);

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/cash-sessions/17/expected-cash',
            method: 'GET'
        }, options);
    });

    it('posts only actual closing cash to the verified close endpoint', async () => {
        await cashSessionApi.closeSession(17, {
            data: { actualClosingCash: '495000.5000' }
        });

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/cash-sessions/17/close',
            method: 'POST',
            data: { actualClosingCash: '495000.5000' }
        }, undefined);
    });

    it('gets one known session with cancellation support', async () => {
        const options = { signal: new AbortController().signal };
        await cashSessionApi.getSessionDetails(17, options);

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/cash-sessions/17',
            method: 'GET',
            signal: options.signal
        }, options);
    });
});
