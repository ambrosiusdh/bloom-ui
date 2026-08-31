import { act } from 'react';
import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkoutMocks = vi.hoisted(() => ({
    createSale: vi.fn(),
    getCheckoutStatus: vi.fn(),
    getCurrentSession: vi.fn(),
    printReceipt: vi.fn()
}));

vi.mock('@stores/index.js', () => ({
    useSaleStore: selector => selector({
        createSale: checkoutMocks.createSale,
        getCheckoutStatus: checkoutMocks.getCheckoutStatus,
        printReceipt: checkoutMocks.printReceipt
    }),
    useCashSessionStore: selector => selector({
        getCurrentSession: checkoutMocks.getCurrentSession
    })
}));

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import CashierCheckout from '@components/cashier/CashierCheckout.jsx';
import { render, screen, waitFor } from '@/test/render.jsx';

const cartItems = [{
    sku: 'KAIN-00001',
    name: 'Kain katun',
    quantity: '1.25',
    baseUnitOfMeasure: 'METER'
}];

const sale = overrides => ({
    code: 'SALE/VIII-2026/0042',
    sessionId: 7,
    subtotalAmount: '18750.0000',
    discountAmount: '0.0000',
    totalAmount: '18750.0000',
    paidAmount: '20000.0000',
    changeAmount: '1250.0000',
    paymentType: 'CASH',
    saleItems: [],
    ...overrides
});

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
};

const renderCheckout = props => {
    const onLockChange = vi.fn();
    const onSaleCompleted = vi.fn();
    render(
        <CashierCheckout
            itemList={ cartItems }
            onLockChange={ onLockChange }
            onSaleCompleted={ onSaleCompleted }
            { ...props }
        />
    );
    return { onLockChange, onSaleCompleted };
};

const reviewCashPayment = async (user, amount = '20000') => {
    await user.type(screen.getByRole('textbox', { name: 'Uang tunai diterima' }), amount);
    await user.click(screen.getByRole('button', { name: 'Tinjau pembayaran' }));
    return screen.findByRole('dialog', { name: 'Konfirmasi pembayaran' });
};

