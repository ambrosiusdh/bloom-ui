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

    it('reads the server-calculated outstanding balance by stable supplier code', async () => {
        const controller = new AbortController();

        await supplierApi.getSupplierOutstandingBalance(
            'SUP/001',
            { signal: controller.signal },
            { useLoader: false }
        );

        expect(apiRequest).toHaveBeenCalledWith({
            url: '/api/suppliers/SUP%2F001/outstanding-balance',
            method: 'GET',
            signal: controller.signal
        }, { useLoader: false });
    });

    it('uses the write contracts without exposing hard delete', async () => {
        await supplierApi.createSupplier({ data: { code: 'SUP-001', name: 'Bloom' } });
        await supplierApi.updateSupplier('SUP/001', { data: { name: 'Bloom Baru' } });
        await supplierApi.setSupplierActive('SUP/001', false);

        expect(apiRequest).toHaveBeenNthCalledWith(1, {
            url: '/api/suppliers',
            method: 'POST',
            data: { code: 'SUP-001', name: 'Bloom' }
        }, undefined);
        expect(apiRequest).toHaveBeenNthCalledWith(2, {
            url: '/api/suppliers/SUP%2F001',
            method: 'PUT',
            data: { name: 'Bloom Baru' }
        }, undefined);
        expect(apiRequest).toHaveBeenNthCalledWith(3, {
            url: '/api/suppliers/SUP%2F001/activation',
            method: 'PATCH',
            data: { active: false }
        }, undefined);
        expect(supplierApi.deleteSupplier).toBeUndefined();
    });
});
