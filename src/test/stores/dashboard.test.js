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

const deferred = () => {
    let resolve;
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
};

describe('dashboard store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useDashboardStore.setState({
            dashboardData: null,
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
            error: null,
            isLoading: false
        });
    });

    it('preserves the last successful response when a refresh fails', async () => {
        const refreshError = Object.assign(new Error('Gagal terhubung ke server.'), {
            category: 'network'
        });
        useDashboardStore.setState({ dashboardData: overview });
        dashboardApi.getDashboardOverview.mockRejectedValue(refreshError);

        await expect(
            useDashboardStore.getState().getDashboardOverview()
        ).rejects.toBe(refreshError);

        expect(useDashboardStore.getState()).toMatchObject({
            dashboardData: overview,
            error: refreshError,
            isLoading: false
        });
    });
});
