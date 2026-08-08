import { beforeEach, describe, expect, it, vi } from 'vitest';

const categoryApi = vi.hoisted(() => ({
    createItemCategory: vi.fn(),
    deactivateItemCategory: vi.fn(),
    getItemCategoriesItemCount: vi.fn(),
    getItemCategoryDetails: vi.fn(),
    getItemCategoryList: vi.fn(),
    updateItemCategory: vi.fn()
}));

vi.mock('@api/item-category.js', () => ({ default: categoryApi }));

import useItemCategoryStore from '@stores/modules/item-category.js';

const deferred = () => {
    let resolve;
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
};

describe('item category store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useItemCategoryStore.setState({
            itemCategoriesItemCount: {},
            itemCategoryDetails: {},
            itemCategoryList: [],
            itemCategoryPaging: {}
        });
    });

    it('stores list content and paging returned by the backend', async () => {
        categoryApi.getItemCategoryList.mockResolvedValue({
            data: {
                data: {
                    content: [{ code: 'KAIN', name: 'Kain' }],
                    number: 0,
                    totalElements: 1,
                    totalPages: 1
                }
            }
        });

        await useItemCategoryStore.getState().getItemCategoryList({ params: { page: 1 } });

        expect(useItemCategoryStore.getState()).toMatchObject({
            itemCategoryList: [{ code: 'KAIN', name: 'Kain' }],
            itemCategoryPaging: {
                number: 0,
                totalElements: 1,
                totalPages: 1
            }
        });
    });

    it('keeps the previous list when a refresh fails', async () => {
        const error = Object.assign(new Error('Gagal terhubung ke server.'), {
            category: 'network'
        });
        useItemCategoryStore.setState({
            itemCategoryList: [{ code: 'KAIN', name: 'Kain' }]
        });
        categoryApi.getItemCategoryList.mockRejectedValue(error);

        await expect(
            useItemCategoryStore.getState().getItemCategoryList({ params: { page: 1 } })
        ).rejects.toBe(error);
        expect(useItemCategoryStore.getState().itemCategoryList).toEqual([
            { code: 'KAIN', name: 'Kain' }
        ]);
    });

    it('does not store a late list response after its request is aborted', async () => {
        const request = deferred();
        const controller = new AbortController();
        useItemCategoryStore.setState({
            itemCategoryList: [{ code: 'TERBARU', name: 'Terbaru' }]
        });
        categoryApi.getItemCategoryList.mockReturnValue(request.promise);

        const pending = useItemCategoryStore.getState().getItemCategoryList({
            signal: controller.signal,
            params: { page: 1 }
        });
        controller.abort();
        request.resolve({
            data: {
                data: {
                    content: [{ code: 'LAMA', name: 'Lama' }],
                    totalPages: 1
                }
            }
        });
        await pending;

        expect(useItemCategoryStore.getState().itemCategoryList).toEqual([
            { code: 'TERBARU', name: 'Terbaru' }
        ]);
    });

    it('passes mutation payloads through unchanged and stores the item count', async () => {
        const payload = { data: { name: 'Kain baru', description: 'Deskripsi' } };
        categoryApi.updateItemCategory.mockResolvedValue({ data: { data: payload.data } });
        categoryApi.getItemCategoriesItemCount.mockResolvedValue({
            data: { data: { code: 'KAIN', itemCount: 2 } }
        });

        await useItemCategoryStore.getState().updateItemCategory('KAIN', payload);
        await useItemCategoryStore.getState().getItemCategoriesItemCount('KAIN');

        expect(categoryApi.updateItemCategory).toHaveBeenCalledWith('KAIN', payload, undefined);
        expect(useItemCategoryStore.getState().itemCategoriesItemCount).toEqual({
            code: 'KAIN',
            itemCount: 2
        });
    });
});
