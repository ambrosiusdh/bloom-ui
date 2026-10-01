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
const response = (content = [], totalPages = content.length ? 1 : 0, totalElements = content.length) => ({
    data: {
        data: {
            content,
            totalPages,
            totalElements
        }
    }
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

describe('GoodsReceiptList UXI-18 read workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useGoodsReceiptStore.setState({
            goodsReceiptList: [], goodsReceiptPaging: {}, goodsReceiptListStatus: 'idle',
            goodsReceiptListError: null
        });
    });

    it('renders server receipt/payment truth and sends only supported filters and paging', async () => {
        goodsReceiptApi.getGoodsReceiptList.mockResolvedValue(response([receipt], 3, 11));
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
        expect(screen.getByRole('heading', { name: 'Penerimaan barang', level: 1 }))
            .toBeInTheDocument();
        expect(screen.getByText('6–6 dari 11 penerimaan · Terbaru lebih dulu'))
            .toBeInTheDocument();
        expect(screen.getByText('Halaman 2 dari 3')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: `Buka detail ${ receipt.code }` })).toHaveAttribute(
            'href', `/goods-receipts/${ encodeURIComponent(receipt.code) }`
        );
        expect(screen.getByRole('link', { name: /buat penerimaan/i })).toHaveAttribute('href', '/goods-receipts/new');
        expect(screen.getByRole('textbox', { name: 'Tanggal mulai' })).toHaveValue('01-09-2026');
        expect(screen.getByRole('textbox', { name: 'Tanggal akhir' })).toHaveValue('03-09-2026');

        const [params, config, options] = goodsReceiptApi.getGoodsReceiptList.mock.calls[0];
        expect(params).toMatchObject({ page: 2, size: 5, supplierName: 'Bloom' });
        expect(params.receivedDateFrom).toBe('2026-09-01');
        expect(params.receivedDateTo).toBe('2026-09-03');
        expect(params).not.toHaveProperty('paymentStatus');
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
        const clearButton = screen.getByRole('button', { name: 'Reset filter' });
        expect(clearButton).toBeEnabled();
        await user.click(clearButton);
        expect(query).toHaveValue('');
    });

    it('forwards the exact supported supplier-code filter from the URL', async () => {
        goodsReceiptApi.getGoodsReceiptList.mockResolvedValue(response());

        render(<GoodsReceiptList />, {
            route: '/goods-receipts?key=supplierCode&q=SUP-007&page=3&size=25'
        });

        expect(await screen.findByText('Tidak ada penerimaan barang')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Kode pemasok' })).toHaveValue('SUP-007');
        expect(goodsReceiptApi.getGoodsReceiptList.mock.calls[0][0]).toEqual({
            page: 3,
            size: 25,
            supplierCode: 'SUP-007'
        });
    });

    it('renders unpaid, partially paid, and paid states exactly as returned by the server', async () => {
        const receipts = [
            receipt,
            {
                ...receipt,
                code: 'GR/IX-2026/0026',
                paidAmount: '2500',
                outstandingAmount: '10000',
                paymentStatus: 'PARTIALLY_PAID'
            },
            {
                ...receipt,
                code: 'GR/IX-2026/0027',
                paidAmount: '12500',
                outstandingAmount: '0',
                paymentStatus: 'PAID'
            }
        ];
        goodsReceiptApi.getGoodsReceiptList.mockResolvedValue(response(receipts));

        render(<GoodsReceiptList />, { route: '/goods-receipts' });

        expect(await screen.findByLabelText('Status pembayaran: Belum dibayar'))
            .toBeInTheDocument();
        expect(screen.getByLabelText('Status pembayaran: Dibayar sebagian'))
            .toBeInTheDocument();
        expect(screen.getByLabelText('Status pembayaran: Lunas'))
            .toBeInTheDocument();
        expect(goodsReceiptApi.getGoodsReceiptList.mock.calls[0][0])
            .not.toHaveProperty('paymentStatus');
    });

    it('validates Indonesian date input and keeps the canonical dates in the URL request', async () => {
        const user = userEvent.setup();
        goodsReceiptApi.getGoodsReceiptList.mockResolvedValue(response());

        render(<GoodsReceiptList />, { route: '/goods-receipts' });

        await screen.findByText('Tidak ada penerimaan barang');
        await user.type(screen.getByRole('textbox', { name: 'Tanggal mulai' }), '03-09-2026');
        await user.type(screen.getByRole('textbox', { name: 'Tanggal akhir' }), '01-09-2026');
        await user.click(screen.getByRole('button', { name: 'Terapkan filter' }));

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Tanggal mulai tidak boleh setelah tanggal akhir.'
        );
        expect(goodsReceiptApi.getGoodsReceiptList).toHaveBeenCalledTimes(1);

        await user.clear(screen.getByRole('textbox', { name: 'Tanggal akhir' }));
        await user.type(screen.getByRole('textbox', { name: 'Tanggal akhir' }), '05-09-2026');
        await user.click(screen.getByRole('button', { name: 'Terapkan filter' }));

        await waitFor(() => expect(goodsReceiptApi.getGoodsReceiptList).toHaveBeenCalledTimes(2));
        expect(goodsReceiptApi.getGoodsReceiptList.mock.calls[1][0]).toMatchObject({
            receivedDateFrom: '2026-09-03',
            receivedDateTo: '2026-09-05',
            page: 1
        });
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

    it.each([
        [
            'tanggal mulai saja',
            '/goods-receipts?receivedDateFrom=2026-12-31',
            {
                receivedDateFrom: '2026-12-31'
            }
        ],
        [
            'tanggal akhir saja',
            '/goods-receipts?receivedDateTo=2027-01-01',
            {
                receivedDateTo: '2027-01-01'
            }
        ],
        [
            'hari yang sama',
            '/goods-receipts?receivedDateFrom=2026-09-12&receivedDateTo=2026-09-12',
            {
                receivedDateFrom: '2026-09-12',
                receivedDateTo: '2026-09-12'
            }
        ],
        [
            'batas bulan dan hari kabisat',
            '/goods-receipts?receivedDateFrom=2028-02-29&receivedDateTo=2028-03-01',
            {
                receivedDateFrom: '2028-02-29',
                receivedDateTo: '2028-03-01'
            }
        ]
    ])('mengirim %s sebagai tanggal kalender tanpa konversi zona perangkat', async (_, route, expected) => {
        goodsReceiptApi.getGoodsReceiptList.mockResolvedValue(response());

        render(<GoodsReceiptList />, { route });

        expect(await screen.findByText('Tidak ada penerimaan barang')).toBeInTheDocument();
        expect(goodsReceiptApi.getGoodsReceiptList).toHaveBeenCalledTimes(1);
        expect(goodsReceiptApi.getGoodsReceiptList.mock.calls[0][0]).toMatchObject({
            page: 1,
            size: 10,
            ...expected
        });
    });
});
