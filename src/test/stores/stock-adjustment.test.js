import { beforeEach, describe, expect, it, vi } from 'vitest';

const stockAdjustmentApi = vi.hoisted(() => ({
    createStockAdjustment: vi.fn(),
    getStockAdjustmentDetails: vi.fn(),
    getStockAdjustmentList: vi.fn()
}));

vi.mock('@api/stock-adjustment.js', () => ({ default: stockAdjustmentApi }));

import useStockAdjustmentStore from '@stores/modules/stock-adjustment.js';

const deferred = () => {
    let reject;
    let resolve;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        reject = rejectPromise;
        resolve = resolvePromise;
    });

    return { promise, reject, resolve };
};

const payload = {
    reason: 'Hitung fisik',
    items: [{
        itemSku: 'ITEM-1',
        stockLocation: 'STORE',
        actionType: 'ADD',
        changeQuantity: '1.0000'
    }]
};
const result = {
    adjustment: {
        stockAdjustmentCode: 'ADJ-1',
        items: [{
            item: { sku: 'ITEM-1' },
            stockLocation: 'STORE',
            actionType: 'ADD',
            changeQuantity: '1.0000',
            previousStock: '2.0000',
            newStock: '3.0000'
        }]
    },
    movements: [{
        id: 7,
        item: { sku: 'ITEM-1' },
        referenceNo: 'ADJ-1',
        location: 'STORE',
        quantity: '1.0000',
        qtyBefore: '2.0000',
        qtyAfter: '3.0000'
    }]
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
        sessionStorage.clear();
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
        expect(useStockAdjustmentStore.getState().stockAdjustmentAttempt).toBeNull();
    });

    it('durably quarantines an ambiguous request and blocks every later create', async () => {
        const networkError = Object.assign(new Error('Connection lost'), {
            category: 'network'
        });
        stockAdjustmentApi.createStockAdjustment.mockRejectedValue(networkError);

        await expect(useStockAdjustmentStore.getState().createStockAdjustment(payload))
            .rejects.toBe(networkError);

        const state = useStockAdjustmentStore.getState();
        expect(state.stockAdjustmentCreateStatus).toBe('ambiguous');
        expect(state.stockAdjustmentAttempt).toEqual({ payload });
        expect(JSON.parse(sessionStorage.getItem('bloom-stock-adjustment-v1')).state)
            .toEqual({
                stockAdjustmentCreateStatus: 'ambiguous',
                stockAdjustmentAttempt: { payload }
            });

        expect(await state.createStockAdjustment(payload)).toBeNull();
        expect(stockAdjustmentApi.createStockAdjustment).toHaveBeenCalledTimes(1);

        const durable = sessionStorage.getItem('bloom-stock-adjustment-v1');
        useStockAdjustmentStore.setState(useStockAdjustmentStore.getInitialState());
        sessionStorage.setItem('bloom-stock-adjustment-v1', durable);
        await useStockAdjustmentStore.persist.rehydrate();

        expect(useStockAdjustmentStore.getState().stockAdjustmentCreateStatus).toBe('ambiguous');
        expect(await useStockAdjustmentStore.getState().createStockAdjustment(payload)).toBeNull();
        expect(stockAdjustmentApi.createStockAdjustment).toHaveBeenCalledTimes(1);
    });

    it.each([
        null,
        {},
        { adjustment: { stockAdjustmentCode: 'ADJ-1', items: [] }, movements: [] },
        {
            adjustment: {
                stockAdjustmentCode: 'ADJ-1',
                items: result.adjustment.items
            },
            movements: []
        }
    ])('treats malformed HTTP success as ambiguous: %j', async malformed => {
        stockAdjustmentApi.createStockAdjustment.mockResolvedValue({
            data: { data: malformed }
        });

        await expect(useStockAdjustmentStore.getState().createStockAdjustment(payload))
            .rejects.toThrow('Incomplete stock adjustment response');

        expect(useStockAdjustmentStore.getState().stockAdjustmentCreateStatus).toBe('ambiguous');
        expect(useStockAdjustmentStore.getState().stockAdjustmentAttempt).toEqual({ payload });
    });

    it('unlocks only after a definitive rejection or explicit reconciliation', async () => {
        const conflict = Object.assign(new Error('Conflict'), {
            category: 'conflict',
            status: 409
        });
        stockAdjustmentApi.createStockAdjustment.mockRejectedValueOnce(conflict);

        await expect(useStockAdjustmentStore.getState().createStockAdjustment(payload))
            .rejects.toBe(conflict);
        expect(useStockAdjustmentStore.getState().stockAdjustmentCreateStatus).toBe('error');
        expect(useStockAdjustmentStore.getState().stockAdjustmentAttempt).toBeNull();

        const networkError = Object.assign(new Error('Connection lost'), {
            category: 'network'
        });
        stockAdjustmentApi.createStockAdjustment.mockRejectedValueOnce(networkError);
        await expect(useStockAdjustmentStore.getState().createStockAdjustment(payload))
            .rejects.toBe(networkError);

        useStockAdjustmentStore.getState().acknowledgeAmbiguousStockAdjustment();

        expect(useStockAdjustmentStore.getState().stockAdjustmentCreateStatus).toBe('idle');
        expect(useStockAdjustmentStore.getState().stockAdjustmentAttempt).toBeNull();
    });
});
