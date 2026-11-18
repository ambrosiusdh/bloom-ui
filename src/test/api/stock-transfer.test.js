import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import stockTransferApi from '@api/stock-transfer.js';

describe('stock transfer API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('posts the exact atomic transfer request with its idempotency key', async () => {
        const payload = {
            data: {
                sourceLocation: 'WAREHOUSE',
                destinationLocation: 'STORE',
                description: 'Isi rak toko',
                lines: [{
                    itemSku: 'KAIN-00001',
                    quantity: '1.2500',
                    unitOfMeasure: 'METER'
                }]
            }
        };

        await stockTransferApi.createStockTransfer(payload, 'transfer-key-42');

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/stock-transfers',
            method: 'POST',
            timeout: 15000,
            ...payload,
            headers: { 'Idempotency-Key': 'transfer-key-42' }
        }, undefined);
        expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    it('reads persisted history with paging and detail through slash-safe query parameters', async () => {
        const signal = new AbortController().signal;

        await stockTransferApi.getStockTransfers({
            page: 2,
            size: 10,
            code: 'TRF/2026'
        }, { signal });
        expect(apiRequest).toHaveBeenLastCalledWith({
            url: '/api/stock-transfers',
            method: 'GET',
            signal,
            params: {
                page: 2,
                size: 10,
                code: 'TRF/2026'
            }
        }, undefined);

        await stockTransferApi.getStockTransferDetails('TRF/2026/1', { signal });
        expect(apiRequest).toHaveBeenLastCalledWith({
            url: '/api/stock-transfers/details',
            method: 'GET',
            signal,
            params: { code: 'TRF/2026/1' }
        }, undefined);
    });
});
