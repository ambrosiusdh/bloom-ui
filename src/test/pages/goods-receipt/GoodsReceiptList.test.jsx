import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import goodsReceiptApi from '@api/goods-receipt.js';
import GoodsReceiptList from '@pages/goods-receipt/GoodsReceiptList.jsx';
import useGoodsReceiptStore from '@stores/modules/goods-receipt.js';
import { act, render, screen, waitFor } from '@/test/render.jsx';

vi.mock('@api/goods-receipt.js', () => ({ default: {
    getGoodsReceiptList: vi.fn(), getGoodsReceiptDetails: vi.fn(), createGoodsReceipt: vi.fn()
} }));

const receipt = {
    code: 'GR/IX-2026/0025', supplierId: 7, supplierCode: 'SUP-007',
    supplierName: 'Bloom Textile', totalAmount: '12500.0000', paidAmount: '0.0000',
    outstandingAmount: '12500.0000', paymentStatus: 'UNPAID', status: 'POSTED',
    receivedDate: '2026-09-02T03:00:00Z', createdAt: '2026-09-02T03:05:00Z', createdBy: 'admin'
};
const response = (content = [], totalPages = content.length ? 1 : 0) => ({
    data: { data: { content, totalPages, totalElements: content.length } }
});
const deferred = () => {
    let resolve;
    const promise = new Promise(resolvePromise => { resolve = resolvePromise; });
    return { promise, resolve };
};

describe('GoodsReceiptList FE-25 read workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useGoodsReceiptStore.setState({
            goodsReceiptList: [], goodsReceiptPaging: {}, goodsReceiptListStatus: 'idle',
            goodsReceiptListError: null
        });
    });

    it('renders server receipt/payment truth and sends only supported filters and paging', async () => {
        goodsReceiptApi.getGoodsReceiptList.mockResolvedValue(response([receipt], 3));
        render(<GoodsReceiptList />, {
            route: '/goods-receipts?key=supplierName&q=Bloom&receivedDateFrom=2026-09-01&receivedDateTo=2026-09-03&page=2&size=5'
        });

        expect(await screen.findByText(receipt.code)).toBeInTheDocument();
        expect(screen.getByText('Bloom Textile')).toBeInTheDocument();
        expect(screen.getByText('ID #7 · SUP-007')).toBeInTheDocument();
        expect(screen.getByLabelText('Status penerimaan: Dibukukan')).toBeInTheDocument();
        expect(screen.getByLabelText('Status pembayaran: Belum dibayar')).toBeInTheDocument();
        expect(screen.getByText('Total: Rp 12.500')).toBeInTheDocument();
        expect(screen.getByText('Dibayar: Rp 0')).toBeInTheDocument();
        expect(screen.getByText('Sisa: Rp 12.500')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Detail' })).toHaveAttribute(
            'href', `/goods-receipts/${ encodeURIComponent(receipt.code) }`
        );
        expect(screen.queryByRole('link', { name: /buat penerimaan/i })).not.toBeInTheDocument();

        const [params, config, options] = goodsReceiptApi.getGoodsReceiptList.mock.calls[0];
        expect(params).toMatchObject({ page: 2, size: 5, supplierName: 'Bloom' });
        expect(params.receivedDateFrom).toEqual(expect.any(String));
        expect(params.receivedDateTo).toEqual(expect.any(String));
        expect(config.signal).toBeInstanceOf(AbortSignal);
        expect(options).toEqual({ useLoader: false });
        expect(goodsReceiptApi.getGoodsReceiptDetails).not.toHaveBeenCalled();
    });

    it('announces loading, retries an error with the same filter, then shows empty', async () => {
        const user = userEvent.setup();
        const request = deferred();
        goodsReceiptApi.getGoodsReceiptList.mockReturnValueOnce(request.promise);
        render(<GoodsReceiptList />, { route: '/goods-receipts?key=code&q=GR-404' });

        expect(screen.getByRole('status')).toHaveTextContent('Memuat penerimaan barang...');
        await act(async () => request.resolve(Promise.reject(new Error('Riwayat gagal dimuat.'))));
        expect(await screen.findByRole('alert')).toHaveTextContent('Riwayat gagal dimuat.');

        goodsReceiptApi.getGoodsReceiptList.mockResolvedValueOnce(response());
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByText('Tidak ada penerimaan barang')).toBeInTheDocument();
        await waitFor(() => expect(goodsReceiptApi.getGoodsReceiptList).toHaveBeenCalledTimes(2));
        expect(goodsReceiptApi.getGoodsReceiptList.mock.calls[1][0]).toMatchObject({ code: 'GR-404' });
    });
});
