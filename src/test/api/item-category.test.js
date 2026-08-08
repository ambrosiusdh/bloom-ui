import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.hoisted(() => vi.fn());

vi.mock('@api/index.js', () => ({ default: apiRequest }));

import itemCategoryApi from '@api/item-category.js';

describe('item category API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiRequest.mockResolvedValue({});
    });

    it('forwards AbortSignal request configuration for list, detail, and item count reads', async () => {
        const controller = new AbortController();

        await itemCategoryApi.getItemCategoryList({
            signal: controller.signal,
            params: { page: 2 }
        });
        await itemCategoryApi.getItemCategoryDetails('KAIN', { signal: controller.signal });
        await itemCategoryApi.getItemCategoriesItemCount('KAIN', { signal: controller.signal });

        expect(apiRequest.mock.calls[0][0]).toMatchObject({
            method: 'GET',
            signal: controller.signal,
            params: { page: 2 }
        });
        expect(apiRequest.mock.calls[1][0]).toMatchObject({
            method: 'GET',
            signal: controller.signal
        });
        expect(apiRequest.mock.calls[2][0]).toMatchObject({
            method: 'GET',
            signal: controller.signal
        });
    });
});
