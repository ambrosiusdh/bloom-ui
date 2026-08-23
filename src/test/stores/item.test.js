import { beforeEach, describe, expect, it, vi } from 'vitest';

const itemApi = vi.hoisted(() => ({
    createItem: vi.fn(),
    deactivateItem: vi.fn(),
    getItemAuditLog: vi.fn(),
    getItemDetails: vi.fn(),
    getItemList: vi.fn(),
    updateItem: vi.fn()
}));

vi.mock('@api/item.js', () => ({ default: itemApi }));

import useItemStore from '@stores/modules/item.js';

const deferred = () => {
    let resolve;
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
};

describe('item store read actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useItemStore.setState({
            itemDetails: {},
            itemList: [],
            itemPaging: {}
        });
    });

    it('stores the backend item inventory response without deriving aggregate stock', async () => {
        const item = {
            sku: 'KAIN-00001',
            stockStore: '1.2500',
            stockWarehouse: '0.0001',
            baseUnitOfMeasure: 'METER',
            fractionalQuantityAllowed: true,
            active: true,
            baseUnitOfMeasureLocked: true,
            fractionalQuantityAllowedLocked: true
        };
        itemApi.getItemList.mockResolvedValue({
            data: {
                data: {
                    content: [item],
                    totalPages: 1
                }
            }
        });

        await useItemStore.getState().getItemList({ params: { page: 1 } });

        expect(useItemStore.getState().itemList).toEqual([item]);
        expect(useItemStore.getState().itemList[0]).not.toHaveProperty('stockQuantity');
    });

    it('does not store a late detail response after the request is aborted', async () => {
        const request = deferred();
        const controller = new AbortController();
        useItemStore.setState({ itemDetails: { sku: 'TERBARU' } });
        itemApi.getItemDetails.mockReturnValue(request.promise);

        const pending = useItemStore.getState().getItemDetails('LAMA', {
            signal: controller.signal
        });
        controller.abort();
        request.resolve({ data: { data: { sku: 'LAMA' } } });
        await pending;

        expect(useItemStore.getState().itemDetails).toEqual({ sku: 'TERBARU' });
    });

    it('stores the backend-confirmed item after an update', async () => {
        const updatedItem = {
            sku: 'KAIN-00002',
            name: 'Kain terbaru',
            baseUnitOfMeasureLocked: true,
            fractionalQuantityAllowedLocked: true
        };
        itemApi.updateItem.mockResolvedValue({ data: { data: updatedItem } });

        const response = await useItemStore.getState().updateItem('KAIN-00001', {
            data: { name: 'Kain terbaru' }
        });

        expect(response.data).toEqual(updatedItem);
        expect(useItemStore.getState().itemDetails).toEqual(updatedItem);
    });
});
