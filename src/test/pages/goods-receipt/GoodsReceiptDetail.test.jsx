import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import goodsReceiptApi from '@api/goods-receipt.js';
import GoodsReceiptDetail from '@pages/goods-receipt/GoodsReceiptDetail.jsx';
import useAuthStore from '@stores/modules/auth.js';
import useGoodsReceiptStore from '@stores/modules/goods-receipt.js';
import useSupplierPaymentStore from '@stores/modules/supplier-payment.js';
import { render, screen } from '@/test/render.jsx';

vi.mock('@api/goods-receipt.js', () => ({ default: {
    getGoodsReceiptList: vi.fn(), getGoodsReceiptDetails: vi.fn(), createGoodsReceipt: vi.fn()
} }));

const receipt = {
    code: 'GR/IX-2026/0025', supplierId: 7, supplierCode: 'SUP-007', supplierName: 'Bloom Textile',
    totalAmount: '12500.0000', paidAmount: '2500.0000', outstandingAmount: '10000.0000',
    paymentStatus: 'PARTIALLY_PAID', status: 'POSTED', description: 'Kain datang lengkap',
    receivedDate: '2026-09-02T03:00:00Z', createdAt: '2026-09-02T03:05:00Z', createdBy: 'admin',
    items: [{ id: 3, item: { sku: 'KAIN-1', name: 'Kain Katun' }, quantity: '1.2500',
        baseUnitOfMeasure: 'METER', purchasePrice: '10000.0000', lineTotal: '12500.0000',
        stockLocation: 'WAREHOUSE' }]
};

const renderDetail = (reference = receipt.code) => render(
    <Routes><Route path="/goods-receipts/:code" element={ <GoodsReceiptDetail /> } /></Routes>,
    { route: `/goods-receipts/${ encodeURIComponent(reference) }` }
);

describe('GoodsReceiptDetail FE-25 read workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSupplierPaymentStore.setState(useSupplierPaymentStore.getInitialState());
        useAuthStore.setState({ authStatus: 'authenticated', currentUser: { username: 'cashier-a' } });
        useGoodsReceiptStore.setState({
            goodsReceiptDetails: null, goodsReceiptDetailStatus: 'idle', goodsReceiptDetailError: null
        });
    });

    it('renders supplier identity, persisted decimal/UOM/location, and server financial values', async () => {
        goodsReceiptApi.getGoodsReceiptDetails.mockResolvedValue({ data: { data: receipt } });
        renderDetail();

        expect(await screen.findByText('Kain datang lengkap')).toBeInTheDocument();
        expect(screen.getByLabelText('Status penerimaan: Dibukukan')).toBeInTheDocument();
        expect(screen.getByLabelText('Status pembayaran: Dibayar sebagian')).toBeInTheDocument();
        expect(screen.getByText('ID pemasok').nextSibling).toHaveTextContent('7');
        expect(screen.getByText('Kode pemasok').nextSibling).toHaveTextContent('SUP-007');
        expect(screen.getByText('Total').nextSibling).toHaveTextContent('Rp 12.500');
        expect(screen.getByText('Sudah dibayar').nextSibling).toHaveTextContent('Rp 2.500');
        expect(screen.getByText('Belum dibayar').nextSibling).toHaveTextContent('Rp 10.000');
        expect(screen.getAllByText('1,25 meter').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Gudang').length).toBeGreaterThan(0);
        expect(goodsReceiptApi.getGoodsReceiptDetails).toHaveBeenCalledWith(
            receipt.code, { signal: expect.any(AbortSignal) }, { useLoader: false }
        );
        expect(goodsReceiptApi.getGoodsReceiptList).not.toHaveBeenCalled();
    });

    it('announces loading and retries a failed detail request', async () => {
        const user = userEvent.setup();
        goodsReceiptApi.getGoodsReceiptDetails
            .mockRejectedValueOnce(new Error('Detail gagal dimuat.'))
            .mockResolvedValueOnce({ data: { data: receipt } });
        renderDetail();

        expect(screen.getByRole('status')).toHaveTextContent('Memuat detail penerimaan barang...');
        expect(await screen.findByRole('alert')).toHaveTextContent('Detail gagal dimuat.');
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByText('Kain datang lengkap')).toBeInTheDocument();
        expect(goodsReceiptApi.getGoodsReceiptDetails).toHaveBeenCalledTimes(2);
    });

    it('rejects an obviously invalid reference without calling the backend', async () => {
        renderDetail('G'.repeat(101));

        expect(await screen.findByRole('alert')).toHaveTextContent('Nomor penerimaan barang tidak valid.');
        expect(goodsReceiptApi.getGoodsReceiptDetails).not.toHaveBeenCalled();
    });

    it('refreshes after returning to a completed payment even when the initial detail read is stale', async () => {
        useSupplierPaymentStore.setState({ code: receipt.code, owner: 'cashier-a', outcome: 'success', refreshStatus: 'ready',
            result: { id: 28, receiptCode: receipt.code, amount: '10000', paymentMethod: 'QRIS', voided: false } });
        goodsReceiptApi.getGoodsReceiptDetails
            .mockResolvedValueOnce({ data: { data: receipt } })
            .mockResolvedValue({ data: { data: { ...receipt, paidAmount: '12500', outstandingAmount: '0', paymentStatus: 'PAID' } } });
        renderDetail();
        expect(await screen.findByLabelText('Status pembayaran: Lunas')).toBeInTheDocument();
        expect(screen.getByText('Belum dibayar').nextSibling).toHaveTextContent('Rp 0');
        expect(goodsReceiptApi.getGoodsReceiptDetails).toHaveBeenCalledTimes(2);
    });
});
