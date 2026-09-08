import { useLocation } from 'react-router-dom';
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
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, reject, resolve };
};
const LocationProbe = () => <output aria-label="Lokasi saat ini">{ useLocation().search }</output>;

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
        expect(params.receivedDateFrom).toBe(
            new Date('2026-09-01T00:00:00.000').toISOString()
        );
        expect(params.receivedDateTo).toBe(
            new Date('2026-09-03T23:59:59.999').toISOString()
        );
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
        await act(async () => request.reject(new Error('Riwayat gagal dimuat.')));
        expect(await screen.findByRole('alert')).toHaveTextContent('Riwayat gagal dimuat.');

        goodsReceiptApi.getGoodsReceiptList.mockResolvedValueOnce(response());
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByText('Tidak ada penerimaan barang')).toBeInTheDocument();
        await waitFor(() => expect(goodsReceiptApi.getGoodsReceiptList).toHaveBeenCalledTimes(2));
        expect(goodsReceiptApi.getGoodsReceiptList.mock.calls[1][0]).toMatchObject({ code: 'GR-404' });
    });

    it('canonicalizes invalid URL input before fetching and clears draft-only filters', async () => {
        const user = userEvent.setup();
        goodsReceiptApi.getGoodsReceiptList.mockResolvedValue(response());
        render(<><LocationProbe /><GoodsReceiptList /></>, {
            route: '/goods-receipts?page=abc&size=900&key=unknown&receivedDateFrom=2026-02-31&receivedDateTo=bad'
        });

        expect(await screen.findByLabelText('Lokasi saat ini'))
            .toHaveTextContent('?page=1&size=10&key=code');
        expect(goodsReceiptApi.getGoodsReceiptList).toHaveBeenCalledTimes(1);
        expect(goodsReceiptApi.getGoodsReceiptList.mock.calls[0][0]).toEqual({ page: 1, size: 10 });

        const query = screen.getByRole('textbox', { name: 'Nomor penerimaan' });
        await user.type(query, 'Bloom');
        const clearButton = screen.getByRole('button', { name: 'Hapus filter' });
        expect(clearButton).toBeEnabled();
        await user.click(clearButton);
        expect(query).toHaveValue('');
    });

    it('moves an out-of-range page to the last server page instead of showing a false empty state', async () => {
        goodsReceiptApi.getGoodsReceiptList
            .mockResolvedValueOnce(response([], 3))
            .mockResolvedValueOnce(response([receipt], 3));
        render(<GoodsReceiptList />, { route: '/goods-receipts?page=8' });

        expect(await screen.findByText(receipt.code)).toBeInTheDocument();
        expect(goodsReceiptApi.getGoodsReceiptList).toHaveBeenCalledTimes(2);
        expect(goodsReceiptApi.getGoodsReceiptList.mock.calls[0][0]).toMatchObject({ page: 8 });
        expect(goodsReceiptApi.getGoodsReceiptList.mock.calls[1][0]).toMatchObject({ page: 3 });
    });
});
