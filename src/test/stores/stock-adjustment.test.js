import { beforeEach, describe, expect, it, vi } from 'vitest';

const stockAdjustmentApi = vi.hoisted(() => ({
    createStockAdjustment: vi.fn(),
    getStockAdjustmentDetails: vi.fn(),
    getStockAdjustmentList: vi.fn()
}));

vi.mock('@api/stock-adjustment.js', () => ({ default: stockAdjustmentApi }));

import useStockAdjustmentStore from '@stores/modules/stock-adjustment.js';

const deferred = () => {
    let resolve;
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise;
    });

    return { promise, resolve };
};

const listResponse = (content, totalPages = 1) => ({
    data: {
        data: {
            content,
            totalPages,
            totalElements: content.length
        }
    }
});

describe('stock adjustment store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useStockAdjustmentStore.setState(useStockAdjustmentStore.getInitialState());
    });

    it('stores backend list facts and ignores a superseded response', async () => {
        const oldRequest = deferred();
        const currentAdjustment = {
            stockAdjustmentCode: 'ADJ-CURRENT',
            reason: 'Terbaru'
        };
        stockAdjustmentApi.getStockAdjustmentList
            .mockReturnValueOnce(oldRequest.promise)
            .mockResolvedValueOnce(listResponse([currentAdjustment], 4));

        const oldPending = useStockAdjustmentStore.getState().getStockAdjustmentList({ page: 1 });
        await useStockAdjustmentStore.getState().getStockAdjustmentList({ page: 2 });
        oldRequest.resolve(listResponse([{ stockAdjustmentCode: 'ADJ-STALE' }]));
        await oldPending;

        expect(useStockAdjustmentStore.getState().stockAdjustmentList).toEqual([currentAdjustment]);
        expect(useStockAdjustmentStore.getState().stockAdjustmentPaging.totalPages).toBe(4);
        expect(useStockAdjustmentStore.getState().stockAdjustmentListStatus).toBe('ready');
    });

    it('does not store a detail response after its request is aborted', async () => {
        const request = deferred();
        const controller = new AbortController();
        stockAdjustmentApi.getStockAdjustmentDetails.mockReturnValue(request.promise);

        const pending = useStockAdjustmentStore.getState().getStockAdjustmentDetails(
            'ADJ-OLD',
            { signal: controller.signal }
        );
        controller.abort();
        request.resolve({ data: { data: { stockAdjustmentCode: 'ADJ-OLD' } } });
        await pending;

        expect(useStockAdjustmentStore.getState().stockAdjustmentDetails).toBeNull();
        expect(useStockAdjustmentStore.getState().stockAdjustmentDetailStatus).toBe('loading');
    });

    it('blocks duplicate creates and keeps the complete backend result', async () => {
        const request = deferred();
        const payload = {
            reason: 'Hitung fisik',
            items: []
        };
        const result = {
            adjustment: { stockAdjustmentCode: 'ADJ-1' },
            movements: [{ id: 7 }]
        };
        stockAdjustmentApi.createStockAdjustment.mockReturnValue(request.promise);

        const pending = useStockAdjustmentStore.getState().createStockAdjustment(payload);
        const duplicate = await useStockAdjustmentStore.getState().createStockAdjustment(payload);

        expect(duplicate).toBeNull();
        expect(stockAdjustmentApi.createStockAdjustment).toHaveBeenCalledTimes(1);
        expect(useStockAdjustmentStore.getState().stockAdjustmentCreateStatus).toBe('pending');

        request.resolve({ data: { data: result } });
        await pending;

        expect(useStockAdjustmentStore.getState().stockAdjustmentCreateStatus).toBe('success');
        expect(useStockAdjustmentStore.getState().lastCreatedStockAdjustment).toEqual(result);
    });
});
