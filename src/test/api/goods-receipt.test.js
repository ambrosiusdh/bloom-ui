import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import goodsReceiptApi from '@api/goods-receipt.js';

describe('goods receipt read API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('posts receipt intent with the supplied stable idempotency key', async () => {
        const payload = { supplierCode: 'SUP-7', receivedDate: '2026-09-09T02:00:00Z',
            items: [{ itemSku: 'KAIN-1', quantity: '0.5000', purchasePrice: '10000.125', stockLocation: 'STORE' }] };
        await goodsReceiptApi.createGoodsReceipt(payload, 'receipt-replay', { useLoader: false });
        expect(apiRequest).toHaveBeenCalledWith({ url: '/api/goods-receipts', method: 'POST',
            data: payload, headers: { 'Idempotency-Key': 'receipt-replay' } }, { useLoader: false });
    });

    it('forwards only the supplied list filters, paging, and cancellation signal', async () => {
        const controller = new AbortController();
        const params = {
            page: 2,
            size: 25,
            supplierName: 'Tekstil',
            receivedDateFrom: '2026-09-01',
            receivedDateTo: '2026-09-30'
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
