import { expect, it, vi } from 'vitest';

const requestApi = vi.hoisted(() => vi.fn());
vi.mock('@api/index.js', () => ({ default: requestApi }));

import dashboardApi from '@api/dashboard.js';

it('reads the Release 1 operational dashboard without extra domain requests', async () => {
    const options = { useLoader: false };

    await dashboardApi.getOperationalOverview(options);

    expect(requestApi).toHaveBeenCalledTimes(1);
    expect(requestApi).toHaveBeenCalledWith({
        url: '/api/dashboard/operational-overview',
        method: 'GET'
    }, options);
});

it('keeps the legacy overview method available during migration', async () => {
    await dashboardApi.getDashboardOverview();

    expect(requestApi).toHaveBeenCalledWith({
        url: '/api/dashboard/overview',
        method: 'GET'
    }, undefined);
});
