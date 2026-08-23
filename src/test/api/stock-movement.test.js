import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import stockMovementApi from '@api/stock-movement.js';

describe('stock movement API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('reads the movement ledger with the supplied paging, filter, and abort configuration', async () => {
        const controller = new AbortController();

        await stockMovementApi.getStockMovementList({
            signal: controller.signal,
            params: {
                page: 2,
                size: 25,
                itemSku: 'KAIN-00001',
                movementType: 'IN',
                location: 'STORE'
            }
        });

        expect(apiRequest).toHaveBeenCalledWith(expect.objectContaining({
            url: '/api/stock-movements',
            method: 'GET',
            signal: controller.signal,
            params: {
                page: 2,
                size: 25,
                itemSku: 'KAIN-00001',
                movementType: 'IN',
                location: 'STORE'
            }
        }), undefined);
    });
});
