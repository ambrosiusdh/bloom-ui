import { act } from 'react';
import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const checkoutMocks = vi.hoisted(() => ({
    createSale: vi.fn(),
    getCheckoutStatus: vi.fn(),
    getCurrentSession: vi.fn(),
    getSaleDetails: vi.fn(),
    getSaleList: vi.fn(),
    printReceipt: vi.fn()
}));

vi.mock('@api/sale.js', () => ({
    default: {
        createSale: checkoutMocks.createSale,
        getCheckoutStatus: checkoutMocks.getCheckoutStatus,
        getSaleDetails: checkoutMocks.getSaleDetails,
        getSaleList: checkoutMocks.getSaleList,
        printReceipt: checkoutMocks.printReceipt
    }
}));

vi.mock('@stores/index.js', async importOriginal => ({
    ...await importOriginal(),
    useCashSessionStore: selector => selector({
        getCurrentSession: checkoutMocks.getCurrentSession
    })
}));

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import CashierCheckout from '@components/cashier/CashierCheckout.jsx';
import { SALE_CHECKOUT_RECOVERY_STORAGE_KEY } from '@components/cashier/sale-checkout.js';
import SaleDetail from '@pages/sale/SaleDetail.jsx';
import useAuthStore from '@stores/modules/auth.js';
import useSaleStore from '@stores/modules/sale.js';
import { render, screen, waitFor } from '@/test/render.jsx';

