import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import goodsReceiptApi from '@api/goods-receipt.js';

describe('goods receipt read API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('forwards only the supplied list filters, paging, and cancellation signal', async () => {
        const controller = new AbortController();
        const params = {
            page: 2,
            size: 25,
            supplierName: 'Tekstil',
            receivedDateFrom: '2026-09-01T00:00:00.000Z',
            receivedDateTo: '2026-09-30T23:59:59.999Z'
        };

        await goodsReceiptApi.getGoodsReceiptList(
            params,
            { signal: controller.signal },
            { useLoader: false }
        );

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/goods-receipts',
            method: 'GET',
            signal: controller.signal,
            params
        }, { useLoader: false });
    });

    it('reads detail with the exact receipt reference', async () => {
        const controller = new AbortController();

        await goodsReceiptApi.getGoodsReceiptDetails(
            'GR/IX-2026/0025',
            { signal: controller.signal },
            { useLoader: false }
        );

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/goods-receipts/details',
            method: 'GET',
            signal: controller.signal,
            params: { code: 'GR/IX-2026/0025' }
        }, { useLoader: false });
    });
});
