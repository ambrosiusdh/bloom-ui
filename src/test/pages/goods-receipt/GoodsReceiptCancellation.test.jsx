import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import receiptApi from '@api/goods-receipt.js';
import GoodsReceiptDetail from '@pages/goods-receipt/GoodsReceiptDetail.jsx';
import useAuthStore from '@stores/modules/auth.js';
import useGoodsReceiptStore from '@stores/modules/goods-receipt.js';
import useSupplierPaymentStore from '@stores/modules/supplier-payment.js';
import { fireEvent, render, screen, waitFor, within } from '@/test/render.jsx';

vi.mock('@api/goods-receipt.js', () => ({
    default: {
        getGoodsReceiptDetails: vi.fn(),
        cancelGoodsReceipt: vi.fn()
    }
}));

vi.mock('@components/goods-receipt/SupplierPayment.jsx', () => ({
    default: () => <button>Payer test</button>
}));

vi.mock('@components/goods-receipt/SupplierPaymentHistory.jsx', () => ({
    default: () => <h2>Riwayat pembayaran</h2>
}));

const receipt = {
    code: 'GR/XI-2026/0042',
    status: 'POSTED',
    canCancel: true,
    paymentStatus: 'UNPAID',
    totalAmount: '12500',
    paidAmount: '0',
    outstandingAmount: '12500',
    items: [{
        id: 1,
        item: {
            sku: 'QA-CANCEL-F',
            name: 'Kain uji'
        },
        quantity: '1.2345',
        baseUnitOfMeasure: 'METER',
        stockLocation: 'STORE',
        purchasePrice: '1000',
        lineTotal: '1234.5'
    }, {
        id: 2,
        item: {
            sku: 'QA-CANCEL-F',
            name: 'Kain uji'
        },
        quantity: '2.3456',
        baseUnitOfMeasure: 'METER',
        stockLocation: 'WAREHOUSE',
        purchasePrice: '1000',
        lineTotal: '2345.6'
    }]
};

const cancelled = {
    ...receipt,
    status: 'CANCELLED',
    canCancel: false,
    outstandingAmount: '0',
    cancellationReason: 'Penerimaan duplikat',
    cancelledBy: 'admin',
    cancelledAt: '2026-11-18T03:00:00Z'
};

const response = data => ({
    data: { data }
});

const renderDetail = () => render(
    <Routes>
        <Route path="/goods-receipts/:code" element={ <GoodsReceiptDetail /> } />
    </Routes>,
    {
        initialEntries: [{
            pathname: '/goods-receipts/GR%2FXI-2026%2F0042',
            state: { from: '/payables?key=code&q=GR%2FXI-2026%2F0042' }
        }]
    }
);

const openConfirmation = async () => {
    fireEvent.click(await screen.findByRole('button', { name: 'Batalkan penerimaan' }));
    return screen.getByRole('dialog', { name: 'Batalkan penerimaan ini?' });
};

