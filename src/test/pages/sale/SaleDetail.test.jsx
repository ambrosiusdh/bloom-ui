import { Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SaleDetail from '@pages/sale/SaleDetail.jsx';
import useSaleStore from '@stores/modules/sale.js';
import { act, fireEvent, render, screen, waitFor } from '@/test/render.jsx';

const saleApi = vi.hoisted(() => ({
    createSale: vi.fn(),
    getSaleDetails: vi.fn(),
    getSaleList: vi.fn(),
    printReceipt: vi.fn()
}));

vi.mock('@api/sale.js', () => ({ default: saleApi }));

const sale = {
    code: 'SALE-2026-001',
    createdAt: '2026-08-11T02:00:00Z',
    createdBy: 'Kasir',
    paymentType: 'CASH',
    subtotalAmount: 10000,
    discountAmount: 0,
    totalAmount: 10000,
    paidAmount: 10000,
    saleItems: []
};

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, reject, resolve };
};

const renderSaleDetail = () => render(
    <Routes>
        <Route path="/sales/:code" element={ <SaleDetail /> } />
    </Routes>,
    { route: `/sales/${ sale.code }` }
);

describe('SaleDetail receipt reprint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSaleStore.setState({ saleDetails: {} });
        saleApi.getSaleDetails.mockResolvedValue({ data: { data: sale } });
    });

    it('prevents duplicate clicks and preserves the sale reference through pending and success', async () => {
        const printRequest = deferred();
        const browserPrint = vi.spyOn(window, 'print').mockImplementation(() => {});
        saleApi.printReceipt.mockReturnValue(printRequest.promise);
        renderSaleDetail();

        const printButton = await screen.findByRole('button', { name: 'Cetak ulang struk' });
        fireEvent.click(printButton);
        fireEvent.click(printButton);

        expect(saleApi.printReceipt).toHaveBeenCalledTimes(1);
        expect(saleApi.printReceipt).toHaveBeenCalledWith(sale.code, undefined);
        expect(screen.getByRole('button', { name: 'Mencetak...' })).toBeDisabled();
        expect(screen.getByRole('status')).toHaveTextContent(`Penjualan ${ sale.code }`);

        await act(async () => printRequest.resolve({ data: { data: true } }));

        expect(await screen.findByRole('status')).toHaveTextContent('Struk berhasil dicetak.');
        expect(screen.getByRole('status')).toHaveTextContent(`Penjualan ${ sale.code }`);
        expect(screen.getByRole('status')).toHaveFocus();
        expect(screen.getByRole('button', { name: 'Cetak ulang struk' })).toBeEnabled();
        expect(browserPrint).not.toHaveBeenCalled();
    });

    it('shows a printer failure and retries the same sale without recreating it', async () => {
        const user = userEvent.setup();
        const printerError = Object.assign(new Error('Terjadi kesalahan.'), {
            category: 'unexpected',
            domainCode: 'printer_not_found'
        });
        saleApi.printReceipt
            .mockRejectedValueOnce(printerError)
            .mockResolvedValueOnce({ data: { data: true } });
        renderSaleDetail();

        await user.click(await screen.findByRole('button', { name: 'Cetak ulang struk' }));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent(`Penjualan ${ sale.code }`);
        expect(alert).toHaveTextContent('Printer yang dikonfigurasi pada server tidak ditemukan.');
        expect(alert).toHaveFocus();

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        await waitFor(() => expect(saleApi.printReceipt).toHaveBeenCalledTimes(2));
        expect(saleApi.printReceipt).toHaveBeenNthCalledWith(1, sale.code, undefined);
        expect(saleApi.printReceipt).toHaveBeenNthCalledWith(2, sale.code, undefined);
        expect(await screen.findByRole('status')).toHaveTextContent('Struk berhasil dicetak.');
        expect(saleApi.createSale).not.toHaveBeenCalled();
    });
});
