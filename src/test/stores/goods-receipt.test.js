import { beforeEach, describe, expect, it, vi } from 'vitest';

import goodsReceiptApi from '@api/goods-receipt.js';
import useGoodsReceiptStore from '@stores/modules/goods-receipt.js';

vi.mock('@api/goods-receipt.js', () => ({ default: {
    getGoodsReceiptList: vi.fn(),
    getGoodsReceiptDetails: vi.fn(),
    createGoodsReceipt: vi.fn()
} }));

const deferred = () => {
    let resolve;
    const promise = new Promise(resolvePromise => { resolve = resolvePromise; });
    return { promise, resolve };
};

const page = content => ({ data: { data: { content, totalPages: 1, totalElements: content.length } } });

describe('goods receipt read store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useGoodsReceiptStore.setState({
            goodsReceiptList: [], goodsReceiptPaging: {}, goodsReceiptDetails: null,
            goodsReceiptListStatus: 'idle', goodsReceiptListError: null,
            goodsReceiptDetailStatus: 'idle', goodsReceiptDetailError: null
        });
    });

    it('stores the backend page unchanged without enrichment or financial calculation', async () => {
        const receipt = {
            code: 'GR-25', supplierId: 7, supplierName: 'Bloom Textile',
            totalAmount: '10000.0000', paidAmount: '0.0000',
            outstandingAmount: '10000.0000', paymentStatus: 'UNPAID'
        };
        goodsReceiptApi.getGoodsReceiptList.mockResolvedValue(page([receipt]));

        await useGoodsReceiptStore.getState().getGoodsReceiptList({ page: 1, size: 10 });

        expect(useGoodsReceiptStore.getState()).toMatchObject({
            goodsReceiptList: [receipt],
            goodsReceiptPaging: { totalPages: 1, totalElements: 1 },
            goodsReceiptListStatus: 'ready'
        });
        expect(goodsReceiptApi.getGoodsReceiptList).toHaveBeenCalledTimes(1);
        expect(goodsReceiptApi.getGoodsReceiptDetails).not.toHaveBeenCalled();
    });

    it('ignores older list and detail responses that finish after newer requests', async () => {
        const oldList = deferred();
        const oldDetail = deferred();
        goodsReceiptApi.getGoodsReceiptList
            .mockReturnValueOnce(oldList.promise)
            .mockResolvedValueOnce(page([{ code: 'GR-NEW' }]));
        goodsReceiptApi.getGoodsReceiptDetails
            .mockReturnValueOnce(oldDetail.promise)
            .mockResolvedValueOnce({ data: { data: { code: 'GR-NEW' } } });

        const firstList = useGoodsReceiptStore.getState().getGoodsReceiptList({ code: 'OLD' });
        await useGoodsReceiptStore.getState().getGoodsReceiptList({ code: 'NEW' });
        oldList.resolve(page([{ code: 'GR-OLD' }]));
        await firstList;

        const firstDetail = useGoodsReceiptStore.getState().getGoodsReceiptDetails('GR-OLD');
        await useGoodsReceiptStore.getState().getGoodsReceiptDetails('GR-NEW');
        oldDetail.resolve({ data: { data: { code: 'GR-OLD' } } });
        await firstDetail;

        expect(useGoodsReceiptStore.getState()).toMatchObject({
            goodsReceiptList: [{ code: 'GR-NEW' }],
            goodsReceiptDetails: { code: 'GR-NEW' }
        });
    });
});