const cartItems = [{
    sku: 'KAIN-00001',
    name: 'Kain katun',
    price: '15000.0000',
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
    const view = render(
        <CashierCheckout
            itemList={ cartItems }
            onLockChange={ onLockChange }
            onSaleCompleted={ onSaleCompleted }
            { ...props }
        />
    );
    return {
        ...view,
        onLockChange,
        onSaleCompleted
    };
};

const reviewCashPayment = async (user, amount = '20000') => {
    await user.type(screen.getByRole('textbox', { name: 'Uang tunai diterima' }), amount);
    await user.click(screen.getByRole('button', { name: 'Tinjau pembayaran' }));
    return screen.findByRole('region', { name: 'Pastikan barang dan pembayaran' });
};

describe('CashierCheckout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        checkoutMocks.createSale.mockReset();
        checkoutMocks.getCheckoutStatus.mockReset();
        checkoutMocks.getCurrentSession.mockReset();
        checkoutMocks.getSaleDetails.mockReset();
        checkoutMocks.getSaleList.mockReset();
        checkoutMocks.printReceipt.mockReset();
        useAuthStore.setState({
            authStatus: 'authenticated',
            currentUser: {
                accountId: '101',
                username: 'admin'
            }
        });
        useSaleStore.setState({
            receiptPrintStateBySale: {},
            saleDetails: {}
        });
        checkoutMocks.getCurrentSession.mockResolvedValue({ id: 7, status: 'OPEN' });
        checkoutMocks.printReceipt.mockResolvedValue({ data: { data: true } });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows confirmed sale before automatic print status, blocks duplicates, and supports reprint', async () => {
        const user = userEvent.setup();
        const request = deferred();
        const printRequest = deferred();
        const browserPrint = vi.spyOn(window, 'print').mockImplementation(() => {});
        checkoutMocks.createSale.mockReturnValue(request.promise);
        checkoutMocks.printReceipt
            .mockReturnValueOnce(printRequest.promise)
            .mockResolvedValueOnce({ data: { data: true } });
        const { onLockChange, onSaleCompleted } = renderCheckout();

        const review = await reviewCashPayment(user);
        expect(review).toHaveTextContent('Kain katun');
        expect(review).toHaveTextContent('Total resmi & kembalianDitetapkan server');
        expect(review).toHaveTextContent('Perkiraan bayar');
        expect(review).toHaveTextContent('Rp 18.750');

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
        }, expect.stringMatching(/^sale-/), undefined);
        const durableAttempt = JSON.parse(
            sessionStorage.getItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY)
        );
        expect(durableAttempt.ownerAccountId).toBe('101');
        expect(durableAttempt.attempt.request).toEqual(checkoutMocks.createSale.mock.calls[0][0]);
        expect(durableAttempt.attempt.key).toBe(checkoutMocks.createSale.mock.calls[0][1]);
        expect(screen.getByRole('button', { name: 'Memproses...' })).toBeDisabled();
        expect(onLockChange).toHaveBeenCalledWith(true);

        const completedSale = sale();
        await act(async () => request.resolve({ data: { data: completedSale } }));

        const success = await screen.findByRole('status', { name: 'Status penjualan' });
        expect(success).toHaveTextContent('Penjualan SALE/VIII-2026/0042 berhasil.');
        expect(success).toHaveTextContent('Total server: Rp 18.750');
        expect(success).toHaveTextContent('Kembalian server: Rp 1.250');
        expect(success).toHaveFocus();
        expect(sessionStorage.getItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY)).toBeNull();
        expect(onSaleCompleted).toHaveBeenCalledWith(completedSale);
        expect(checkoutMocks.printReceipt).toHaveBeenCalledTimes(1);
        expect(checkoutMocks.printReceipt).toHaveBeenCalledWith(completedSale.code, undefined);

        const printStatus = screen.getByRole('status', { name: 'Status pencetakan struk' });
        expect(printStatus).toHaveTextContent(`Pencetakan struk ${ completedSale.code }`);
        expect(printStatus).toHaveTextContent('Permintaan cetak sedang diproses oleh server.');
        expect(screen.getByRole('button', { name: 'Mencetak...' })).toBeDisabled();
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);

        await act(async () => printRequest.resolve({ data: { data: true } }));

        expect(printStatus).toHaveTextContent('Struk berhasil dicetak.');
        expect(printStatus).toHaveFocus();
        await user.click(screen.getByRole('button', { name: 'Cetak ulang struk' }));
        await waitFor(() => expect(checkoutMocks.printReceipt).toHaveBeenCalledTimes(2));
        expect(checkoutMocks.printReceipt).toHaveBeenNthCalledWith(2, completedSale.code, undefined);
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
        expect(browserPrint).not.toHaveBeenCalled();
    });

    it('prepares discount, conditional reason, CASH tender, and advisory totals before checkout', async () => {
        const user = userEvent.setup();
        renderCheckout();

        expect(screen.getByLabelText('Perkiraan bayar dari harga yang tampil'))
            .toHaveTextContent('Rp 18.750');
        expect(screen.queryByRole('textbox', { name: 'Alasan diskon' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Uang pas' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Rp 20.000' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Rp 30.000' })).toBeInTheDocument();

        await user.clear(screen.getByRole('textbox', { name: 'Diskon penjualan' }));
        await user.type(screen.getByRole('textbox', { name: 'Diskon penjualan' }), '5000');
        await user.type(screen.getByRole('textbox', { name: 'Alasan diskon' }), 'Harga langganan');
        await user.type(screen.getByRole('textbox', { name: 'Uang tunai diterima' }), '20000');

        expect(screen.getByLabelText('Perkiraan bayar dari harga yang tampil'))
            .toHaveTextContent('Rp 13.750');
        expect(screen.getByText('Perkiraan kembalian').parentElement).toHaveTextContent('Rp 6.250');
        expect(screen.getByText('Perkiraan kembalian').parentElement)
            .toHaveTextContent('Server menetapkan kembalian resmi.');
        await user.click(screen.getByRole('button', { name: 'Tinjau pembayaran' }));

        const review = await screen.findByRole('region', { name: 'Pastikan barang dan pembayaran' });
        expect(review).toHaveTextContent('Diskon dimintaRp 5.000');
        expect(review).toHaveTextContent('Alasan diskonHarga langganan');
        expect(checkoutMocks.createSale).not.toHaveBeenCalled();
    });

    it('keeps sale success visible when printing fails and retries only that sale reference', async () => {
        const user = userEvent.setup();
        const completedSale = sale();
        checkoutMocks.createSale.mockResolvedValue({ data: { data: completedSale } });
        checkoutMocks.printReceipt
            .mockRejectedValueOnce(Object.assign(new Error('Printer hilang.'), {
                category: 'unexpected',
                domainCode: API_DOMAIN_ERROR_CODE.PRINTER_NOT_FOUND
            }))
            .mockResolvedValueOnce({ data: { data: true } });
        renderCheckout();

        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        const saleSuccess = await screen.findByRole('status', { name: 'Status penjualan' });
        const printFailure = await screen.findByRole('alert');
        expect(saleSuccess).toHaveTextContent(`Penjualan ${ completedSale.code } berhasil.`);
        expect(printFailure).toHaveTextContent('Printer yang dikonfigurasi pada server tidak ditemukan.');
        expect(printFailure).toHaveTextContent('Penjualan tetap berhasil dan tidak dikirim ulang.');
        expect(printFailure).toHaveFocus();

        await user.click(screen.getByRole('button', { name: 'Coba cetak lagi' }));

        await waitFor(() => expect(checkoutMocks.printReceipt).toHaveBeenCalledTimes(2));
        expect(checkoutMocks.printReceipt).toHaveBeenNthCalledWith(1, completedSale.code, undefined);
        expect(checkoutMocks.printReceipt).toHaveBeenNthCalledWith(2, completedSale.code, undefined);
        expect(await screen.findByText(/Struk berhasil dicetak\./)).toBeInTheDocument();
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
    });

    it('warns about an uncertain network print outcome and retries without recreating the sale', async () => {
        const user = userEvent.setup();
        const completedSale = sale();
        checkoutMocks.createSale.mockResolvedValue({ data: { data: completedSale } });
        checkoutMocks.printReceipt
            .mockRejectedValueOnce(Object.assign(new Error('Koneksi terputus.'), {
                category: 'network',
                domainCode: null
            }))
            .mockResolvedValueOnce({ data: { data: true } });
        renderCheckout();

        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        const printFailure = await screen.findByRole('alert');
        expect(screen.getByRole('status', { name: 'Status penjualan' }))
            .toHaveTextContent(`Penjualan ${ completedSale.code } berhasil.`);
        expect(printFailure).toHaveTextContent('Status pencetakan tidak dapat dipastikan');
        expect(printFailure).toHaveTextContent('Periksa printer sebelum mencoba lagi.');

        await user.click(screen.getByRole('button', { name: 'Coba cetak lagi' }));

        await waitFor(() => expect(checkoutMocks.printReceipt).toHaveBeenCalledTimes(2));
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
    });

    it('gives checkout-specific recovery when the confirmed sale cannot be found for printing', async () => {
        const user = userEvent.setup();
        const completedSale = sale();
        checkoutMocks.createSale.mockResolvedValue({ data: { data: completedSale } });
        checkoutMocks.printReceipt.mockRejectedValue(Object.assign(new Error('Tidak ditemukan.'), {
            category: 'not_found',
            domainCode: API_DOMAIN_ERROR_CODE.SALE_NOT_FOUND
        }));
        renderCheckout();

        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        const printFailure = await screen.findByRole('alert');
        expect(printFailure).toHaveTextContent(
            'Penjualan tidak ditemukan oleh server sehingga struk belum dapat dicetak.'
        );
        expect(printFailure).toHaveTextContent('Buka detail penjualan untuk memeriksa transaksi.');
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
    });

    it('shares a pending print with Sale Detail and blocks a second same-sale request', async () => {
        const user = userEvent.setup();
        const completedSale = sale();
        const printRequest = deferred();
        const onLockChange = vi.fn();
        const onSaleCompleted = vi.fn();
        checkoutMocks.createSale.mockResolvedValue({ data: { data: completedSale } });
        checkoutMocks.printReceipt.mockReturnValue(printRequest.promise);
        checkoutMocks.getSaleDetails.mockResolvedValue({ data: { data: completedSale } });
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
                <Route path="/sales/:code" element={ <SaleDetail /> } />
            </Routes>,
            { route: '/cashier' }
        );

        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));
        await screen.findByRole('status', { name: 'Status pencetakan struk' });
        await user.click(screen.getByRole('link', { name: 'Lihat detail penjualan' }));

        const pendingPrintButton = await screen.findByRole('button', { name: 'Mencetak...' });
        expect(pendingPrintButton).toBeDisabled();
        expect(checkoutMocks.printReceipt).toHaveBeenCalledTimes(1);

        await act(async () => printRequest.resolve({ data: { data: true } }));
        expect(await screen.findByText('Struk berhasil dicetak.')).toBeInTheDocument();
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
        expect(checkoutMocks.printReceipt).toHaveBeenCalledTimes(1);
        expect(checkoutMocks.printReceipt).toHaveBeenCalledWith(completedSale.code, undefined);
    });

    it('submits QRIS confirmation input without deriving a total or change locally', async () => {
        const user = userEvent.setup();
        const completedSale = sale({
            paidAmount: '18750.0000',
            changeAmount: '0.0000',
            paymentType: 'QRIS'
        });
        checkoutMocks.createSale.mockResolvedValue({ data: { data: completedSale } });
        renderCheckout();

        await user.click(screen.getByRole('button', { name: 'QRIS' }));
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
            expect.stringMatching(/^sale-/),
            undefined
        ));
        expect(await screen.findByRole('status', { name: 'Status penjualan' }))
            .toHaveTextContent('Kembalian server: Rp 0.');
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
        expect(screen.getByRole('textbox', { name: 'Uang tunai diterima' })).toHaveFocus();
        expect(sessionStorage.getItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY)).toBeNull();
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
            .mockResolvedValueOnce({ data: { data: completedSale } });
        checkoutMocks.getCheckoutStatus.mockResolvedValue({
            data: { data: { status: 'UNKNOWN', sale: null } }
        });
        const { onSaleCompleted } = renderCheckout();
        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        const unknown = await screen.findByText('Hasil transaksi belum diketahui.');
        expect(unknown).toBeInTheDocument();
        expect(checkoutMocks.getCheckoutStatus).toHaveBeenCalledTimes(1);
        const firstRequest = checkoutMocks.createSale.mock.calls[0][0];
        const firstKey = checkoutMocks.createSale.mock.calls[0][1];
        expect(checkoutMocks.getCheckoutStatus).toHaveBeenCalledWith(firstKey, undefined, undefined);
        expect(screen.queryByRole('textbox', { name: 'Uang tunai diterima' }))
            .not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Kirim ulang permintaan yang sama' }));

        await waitFor(() => expect(checkoutMocks.createSale).toHaveBeenCalledTimes(2));
        expect(checkoutMocks.createSale.mock.calls[1]).toEqual([firstRequest, firstKey, undefined]);
        expect(await screen.findByRole('status', { name: 'Status penjualan' }))
            .toHaveTextContent(completedSale.code);
        expect(onSaleCompleted).toHaveBeenCalledWith(completedSale);
    });

    it('restores an ambiguous account-owned attempt after remount without mutating the cart', async () => {
        const user = userEvent.setup();
        const retryRequest = deferred();
        checkoutMocks.createSale
            .mockRejectedValueOnce(Object.assign(new Error('Gagal terhubung.'), {
                category: 'network',
                status: null
            }))
            .mockReturnValueOnce(retryRequest.promise);
        checkoutMocks.getCheckoutStatus.mockResolvedValue({
            data: { data: { status: 'UNKNOWN', sale: null } }
        });
        const firstView = renderCheckout();

        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));
        await screen.findByRole('alert', { name: 'Pemulihan checkout' });

        const firstRequest = checkoutMocks.createSale.mock.calls[0][0];
        const firstKey = checkoutMocks.createSale.mock.calls[0][1];
        const durableState = sessionStorage.getItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY);
        expect(durableState).not.toBeNull();

        firstView.unmount();
        const { onSaleCompleted } = renderCheckout({ itemList: [] });

        const recovery = await screen.findByRole('alert', { name: 'Pemulihan checkout' });
        expect(recovery).toHaveTextContent('Permintaan tersimpan dari percobaan sebelumnya');
        expect(recovery).toHaveTextContent('Kain katun: 1,25 meter dari STORE');
        expect(screen.queryByRole('textbox', { name: 'Uang tunai diterima' })).not.toBeInTheDocument();
        expect(onSaleCompleted).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: 'Periksa status lagi' }));
        await waitFor(() => expect(checkoutMocks.getCheckoutStatus).toHaveBeenCalledTimes(2));
        expect(checkoutMocks.getCheckoutStatus).toHaveBeenLastCalledWith(
            firstKey,
            undefined,
            undefined
        );

        await user.click(screen.getByRole('button', { name: 'Kirim ulang permintaan yang sama' }));
        await waitFor(() => expect(checkoutMocks.createSale).toHaveBeenCalledTimes(2));
        expect(checkoutMocks.createSale.mock.calls[1]).toEqual([firstRequest, firstKey, undefined]);
        expect(sessionStorage.getItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY)).toBe(durableState);
    });

    it('quarantines another account checkout without exposing or replaying its request', async () => {
        const request = {
            discountAmount: '0',
            paidAmount: '987654',
            description: 'Rahasia akun asal',
            paymentType: 'CASH',
            saleItemList: [{
                itemSku: 'SECRET-SKU',
                quantity: '1',
                stockLocation: 'STORE'
            }]
        };
        const attempt = {
            ownerAccountId: '101',
            key: 'sale-owner-101',
            request,
            signature: JSON.stringify(request),
            displayLines: [{
                sku: 'SECRET-SKU',
                name: 'Barang rahasia',
                quantity: '1',
                baseUnitOfMeasure: 'PIECE'
            }]
        };
        sessionStorage.setItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY, JSON.stringify({
            version: 1,
            ownerAccountId: '101',
            attempt
        }));
        useAuthStore.setState({
            authStatus: 'authenticated',
            currentUser: {
                accountId: '202',
                username: 'admin-baru'
            }
        });

        renderCheckout({ itemList: [] });

        const quarantine = await screen.findByRole('alert', {
            name: 'Pemulihan checkout akun lain'
        });
        expect(quarantine).toHaveTextContent('Pemulihan checkout dikunci untuk akun ini');
        expect(screen.queryByText('Barang rahasia')).not.toBeInTheDocument();
        expect(screen.queryByText('987654')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Periksa status lagi' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', {
            name: 'Kirim ulang permintaan yang sama'
        })).not.toBeInTheDocument();
        expect(checkoutMocks.createSale).not.toHaveBeenCalled();
        expect(checkoutMocks.getCheckoutStatus).not.toHaveBeenCalled();
    });

    it('does not post when exact recovery persistence is unavailable', async () => {
        const user = userEvent.setup();
        renderCheckout();
        await reviewCashPayment(user);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
            throw new Error('Storage blocked');
        });

        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        const failure = await screen.findByText(/Pemulihan transaksi tidak dapat disimpan/);
        expect(failure).toBeInTheDocument();
        expect(checkoutMocks.createSale).not.toHaveBeenCalled();
        expect(sessionStorage.getItem(SALE_CHECKOUT_RECOVERY_STORAGE_KEY)).toBeNull();
    });

    it('turns an ambiguous POST into success when same-key lookup reports COMPLETED', async () => {
        const user = userEvent.setup();
        const completedSale = sale();
        checkoutMocks.createSale.mockRejectedValue(Object.assign(new Error('Timeout.'), {
            category: 'network',
            status: null
        }));
        checkoutMocks.getCheckoutStatus.mockResolvedValue({
            data: { data: { status: 'COMPLETED', sale: completedSale } }
        });
        renderCheckout();
        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        expect(await screen.findByRole('status', { name: 'Status penjualan' }))
            .toHaveTextContent(completedSale.code);
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
        expect(checkoutMocks.getCheckoutStatus).toHaveBeenCalledWith(
            checkoutMocks.createSale.mock.calls[0][1],
            undefined,
            undefined
        );
        await waitFor(() => expect(checkoutMocks.printReceipt).toHaveBeenCalledTimes(1));
        expect(checkoutMocks.createSale).toHaveBeenCalledTimes(1);
    });

    it('handles a same-key payload conflict as known failure and uses a new key for a new attempt', async () => {
        const user = userEvent.setup();
        checkoutMocks.createSale
            .mockRejectedValueOnce(Object.assign(new Error('Conflict.'), {
                category: 'conflict',
                status: 409,
                domainCode: API_DOMAIN_ERROR_CODE.CHECKOUT_IDEMPOTENCY_CONFLICT
            }))
            .mockResolvedValueOnce({ data: { data: sale() } });
        renderCheckout();
        await reviewCashPayment(user);
        await user.click(screen.getByRole('button', { name: 'Konfirmasi jual' }));

        expect(await screen.findByText(/Kunci transaksi bertabrakan/)).toBeInTheDocument();
        const conflictedKey = checkoutMocks.createSale.mock.calls[0][1];
        await user.click(screen.getByRole('button', { name: 'Tinjau pembayaran' }));
        await user.click(await screen.findByRole('button', { name: 'Konfirmasi jual' }));

        await waitFor(() => expect(checkoutMocks.createSale).toHaveBeenCalledTimes(2));
        expect(checkoutMocks.createSale.mock.calls[1][1]).not.toBe(conflictedKey);
        expect(await screen.findByRole('status', { name: 'Status penjualan' }))
            .toHaveTextContent('SALE/VIII-2026/0042');
    });
});
