import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import itemApi from '@api/item.js';

describe('item API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('forwards AbortSignal configuration for list and detail reads', async () => {
        const controller = new AbortController();

        await itemApi.getItemList({
            signal: controller.signal,
            params: { page: 1 }
        });
        await itemApi.getItemDetails('KAIN-00001', { signal: controller.signal });

        expect(apiRequest.mock.calls[0][0]).toMatchObject({
            method: 'GET',
            signal: controller.signal,
            params: { page: 1 }
        });
        expect(apiRequest.mock.calls[1][0]).toMatchObject({
            method: 'GET',
            signal: controller.signal
        });
    });

    it('keeps legacy loader options separate from request configuration', async () => {
        await itemApi.getItemDetails('KAIN-00001', { useLoader: true });

        expect(apiRequest).toHaveBeenCalledWith(
            expect.not.objectContaining({ useLoader: true }),
            { useLoader: true }
        );
    });
});
