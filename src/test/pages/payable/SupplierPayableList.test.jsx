import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import goodsReceiptApi from '@api/goods-receipt.js';
import supplierApi from '@api/supplier.js';
import SupplierPayableList from '@pages/payable/SupplierPayableList.jsx';
import useGoodsReceiptStore from '@stores/modules/goods-receipt.js';
import { formatDate } from '@utils/date-utils.js';
import { act, render, screen, waitFor } from '@/test/render.jsx';

vi.mock('@api/goods-receipt.js', () => ({ default: {
    getGoodsReceiptList: vi.fn(),
    getGoodsReceiptDetails: vi.fn(),
    createGoodsReceipt: vi.fn()
} }));

vi.mock('@api/supplier.js', () => ({ default: {
    getSupplierOutstandingBalance: vi.fn()
} }));

const receipts = [
    {
        code: 'GR/IX-2026/0001', supplierCode: 'SUP-001', supplierName: 'Nusantara Tekstil',
        totalAmount: '100000.0000', paidAmount: '0.0000', outstandingAmount: '100000.0000',
        paymentStatus: 'UNPAID', status: 'POSTED', receivedDate: '2026-09-01T03:00:00Z',
        createdBy: 'admin'
    },
    {
        code: 'GR/IX-2026/0002', supplierCode: 'SUP-002', supplierName: 'Maju Bersama',
        totalAmount: '90000.0000', paidAmount: '40000.0000', outstandingAmount: '50000.0000',
        paymentStatus: 'PARTIALLY_PAID', status: 'POSTED', receivedDate: '2026-09-02T03:00:00Z',
        createdBy: 'admin'
    },
    {
        code: 'GR/IX-2026/0003', supplierCode: 'SUP-003', supplierName: 'Lunas Jaya',
        totalAmount: '25000.0000', paidAmount: '25000.0000', outstandingAmount: '0.0000',
        paymentStatus: 'PAID', status: 'POSTED', receivedDate: '2026-09-03T03:00:00Z',
        createdBy: 'admin'
    }
];

const response = (content = [], totalPages = content.length ? 1 : 0) => ({
    data: { data: { content, totalPages, totalElements: content.length } }
});

const deferred = () => {
    let reject;
    const promise = new Promise((_, rejectPromise) => {
        reject = rejectPromise;
    });
    return { promise, reject };
};

describe('SupplierPayableList FE-27 read workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useGoodsReceiptStore.setState({
            goodsReceiptList: [],
            goodsReceiptPaging: {},
            goodsReceiptListStatus: 'idle',
            goodsReceiptListError: null
        });
    });

    it('renders server amounts/statuses and detail links from one paged request', async () => {
        goodsReceiptApi.getGoodsReceiptList.mockResolvedValue(response(receipts, 3));
        render(<SupplierPayableList />, {
            route: '/payables?key=supplierName&q=Nusantara&page=2&size=25'
        });

        expect(await screen.findByRole('link', { name: 'Nusantara Tekstil' }))
            .toHaveAttribute('href', '/suppliers/SUP-001');
        expect(screen.getByRole('link', { name: 'GR/IX-2026/0001' }))
            .toHaveAttribute('href', '/goods-receipts/GR%2FIX-2026%2F0001');
        expect(screen.getByLabelText('Status pembayaran: Belum dibayar')).toBeInTheDocument();
        expect(screen.getByLabelText('Status pembayaran: Dibayar sebagian')).toBeInTheDocument();
        expect(screen.getByLabelText('Status pembayaran: Lunas')).toBeInTheDocument();
        expect(screen.getByText('Sisa: Rp 100.000')).toBeInTheDocument();
        expect(screen.getByText('Sisa: Rp 50.000')).toBeInTheDocument();
        expect(screen.getByText('Sisa: Rp 0')).toBeInTheDocument();
        expect(screen.getByText(formatDate(receipts[0].receivedDate))).toBeInTheDocument();

        expect(goodsReceiptApi.getGoodsReceiptList).toHaveBeenCalledTimes(1);
        expect(goodsReceiptApi.getGoodsReceiptList).toHaveBeenCalledWith(
            { page: 2, size: 25, supplierName: 'Nusantara' },
            { signal: expect.any(AbortSignal) },
            { useLoader: false }
        );
        expect(goodsReceiptApi.getGoodsReceiptDetails).not.toHaveBeenCalled();
        expect(supplierApi.getSupplierOutstandingBalance).not.toHaveBeenCalled();
    });

    it('announces loading, retries the same request after an error, then shows empty', async () => {
        const user = userEvent.setup();
        const firstRequest = deferred();
        goodsReceiptApi.getGoodsReceiptList.mockReturnValueOnce(firstRequest.promise);
        render(<SupplierPayableList />, { route: '/payables?key=code&q=GR-404' });

        expect(screen.getByRole('status')).toHaveTextContent('Memuat utang pemasok...');
        await act(async () => firstRequest.reject(new Error('Utang gagal dimuat.')));
        expect(await screen.findByText('Utang gagal dimuat.')).toBeInTheDocument();

        goodsReceiptApi.getGoodsReceiptList.mockResolvedValueOnce(response());
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect(await screen.findByText('Belum ada penerimaan pemasok')).toBeInTheDocument();
        await waitFor(() => expect(goodsReceiptApi.getGoodsReceiptList).toHaveBeenCalledTimes(2));
        expect(goodsReceiptApi.getGoodsReceiptList.mock.calls[1][0])
            .toEqual({ page: 1, size: 10, code: 'GR-404' });
    });
});
