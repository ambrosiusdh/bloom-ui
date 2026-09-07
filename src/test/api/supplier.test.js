import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import supplierApi from '@api/supplier.js';

describe('supplier API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('reads suppliers with only the supplied supported filters and paging', async () => {
        const controller = new AbortController();

        await supplierApi.getSupplierList({
            signal: controller.signal,
            params: { page: 2, size: 25, query: 'tekstil', active: false }
        });

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/suppliers',
            method: 'GET',
            signal: controller.signal,
            params: { page: 2, size: 25, query: 'tekstil', active: false }
        }, undefined);
    });

    it('uses and safely encodes the stable supplier code for detail reads', async () => {
        const controller = new AbortController();

        await supplierApi.getSupplierDetails('SUP/001', { signal: controller.signal });

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/suppliers/SUP%2F001',
            method: 'GET',
            signal: controller.signal
        }, undefined);
    });
});
