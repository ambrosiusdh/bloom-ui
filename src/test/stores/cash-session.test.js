import { beforeEach, describe, expect, it, vi } from 'vitest';

import cashSessionApi from '@api/cash-session.js';
import useCashSessionStore from '@stores/modules/cash-session.js';

vi.mock('@api/cash-session.js', () => ({
    default: {
        getCurrentSession: vi.fn(),
        openSession: vi.fn(),
        getSessionDetails: vi.fn(),
        closeSession: vi.fn()
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
    let reject;
    let resolve;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        reject = rejectPromise;
        resolve = resolvePromise;
    });
    return { promise, reject, resolve };
};

describe('cash session store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useCashSessionStore.setState({
            currentSession: null,
            currentStatus: 'idle',
            currentError: null,
            lastCheckedAt: null,
            drawerActionsEnabled: false,
            isOpening: false,
            openingError: null,
            isClosing: false,
            closingError: null
        });
    });

    it('treats a successful null response as a verified no-session state', async () => {
        cashSessionApi.getCurrentSession.mockResolvedValue({ data: { data: null } });

        await expect(useCashSessionStore.getState().getCurrentSession()).resolves.toBeNull();

        expect(useCashSessionStore.getState()).toMatchObject({
            currentSession: null,
            currentStatus: 'ready',
            currentError: null,
            lastCheckedAt: expect.any(Number)
        });
    });

    it('keeps a current-session 404 as an API error instead of an empty drawer', async () => {
        const error = Object.assign(new Error('Data yang diminta tidak ditemukan.'), {
            category: 'not_found',
            status: 404
        });
        cashSessionApi.getCurrentSession.mockRejectedValue(error);

        await expect(useCashSessionStore.getState().getCurrentSession()).rejects.toBe(error);

        expect(useCashSessionStore.getState()).toMatchObject({
            currentSession: null,
            currentStatus: 'error',
            currentError: error,
            drawerActionsEnabled: false
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
            drawerActionsEnabled: true,
            isOpening: false
        });
    });

    it('stores the backend close result, locks drawer actions, and blocks duplicate close calls', async () => {
        const request = deferred();
        const closedSession = {
            ...openSession,
            expectedClosingCash: '530000.0000',
            actualClosingCash: '525000.0000',
            difference: '-5000.0000',
            status: 'CLOSED'
        };
        useCashSessionStore.setState({
            currentSession: openSession,
            currentStatus: 'ready',
            drawerActionsEnabled: true
        });
        cashSessionApi.closeSession.mockReturnValue(request.promise);
        const payload = { data: { actualClosingCash: '525000.0000' } };

        const firstClose = useCashSessionStore.getState().closeSession(17, payload);
        const duplicateClose = useCashSessionStore.getState().closeSession(17, payload);

        expect(cashSessionApi.closeSession).toHaveBeenCalledTimes(1);
        await expect(duplicateClose).resolves.toBeNull();
        expect(useCashSessionStore.getState()).toMatchObject({
            isClosing: true,
            drawerActionsEnabled: false
        });

        request.resolve({ data: { data: closedSession } });
        await expect(firstClose).resolves.toEqual(closedSession);
        expect(useCashSessionStore.getState()).toMatchObject({
            currentSession: closedSession,
            currentStatus: 'ready',
            drawerActionsEnabled: false,
            isClosing: false
        });
    });

    it('keeps drawer actions locked after a close conflict and can load the final server result', async () => {
        const conflict = Object.assign(new Error('Data telah berubah.'), {
            category: 'conflict',
            status: 409
        });
        const closedSession = {
            ...openSession,
            actualClosingCash: '505000.0000',
            difference: '5000.0000',
            status: 'CLOSED'
        };
        useCashSessionStore.setState({
            currentSession: openSession,
            currentStatus: 'ready',
            drawerActionsEnabled: true
        });
        cashSessionApi.closeSession.mockRejectedValue(conflict);
        cashSessionApi.getSessionDetails.mockResolvedValue({ data: { data: closedSession } });

        await expect(useCashSessionStore.getState().closeSession(17, {
            data: { actualClosingCash: '500000.0000' }
        })).rejects.toBe(conflict);
        expect(useCashSessionStore.getState().drawerActionsEnabled).toBe(false);

        await expect(useCashSessionStore.getState().getSessionDetails(17))
            .resolves.toEqual(closedSession);
        expect(useCashSessionStore.getState()).toMatchObject({
            currentSession: closedSession,
            currentStatus: 'ready',
            drawerActionsEnabled: false
        });
    });
});