describe('Goods receipt cancellation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useGoodsReceiptStore.setState(useGoodsReceiptStore.getInitialState());
        useSupplierPaymentStore.setState(useSupplierPaymentStore.getInitialState());
        useAuthStore.setState({
            authStatus: 'authenticated',
            currentUser: {
                accountId: '101',
                username: 'admin'
            }
        });
        receiptApi.getGoodsReceiptDetails.mockResolvedValue(response(receipt));
    });

    it('uses backend eligibility even for an unpaid receipt with voided payment history', async () => {
        receiptApi.getGoodsReceiptDetails.mockResolvedValue(response({
            ...receipt,
            canCancel: false
        }));
        renderDetail();

        await screen.findByRole('heading', { name: 'Detail utang penerimaan' });
        expect(screen.queryByRole('button', { name: 'Batalkan penerimaan' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Kembali ke daftar' }))
            .toHaveAttribute('href', '/payables?key=code&q=GR%2FXI-2026%2F0042');
    });

    it('requires a reason and confirms stock and payable effects before submitting once', async () => {
        let resolve;
        receiptApi.cancelGoodsReceipt.mockReturnValue(new Promise(done => {
            resolve = done;
        }));
        renderDetail();
        const dialog = await openConfirmation();

        expect(dialog).toHaveTextContent(receipt.code);
        expect(dialog).toHaveTextContent('masing-masing lokasi awal');
        expect(dialog).toHaveTextContent('saldo utang pemasok');
        await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Batal' })).toHaveFocus());
        const confirm = within(dialog).getByRole('button', { name: 'Batalkan penerimaan' });
        fireEvent.click(confirm);
        expect(receiptApi.cancelGoodsReceipt).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Alasan pembatalan', { exact: false })).toHaveFocus();

        fireEvent.change(screen.getByLabelText('Alasan pembatalan', { exact: false }), {
            target: { value: '  Penerimaan duplikat  ' }
        });
        fireEvent.click(confirm);
        fireEvent.click(confirm);
        expect(confirm).toBeDisabled();
        expect(within(dialog).getByRole('button', { name: 'Batal' })).toBeDisabled();
        expect(receiptApi.cancelGoodsReceipt).toHaveBeenCalledTimes(1);
        expect(receiptApi.cancelGoodsReceipt).toHaveBeenCalledWith(receipt.code, 'Penerimaan duplikat');

        resolve(response(cancelled));
        expect(await screen.findByLabelText('Status penerimaan: Dibatalkan')).toBeInTheDocument();
        expect(screen.getByText('Alasan pembatalan').nextSibling).toHaveTextContent('Penerimaan duplikat');
        expect(screen.getByText('Dibatalkan oleh').nextSibling).toHaveTextContent('admin');
        expect(screen.getByText('Dibatalkan pada').nextSibling).toHaveTextContent('18-11-2026');
        expect(await screen.findByRole('link', { name: 'Lihat pergerakan stok pembatalan' }))
            .toHaveAttribute('href',
                '/stock-movements?sourceType=GOODS_RECEIPT_CANCELLATION&reference=GR%2FXI-2026%2F0042');
        expect(screen.queryByRole('button', { name: 'Batalkan penerimaan' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Payer test' })).not.toBeInTheDocument();
        expect(screen.getByText('Total').nextSibling).toHaveTextContent('Rp 12.500');
        expect(screen.getByText('Sisa utang').nextSibling).toHaveTextContent('Rp 0');
        expect(screen.getAllByText('1,2345 meter').length).toBeGreaterThan(0);
        expect(screen.getAllByText('2,3456 meter').length).toBeGreaterThan(0);
        expect(screen.getAllByText('STORE').length).toBeGreaterThan(0);
        expect(screen.getAllByText('WAREHOUSE').length).toBeGreaterThan(0);
    });

    it.each([
        ['goods_receipt_insufficient_stock', 'Stok di lokasi penerimaan semula tidak cukup'],
        ['goods_receipt_has_payments', 'sudah memiliki riwayat pembayaran']
    ])('preserves the reason after a confirmed rejection %s', async (domainCode, message) => {
        receiptApi.cancelGoodsReceipt.mockRejectedValue({
            status: 409,
            domainCode
        });
        renderDetail();
        const dialog = await openConfirmation();
        fireEvent.change(screen.getByLabelText('Alasan pembatalan', { exact: false }), {
            target: { value: 'Penerimaan duplikat' }
        });
        fireEvent.click(within(dialog).getByRole('button', { name: 'Batalkan penerimaan' }));

        expect(await within(dialog).findByRole('alert')).toHaveTextContent(message);
        expect(screen.getByLabelText('Alasan pembatalan', { exact: false })).toHaveValue('Penerimaan duplikat');
        expect(screen.getByLabelText('Status penerimaan: Dibukukan')).toBeInTheDocument();
    });

    it('requires a fresh detail read after an unknown outcome and never resubmits automatically', async () => {
        receiptApi.cancelGoodsReceipt.mockRejectedValue({ status: null });
        renderDetail();
        const dialog = await openConfirmation();
        fireEvent.change(screen.getByLabelText('Alasan pembatalan', { exact: false }), {
            target: { value: 'Penerimaan duplikat' }
        });
        fireEvent.click(within(dialog).getByRole('button', { name: 'Batalkan penerimaan' }));

        expect(await screen.findByText(/Hasil pembatalan belum dapat dipastikan/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Batalkan penerimaan' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Payer test' })).not.toBeInTheDocument();
        receiptApi.getGoodsReceiptDetails.mockResolvedValue(response(cancelled));
        fireEvent.click(screen.getByRole('button', { name: 'Muat ulang detail' }));

        expect(await screen.findByLabelText('Status penerimaan: Dibatalkan')).toBeInTheDocument();
        expect(receiptApi.cancelGoodsReceipt).toHaveBeenCalledTimes(1);
        expect(receiptApi.getGoodsReceiptDetails).toHaveBeenCalledTimes(2);
    });

    it.each([
        receipt,
        {
            ...cancelled,
            cancelledAt: null
        }
    ])('treats an incomplete success response as an unknown outcome', async incomplete => {
        receiptApi.cancelGoodsReceipt.mockResolvedValue(response(incomplete));
        renderDetail();
        const dialog = await openConfirmation();
        fireEvent.change(screen.getByLabelText('Alasan pembatalan', { exact: false }), {
            target: { value: 'Penerimaan duplikat' }
        });
        fireEvent.click(within(dialog).getByRole('button', { name: 'Batalkan penerimaan' }));

        expect(await screen.findByText(/Hasil pembatalan belum dapat dipastikan/)).toBeInTheDocument();
    });
});
