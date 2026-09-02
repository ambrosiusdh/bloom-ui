import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import saleApi from '@api/sale.js';

describe('sale API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('sends only supported sale history filters, paging, and cancellation config', async () => {
        const controller = new AbortController();
        const params = {
            page: 2,
            size: 25,
            code: 'SALE/IX',
            startDate: '2026-09-01T00:00:00.000Z',
            endDate: '2026-09-30T23:59:59.999Z'
        };

        await saleApi.getSaleList(params, { signal: controller.signal }, { useLoader: false });

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/sales',
            method: 'GET',
            signal: controller.signal,
            params
        }, { useLoader: false });
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

    it('creates a sale with the stable idempotency key in the required header', async () => {
        const data = {
            discountAmount: '0',
            paidAmount: '20000',
            description: '',
            paymentType: 'CASH',
            saleItemList: [{
                itemSku: 'KAIN-00001',
                quantity: '1.25',
                stockLocation: 'STORE'
            }]
        };

        await saleApi.createSale(data, 'sale-key-42');

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/sales',
            method: 'POST',
            timeout: 20000,
            data,
            headers: { 'Idempotency-Key': 'sale-key-42' }
        }, undefined);
    });

    it('looks up an ambiguous checkout outcome with that same header key', async () => {
        const controller = new AbortController();

        await saleApi.getCheckoutStatus(
            'sale-key-42',
            { signal: controller.signal },
            { useLoader: false }
        );

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/sales/checkout-status',
            method: 'GET',
            timeout: 20000,
            signal: controller.signal,
            headers: { 'Idempotency-Key': 'sale-key-42' }
        }, { useLoader: false });
    });
});
