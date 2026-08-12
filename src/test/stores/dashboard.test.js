import { beforeEach, describe, expect, it, vi } from 'vitest';

import dashboardApi from '@api/dashboard.js';
import useDashboardStore from '@stores/modules/dashboard.js';

vi.mock('@api/dashboard.js', () => ({
    default: {
        getDashboardOverview: vi.fn()
    }
}));

const overview = {
    summary: [{ label: 'Total Pendapatan', summary: 'Rp. 0' }],
    revenueChart: { week: [], month: [] },
    recentTransactions: [],
    topCategories: [],
    lowStock: []
};

const newerOverview = {
    ...overview,
    summary: [{ label: 'Total Pendapatan', summary: 'Rp. 25.000' }]
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

describe('dashboard store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useDashboardStore.setState({
            dashboardData: null,
            lastSuccessfulAt: null,
            error: null,
            isLoading: false
        });
    });

    it('exposes loading and stores only the backend overview response', async () => {
        const request = deferred();
        dashboardApi.getDashboardOverview.mockReturnValue(request.promise);

        const resultPromise = useDashboardStore.getState().getDashboardOverview();

        expect(useDashboardStore.getState()).toMatchObject({
            dashboardData: null,
            error: null,
            isLoading: true
        });

        request.resolve({ data: { data: overview } });
        await expect(resultPromise).resolves.toEqual({ data: overview });
        expect(useDashboardStore.getState()).toMatchObject({
            dashboardData: overview,
            lastSuccessfulAt: expect.any(Number),
            error: null,
            isLoading: false
        });
    });

    it('preserves the last successful response when a refresh fails', async () => {
        const refreshError = Object.assign(new Error('Gagal terhubung ke server.'), {
            name: 'ApiError',
            category: 'network'
        });
        useDashboardStore.setState({
            dashboardData: overview,
            lastSuccessfulAt: 1234
        });
        dashboardApi.getDashboardOverview.mockRejectedValue(refreshError);

        await expect(
            useDashboardStore.getState().getDashboardOverview()
        ).rejects.toBe(refreshError);

        expect(useDashboardStore.getState()).toMatchObject({
            dashboardData: overview,
            lastSuccessfulAt: 1234,
            error: refreshError,
            isLoading: false
        });
    });

    it('does not let an older request overwrite a newer response', async () => {
        const olderRequest = deferred();
        const newerRequest = deferred();
        dashboardApi.getDashboardOverview
            .mockReturnValueOnce(olderRequest.promise)
            .mockReturnValueOnce(newerRequest.promise);

        const olderResult = useDashboardStore.getState().getDashboardOverview();
        const newerResult = useDashboardStore.getState().getDashboardOverview();

        newerRequest.resolve({ data: { data: newerOverview } });
        await expect(newerResult).resolves.toEqual({ data: newerOverview });
        const newestTimestamp = useDashboardStore.getState().lastSuccessfulAt;

        olderRequest.resolve({ data: { data: overview } });
        await expect(olderResult).resolves.toEqual({ data: overview });

        expect(useDashboardStore.getState()).toMatchObject({
            dashboardData: newerOverview,
            lastSuccessfulAt: newestTimestamp,
            error: null,
            isLoading: false
        });
    });

    it('does not let an older failure replace a newer successful state', async () => {
        const olderRequest = deferred();
        dashboardApi.getDashboardOverview
            .mockReturnValueOnce(olderRequest.promise)
            .mockResolvedValueOnce({ data: { data: newerOverview } });

        const olderResult = useDashboardStore.getState().getDashboardOverview();
        await useDashboardStore.getState().getDashboardOverview();
        olderRequest.reject(new Error('Permintaan lama gagal'));
        await expect(olderResult).rejects.toThrow('Permintaan lama gagal');

        expect(useDashboardStore.getState()).toMatchObject({
            dashboardData: newerOverview,
            lastSuccessfulAt: expect.any(Number),
            error: null,
            isLoading: false
        });
    });
});