describe('CashierCheckout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        checkoutMocks.getCurrentSession.mockResolvedValue({ id: 7, status: 'OPEN' });
        checkoutMocks.printReceipt.mockResolvedValue({ data: true });
    });

    it('shows confirmed sale before automatic print status, blocks duplicates, and supports reprint', async () => {
        const user = userEvent.setup();
        const request = deferred();
        const printRequest = deferred();
        const browserPrint = vi.spyOn(window, 'print').mockImplementation(() => {});
        checkoutMocks.createSale.mockReturnValue(request.promise);
        checkoutMocks.printReceipt
            .mockReturnValueOnce(printRequest.promise)
            .mockResolvedValueOnce({ data: true });
        const { onLockChange, onSaleCompleted } = renderCheckout();

        const dialog = await reviewCashPayment(user);
        expect(dialog).toHaveTextContent('1 baris barang');
        expect(dialog).toHaveTextContent('Server akan memeriksa sesi dan stok');
        expect(screen.queryByText(/subtotal/i)).not.toBeInTheDocument();

        await user.dblClick(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
        expect(checkoutMocks.createSale).toHaveBeenCalledWith({
            discountAmount: '0',
            paidAmount: '20000',
            description: '',
            paymentType: 'CASH',
            saleItemList: [{
                itemSku: 'KAIN-00001',
                quantity: '1.25',
                stockLocation: 'STORE'
            }]
        }, expect.stringMatching(/^sale-/));
        expect(screen.getByRole('button', { name: 'Memproses...' })).toBeDisabled();
        expect(onLockChange).toHaveBeenCalledWith(true);

        const completedSale = sale();
        await act(async () => request.resolve({ data: completedSale }));

        const success = await screen.findByRole('status');
        expect(success).toHaveTextContent('Penjualan SALE/VIII-2026/0042 berhasil.');
        expect(success).toHaveTextContent('Total server: Rp 18.750');
        expect(success).toHaveTextContent('Kembalian server: Rp 1.250');
        expect(success).toHaveFocus();
        expect(onSaleCompleted).toHaveBeenCalledWith(completedSale);
        expect(checkoutMocks.printReceipt).toHaveBeenCalledTimes(1);
        expect(checkoutMocks.printReceipt).toHaveBeenCalledWith(completedSale.code);

        const printStatus = screen.getByRole('region', { name: 'Status pencetakan struk' });
        expect(printStatus).toHaveTextContent(`Pencetakan struk ${ completedSale.code }`);
        expect(printStatus).toHaveTextContent('Permintaan cetak sedang diproses oleh server.');
        expect(screen.getByRole('button', { name: 'Mencetak...' })).toBeDisabled();
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);

        await act(async () => printRequest.resolve({ data: true }));

        expect(printStatus).toHaveTextContent('Struk berhasil dicetak.');
        expect(printStatus).toHaveFocus();
        await user.click(screen.getByRole('button', { name: 'Cetak ulang struk' }));
        await waitFor(() => expect(checkoutMocks.printReceipt).toHaveBeenCalledTimes(2));
        expect(checkoutMocks.printReceipt).toHaveBeenNthCalledWith(2, completedSale.code);
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
        expect(browserPrint).not.toHaveBeenCalled();
        browserPrint.mockRestore();
    });

    it('keeps sale success visible when printing fails and retries only that sale reference', async () => {
        const user = userEvent.setup();
        const completedSale = sale();
        checkoutMocks.createSale.mockResolvedValue({ data: completedSale });
        checkoutMocks.printReceipt
            .mockRejectedValueOnce(Object.assign(new Error('Printer hilang.'), {
                category: 'unexpected',
                domainCode: API_DOMAIN_ERROR_CODE.PRINTER_NOT_FOUND
            }))
            .mockResolvedValueOnce({ data: true });
        renderCheckout();

        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        const saleSuccess = await screen.findByRole('status');
        const printFailure = await screen.findByRole('alert');
        expect(saleSuccess).toHaveTextContent(`Penjualan ${ completedSale.code } berhasil.`);
        expect(printFailure).toHaveTextContent('Printer yang dikonfigurasi pada server tidak ditemukan.');
        expect(printFailure).toHaveTextContent('Penjualan tetap berhasil dan tidak dikirim ulang.');
        expect(printFailure).toHaveFocus();

        await user.click(screen.getByRole('button', { name: 'Coba cetak lagi' }));

        await waitFor(() => expect(checkoutMocks.printReceipt).toHaveBeenCalledTimes(2));
        expect(checkoutMocks.printReceipt).toHaveBeenNthCalledWith(1, completedSale.code);
        expect(checkoutMocks.printReceipt).toHaveBeenNthCalledWith(2, completedSale.code);
        expect(await screen.findByText(/Struk berhasil dicetak\./)).toBeInTheDocument();
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
    });

    it('can navigate to the completed sale while printing is pending and ignores the late result', async () => {
        const user = userEvent.setup();
        const completedSale = sale();
        const printRequest = deferred();
        const onLockChange = vi.fn();
        const onSaleCompleted = vi.fn();
        checkoutMocks.createSale.mockResolvedValue({ data: completedSale });
        checkoutMocks.printReceipt.mockReturnValue(printRequest.promise);
        render(
            <Routes>
                <Route
                    path="/cashier"
                    element={ (
                        <CashierCheckout
                            itemList={ cartItems }
                            onLockChange={ onLockChange }
                            onSaleCompleted={ onSaleCompleted }
                        />
                    ) }
                />
                <Route path="/sales/:code" element={ <h1>Detail penjualan aman</h1> } />
            </Routes>,
            { route: '/cashier' }
        );

        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));
        await screen.findByRole('region', { name: 'Status pencetakan struk' });
        await user.click(screen.getByRole('link', { name: 'Lihat detail penjualan' }));

        expect(await screen.findByRole('heading', { name: 'Detail penjualan aman' })).toBeInTheDocument();
        await act(async () => printRequest.resolve({ data: true }));
        expect(screen.queryByText('Struk berhasil dicetak.')).not.toBeInTheDocument();
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
        expect(checkoutMocks.printReceipt).toHaveBeenCalledTimes(1);
        expect(checkoutMocks.printReceipt).toHaveBeenCalledWith(completedSale.code);
    });

    it('submits QRIS confirmation input without deriving a total or change locally', async () => {
        const user = userEvent.setup();
        const completedSale = sale({
            paidAmount: '18750.0000',
            changeAmount: '0.0000',
            paymentType: 'QRIS'
        });
        checkoutMocks.createSale.mockResolvedValue({ data: completedSale });
        renderCheckout();

        await user.click(screen.getByRole('combobox', { name: 'Metode pembayaran' }));
        await user.click(screen.getByRole('option', { name: 'QRIS' }));
        await user.type(
            screen.getByRole('textbox', { name: 'Nominal QRIS terkonfirmasi' }),
            '18750'
        );
        await user.click(screen.getByRole('button', { name: 'Tinjau pembayaran' }));
        await user.click(await screen.findByRole('button', { name: 'Konfirmasi jual' }));

        await waitFor(() => expect(checkoutMocks.createSale).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentType: 'QRIS',
                paidAmount: '18750'
            }),
            expect.stringMatching(/^sale-/)
        ));
        expect(await screen.findByRole('status')).toHaveTextContent('Kembalian server: Rp 0.');
    });

    it('focuses local validation and maps backend payment validation without clearing the cart', async () => {
        const user = userEvent.setup();
        renderCheckout();

        await user.click(screen.getByRole('button', { name: 'Tinjau pembayaran' }));
        const paidAmount = screen.getByRole('textbox', { name: 'Uang tunai diterima' });
        expect(screen.getByText('Jumlah pembayaran wajib diisi.')).toBeInTheDocument();
        expect(paidAmount).toHaveFocus();
        expect(checkoutMocks.createSale).not.toHaveBeenCalled();

        checkoutMocks.createSale.mockRejectedValue(Object.assign(new Error('Masukan tidak valid.'), {
            category: 'validation',
            status: 400,
            validationErrors: [{ field: 'paidAmount', message: 'Paid amount is required' }]
        }));
        await user.type(paidAmount, '20000');
        await user.click(screen.getByRole('button', { name: 'Tinjau pembayaran' }));
        await user.click(await screen.findByRole('button', { name: 'Konfirmasi jual' }));

        expect(await screen.findByText('Paid amount is required')).toBeInTheDocument();
        expect(paidAmount).toHaveFocus();
        expect(screen.getByText('Kain katun: 1,25 meter dari STORE')).toBeInTheDocument();
    });

    it.each([
        [
            'stock conflict',
            API_DOMAIN_ERROR_CODE.SALE_INSUFFICIENT_STOCK,
            /Stok berubah saat checkout/,
            false
        ],
        [
            'session conflict',
            API_DOMAIN_ERROR_CODE.CASH_SESSION_CONFLICT,
            /Sesi kas tidak lagi terbuka/,
            true
        ]
    ])('preserves the cart and handles %s', async (_name, domainCode, message, refreshesSession) => {
        const user = userEvent.setup();
        checkoutMocks.createSale.mockRejectedValue(Object.assign(new Error('Data berubah.'), {
            category: 'conflict',
            status: 409,
            domainCode,
            validationErrors: []
        }));
        renderCheckout();
        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(screen.getByText('Kain katun: 1,25 meter dari STORE')).toBeInTheDocument();
        expect(checkoutMocks.getCurrentSession).toHaveBeenCalledTimes(refreshesSession ? 1 : 0);
    });

    it('checks a timed-out attempt, keeps UNKNOWN locked, and replays the exact request with the same key', async () => {
        const user = userEvent.setup();
        const completedSale = sale();
        checkoutMocks.createSale
            .mockRejectedValueOnce(Object.assign(new Error('Gagal terhubung.'), {
                category: 'network',
                status: null
            }))
            .mockResolvedValueOnce({ data: completedSale });
        checkoutMocks.getCheckoutStatus.mockResolvedValue({
            data: { status: 'UNKNOWN', sale: null }
        });
        const { onSaleCompleted } = renderCheckout();
        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        const unknown = await screen.findByText('Hasil transaksi belum diketahui.');
        expect(unknown).toBeInTheDocument();
        expect(checkoutMocks.getCheckoutStatus).toHaveBeenCalledTimes(1);
        const firstRequest = checkoutMocks.createSale.mock.calls[0][0];
        const firstKey = checkoutMocks.createSale.mock.calls[0][1];
        expect(checkoutMocks.getCheckoutStatus).toHaveBeenCalledWith(firstKey);
        expect(screen.getByRole('textbox', { name: 'Uang tunai diterima' })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Kirim ulang permintaan yang sama' }));

        await waitFor(() => expect(checkoutMocks.createSale).toHaveBeenCalledTimes(2));
        expect(checkoutMocks.createSale.mock.calls[1]).toEqual([firstRequest, firstKey]);
        expect(await screen.findByRole('status')).toHaveTextContent(completedSale.code);
        expect(onSaleCompleted).toHaveBeenCalledWith(completedSale);
    });

    it('turns an ambiguous POST into success when same-key lookup reports COMPLETED', async () => {
        const user = userEvent.setup();
        const completedSale = sale();
        checkoutMocks.createSale.mockRejectedValue(Object.assign(new Error('Timeout.'), {
            category: 'network',
            status: null
        }));
        checkoutMocks.getCheckoutStatus.mockResolvedValue({
            data: { status: 'COMPLETED', sale: completedSale }
        });
        renderCheckout();
        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        expect(await screen.findByRole('status')).toHaveTextContent(completedSale.code);
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
        expect(checkoutMocks.getCheckoutStatus).toHaveBeenCalledWith(
            checkoutMocks.createSale.mock.calls[0][1]
        );
    });

    it('handles a same-key payload conflict as known failure and uses a new key for a new attempt', async () => {
        const user = userEvent.setup();
        checkoutMocks.createSale
            .mockRejectedValueOnce(Object.assign(new Error('Conflict.'), {
                category: 'conflict',
                status: 409,
                domainCode: API_DOMAIN_ERROR_CODE.CHECKOUT_IDEMPOTENCY_CONFLICT
            }))
            .mockResolvedValueOnce({ data: sale() });
        renderCheckout();
        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        expect(await screen.findByText(/Kunci transaksi bertabrakan/)).toBeInTheDocument();
        const conflictedKey = checkoutMocks.createSale.mock.calls[0][1];
        await user.click(screen.getByRole('button', { name: 'Tinjau pembayaran' }));
        await user.click(await screen.findByRole('button', { name: 'Konfirmasi jual' }));

        await waitFor(() => expect(checkoutMocks.createSale).toHaveBeenCalledTimes(2));
        expect(checkoutMocks.createSale.mock.calls[1][1]).not.toBe(conflictedKey);
        expect(await screen.findByRole('status')).toHaveTextContent('SALE/VIII-2026/0042');
    });
});
