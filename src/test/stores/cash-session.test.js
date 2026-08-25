import { beforeEach, describe, expect, it, vi } from 'vitest';

import cashSessionApi from '@api/cash-session.js';
import useCashSessionStore from '@stores/modules/cash-session.js';

vi.mock('@api/cash-session.js', () => ({
    default: {
        getCurrentSession: vi.fn(),
        openSession: vi.fn()
    }
}));

const openSession = {
    id: 17,
    openingCash: '500000.0000',
    openedAt: '2026-08-25T01:00:00Z',
    openedBy: 'admin',
    status: 'OPEN',
    version: 0
};

const deferred = () => {
    let resolve;
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
};

describe('cash session store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useCashSessionStore.setState({
            currentSession: null,
            currentStatus: 'idle',
            currentError: null,
            lastCheckedAt: null,
            isOpening: false,
            openingError: null
        });
    });

    it('treats the current endpoint 404 as a verified no-session state', async () => {
        cashSessionApi.getCurrentSession.mockRejectedValue(Object.assign(new Error(), {
            category: 'not_found',
            status: 404
        }));

        await expect(useCashSessionStore.getState().getCurrentSession()).resolves.toBeNull();

        expect(useCashSessionStore.getState()).toMatchObject({
            currentSession: null,
            currentStatus: 'ready',
            currentError: null,
            lastCheckedAt: expect.any(Number)
        });
    });

    it('exposes retryable current-session errors without claiming there is no session', async () => {
        const error = Object.assign(new Error('Gagal terhubung ke server.'), {
            category: 'network'
        });
        cashSessionApi.getCurrentSession.mockRejectedValue(error);

        await expect(useCashSessionStore.getState().getCurrentSession()).rejects.toBe(error);

        expect(useCashSessionStore.getState()).toMatchObject({
            currentStatus: 'error',
            currentError: error
        });
    });

    it('keeps a newer current-session response when an older request finishes later', async () => {
        const olderRequest = deferred();
        const newerSession = { ...openSession, id: 18, version: 1 };
        cashSessionApi.getCurrentSession
            .mockReturnValueOnce(olderRequest.promise)
            .mockResolvedValueOnce({ data: { data: newerSession } });

        const olderResult = useCashSessionStore.getState().getCurrentSession();
        await useCashSessionStore.getState().getCurrentSession();
        olderRequest.resolve({ data: { data: openSession } });
        await olderResult;

        expect(useCashSessionStore.getState()).toMatchObject({
            currentSession: newerSession,
            currentStatus: 'ready',
            currentError: null
        });
    });

    it('keeps an expired authentication response as an error instead of an empty drawer', async () => {
        const error = Object.assign(new Error('Sesi Anda telah berakhir.'), {
            category: 'authentication',
            status: 401
        });
        cashSessionApi.getCurrentSession.mockRejectedValue(error);

        await expect(useCashSessionStore.getState().getCurrentSession()).rejects.toBe(error);

        expect(useCashSessionStore.getState()).toMatchObject({
            currentSession: null,
            currentStatus: 'error',
            currentError: error
        });
    });

    it('stores the backend-created session and blocks a second in-flight opening call', async () => {
        const request = deferred();
        cashSessionApi.openSession.mockReturnValue(request.promise);
        const payload = { data: { openingCash: '500000.0000' } };

        const firstOpening = useCashSessionStore.getState().openSession(payload);
        const duplicateOpening = useCashSessionStore.getState().openSession(payload);

        expect(cashSessionApi.openSession).toHaveBeenCalledTimes(1);
        await expect(duplicateOpening).resolves.toBeNull();
        expect(useCashSessionStore.getState().isOpening).toBe(true);

        request.resolve({ data: { data: openSession } });
        await expect(firstOpening).resolves.toEqual(openSession);
        expect(useCashSessionStore.getState()).toMatchObject({
            currentSession: openSession,
            currentStatus: 'ready',
            isOpening: false
        });
    });
});
