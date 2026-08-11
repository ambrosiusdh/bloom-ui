import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import saleApi from '@api/sale.js';

describe('sale API receipt printing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('sends only the existing sale reference to the backend print endpoint', async () => {
        await saleApi.printReceipt('SALE-2026-001');

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/print',
            method: 'POST',
            data: {
                saleCode: 'SALE-2026-001'
            }
        }, undefined);
    });
});
