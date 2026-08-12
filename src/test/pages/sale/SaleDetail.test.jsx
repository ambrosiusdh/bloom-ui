import { Link, Routes, Route } from 'react-router-dom';
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
    code: 'SALE/VIII-2026/0001',
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

const renderSaleDetail = (routeSale = sale) => render(
    <Routes>
        <Route path="/sales/:code" element={ <SaleDetail /> } />
    </Routes>,
    { route: `/sales/${ encodeURIComponent(routeSale.code) }` }
);

const getReadyPrintButton = async () => {
    const printButton = await screen.findByRole('button', { name: 'Cetak ulang struk' });
    await waitFor(() => expect(printButton).toBeEnabled());
    return printButton;
};

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

        const printButton = await getReadyPrintButton();
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

        await user.click(await getReadyPrintButton());

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

    it('keeps the newest route details visible and prints that same sale after a stale response', async () => {
        const user = userEvent.setup();
        const firstSale = { ...sale, code: 'SALE/VIII-2026/0001' };
        const secondSale = { ...sale, code: 'SALE/VIII-2026/0002' };
        const firstDetails = deferred();
        const secondDetails = deferred();
        saleApi.getSaleDetails.mockImplementation(code => (
            code === firstSale.code ? firstDetails.promise : secondDetails.promise
        ));
        saleApi.printReceipt.mockResolvedValue({ data: { data: true } });
        render(
            <>
                <Link to={ `/sales/${ encodeURIComponent(secondSale.code) }` }>Penjualan berikutnya</Link>
                <Routes>
                    <Route path="/sales/:code" element={ <SaleDetail /> } />
                </Routes>
            </>,
            { route: `/sales/${ encodeURIComponent(firstSale.code) }` }
        );

        await waitFor(() => expect(saleApi.getSaleDetails).toHaveBeenCalledTimes(1));
        await user.click(screen.getByRole('link', { name: 'Penjualan berikutnya' }));
        await waitFor(() => expect(saleApi.getSaleDetails).toHaveBeenCalledTimes(2));
        expect(saleApi.getSaleDetails.mock.calls[0][1].signal.aborted).toBe(true);

        await act(async () => secondDetails.resolve({ data: { data: secondSale } }));
        expect(await screen.findByText(secondSale.code)).toBeInTheDocument();

        await act(async () => firstDetails.resolve({ data: { data: firstSale } }));
        expect(screen.getByText(secondSale.code)).toBeInTheDocument();
        expect(screen.queryByText(firstSale.code)).not.toBeInTheDocument();

        await user.click(await getReadyPrintButton());
        expect(saleApi.printReceipt).toHaveBeenCalledWith(secondSale.code, undefined);
    });

    it('clears a previous detail error when the route changes to a valid sale', async () => {
        const user = userEvent.setup();
        const nextSale = { ...sale, code: 'SALE/VIII-2026/0002' };
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        saleApi.getSaleDetails
            .mockRejectedValueOnce(new Error('Detail penjualan gagal dimuat.'))
            .mockResolvedValueOnce({ data: { data: nextSale } });
        render(
            <>
                <Link to={ `/sales/${ encodeURIComponent(nextSale.code) }` }>Buka penjualan valid</Link>
                <Routes>
                    <Route path="/sales/:code" element={ <SaleDetail /> } />
                </Routes>
            </>,
            { route: `/sales/${ encodeURIComponent(sale.code) }` }
        );

        expect(await screen.findByRole('alert')).toHaveTextContent('Detail penjualan gagal dimuat.');
        await user.click(screen.getByRole('link', { name: 'Buka penjualan valid' }));

        expect(await screen.findByText(nextSale.code)).toBeInTheDocument();
        expect(screen.queryByText('Detail penjualan gagal dimuat.')).not.toBeInTheDocument();
        consoleError.mockRestore();
    });

    it('ignores a print completion after navigating to another sale', async () => {
        const user = userEvent.setup();
        const nextSale = { ...sale, code: 'SALE/VIII-2026/0002' };
        const printRequest = deferred();
        saleApi.getSaleDetails.mockImplementation(code => Promise.resolve({
            data: { data: code === sale.code ? sale : nextSale }
        }));
        saleApi.printReceipt.mockReturnValue(printRequest.promise);
        render(
            <>
                <Link to={ `/sales/${ encodeURIComponent(nextSale.code) }` }>Pindah penjualan</Link>
                <Routes>
                    <Route path="/sales/:code" element={ <SaleDetail /> } />
                </Routes>
            </>,
            { route: `/sales/${ encodeURIComponent(sale.code) }` }
        );

        await user.click(await getReadyPrintButton());
        expect(screen.getByRole('status')).toHaveTextContent(`Penjualan ${ sale.code }`);
        await user.click(screen.getByRole('link', { name: 'Pindah penjualan' }));
        expect(await screen.findByText(nextSale.code)).toBeInTheDocument();

        await act(async () => printRequest.resolve({ data: { data: true } }));

        expect(screen.queryByText('Struk berhasil dicetak.')).not.toBeInTheDocument();
        expect(screen.queryByText(`Penjualan ${ sale.code }.`)).not.toBeInTheDocument();
    });

    it('does not crash when React Router receives a malformed encoded reference', async () => {
        const malformedSale = { ...sale, code: 'SALE%' };
        const consoleWarning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        saleApi.getSaleDetails.mockResolvedValue({ data: { data: malformedSale } });

        renderSaleDetail(malformedSale);

        expect(await screen.findByText(malformedSale.code)).toBeInTheDocument();
        expect(await getReadyPrintButton()).toBeEnabled();
        consoleWarning.mockRestore();
    });

    it('warns that a network failure may have an uncertain physical print outcome', async () => {
        const user = userEvent.setup();
        saleApi.printReceipt.mockRejectedValue(Object.assign(new Error('Gagal terhubung.'), {
            category: 'network'
        }));
        renderSaleDetail();

        await user.click(await getReadyPrintButton());

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Status pencetakan tidak dapat dipastikan'
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Periksa printer sebelum mencoba lagi.'
        );
    });

    it('shows a controlled failure when the backend does not acknowledge printing', async () => {
        const user = userEvent.setup();
        saleApi.printReceipt.mockResolvedValue({ data: { data: false } });
        renderSaleDetail();

        await user.click(await getReadyPrintButton());

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Struk gagal dicetak. Penjualan tidak diubah.'
        );
    });
});
