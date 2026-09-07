import { beforeEach, describe, expect, it, vi } from 'vitest';

import supplierApi from '@api/supplier.js';
import useSupplierStore from '@stores/modules/supplier.js';

vi.mock('@api/supplier.js', () => ({
    default: {
        getSupplierList: vi.fn(),
        getSupplierDetails: vi.fn()
    }
}));

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
};

const supplier = (code, name = code) => ({
    code,
    name,
    contactNumber: null,
    address: null,
    active: true
});

const listResponse = (content, extra = {}) => ({
    data: {
        data: {
            content,
            totalPages: content.length ? 1 : 0,
            ...extra
        }
    }
});

describe('supplier store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSupplierStore.setState({
            supplierList: [],
            supplierPaging: {},
            listStatus: 'idle',
            listError: null,
            supplierDetails: null,
            detailStatus: 'idle',
            detailError: null
        });
    });

    it('stores the backend page without aggregating or enriching supplier rows', async () => {
        const content = [supplier('SUP-001', 'Nusantara Tekstil')];
        supplierApi.getSupplierList.mockResolvedValue(listResponse(content, { number: 0, totalElements: 1 }));

        await useSupplierStore.getState().getSupplierList({ params: { page: 1, size: 10, active: true } });

        expect(useSupplierStore.getState()).toMatchObject({
            supplierList: content,
            supplierPaging: { totalPages: 1, number: 0, totalElements: 1 },
            listStatus: 'ready',
            listError: null
        });
        expect(supplierApi.getSupplierList).toHaveBeenCalledTimes(1);
    });

    it('keeps the newer list when an older search finishes later', async () => {
        const older = deferred();
        const newer = deferred();
        supplierApi.getSupplierList
            .mockReturnValueOnce(older.promise)
            .mockReturnValueOnce(newer.promise);

        const olderResult = useSupplierStore.getState().getSupplierList({ params: { query: 'lama' } });
        const newerResult = useSupplierStore.getState().getSupplierList({ params: { query: 'baru' } });
        newer.resolve(listResponse([supplier('SUP-NEW')]));
        await newerResult;
        older.resolve(listResponse([supplier('SUP-OLD')]));
        await olderResult;

        expect(useSupplierStore.getState().supplierList).toEqual([supplier('SUP-NEW')]);
    });

    it('keeps the newer detail when an older detail request finishes later', async () => {
        const older = deferred();
        supplierApi.getSupplierDetails
            .mockReturnValueOnce(older.promise)
            .mockResolvedValueOnce({ data: { data: supplier('SUP-NEW') } });

        const olderResult = useSupplierStore.getState().getSupplierDetails('SUP-OLD');
        await useSupplierStore.getState().getSupplierDetails('SUP-NEW');
        older.resolve({ data: { data: supplier('SUP-OLD') } });
        await olderResult;

        expect(useSupplierStore.getState()).toMatchObject({
            supplierDetails: supplier('SUP-NEW'),
            detailStatus: 'ready',
            detailError: null
        });
    });
});
