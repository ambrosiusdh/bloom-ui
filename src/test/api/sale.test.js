import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import saleApi from '@api/sale.js';

describe('sale API receipt printing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('sends only the existing slash-containing sale reference to the backend print endpoint', async () => {
        await saleApi.printReceipt('SALE/VIII-2026/0001');

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/print',
            method: 'POST',
            data: {
                saleCode: 'SALE/VIII-2026/0001'
            }
        }, undefined);
    });

    it('forwards detail cancellation separately from loader options', async () => {
        const controller = new AbortController();

        await saleApi.getSaleDetails(
            'SALE/VIII-2026/0001',
            { signal: controller.signal },
            { useLoader: true }
        );

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/sales/details',
            method: 'GET',
            signal: controller.signal,
            params: {
                code: 'SALE/VIII-2026/0001'
            }
        }, { useLoader: true });
    });
});
