import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import stockAdjustmentApi from '@api/stock-adjustment.js';

describe('stock adjustment API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('forwards supported list filters, paging, and cancellation', async () => {
        const controller = new AbortController();
        const params = {
            page: 2,
            size: 25,
            stockAdjustmentCode: 'ADJ/IX-2026'
        };

        await stockAdjustmentApi.getStockAdjustmentList(
            params,
            { signal: controller.signal },
            { useLoader: false }
        );

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/stock-adjustments',
            method: 'GET',
            signal: controller.signal,
            params
        }, { useLoader: false });
    });

    it('reads detail using the exact adjustment reference', async () => {
        const controller = new AbortController();

        await stockAdjustmentApi.getStockAdjustmentDetails(
            'ADJ/IX-2026/0001',
            { signal: controller.signal },
            { useLoader: false }
        );

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/stock-adjustments/details',
            method: 'GET',
            signal: controller.signal,
            params: { code: 'ADJ/IX-2026/0001' }
        }, { useLoader: false });
    });

    it('posts one exact adjustment without inventing an idempotency key', async () => {
        const payload = {
            reason: 'Hitung fisik',
            items: [{
                itemSku: 'KAIN-1',
                changeQuantity: '1.2500',
                actionType: 'ADD',
                stockLocation: 'STORE'
            }]
        };

        await stockAdjustmentApi.createStockAdjustment(payload, { useLoader: false });

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/stock-adjustments',
            method: 'POST',
            data: payload
        }, { useLoader: false });
    });
});
