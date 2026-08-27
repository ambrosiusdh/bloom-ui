import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cashierMocks = vi.hoisted(() => ({
    getItemDetails: vi.fn(),
    getItemList: vi.fn(),
    setBreadcrumbs: vi.fn(),
    session: {
        currentSession: { id: 7, status: 'OPEN' },
        currentStatus: 'ready',
        drawerActionsEnabled: true
    }
}));

vi.mock('@api/item.js', () => ({
    default: {
        getItemDetails: cashierMocks.getItemDetails,
        getItemList: cashierMocks.getItemList
    }
}));
vi.mock('@components/cash-session/CurrentCashSession.jsx', () => ({
    default: () => <div data-testid="current-cash-session">Sesi kas</div>
}));
vi.mock('@stores/index.js', () => ({
    useBreadcrumbStore: selector => selector({ setBreadcrumbs: cashierMocks.setBreadcrumbs }),
    useCashSessionStore: selector => selector(cashierMocks.session)
}));

import Cashier from '@/pages/cashier/Cashier.jsx';
import { fireEvent, render, screen, waitFor } from '@/test/render.jsx';

const item = overrides => ({
    sku: 'KAIN-00001',
    name: 'Kain katun',
    price: '15000.0000',
    baseUnitOfMeasure: 'METER',
    fractionalQuantityAllowed: true,
    stockStore: '0.5000',
    active: true,
    ...overrides
});

const listResponse = content => ({ data: { data: { content } } });
const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
};

const E81W_EVENT_GAPS_MS = [
    13.223,
    1.097,
    0.316,
    0.299,
    0.324,
    0.262,
    0.266,
    0.407,
    0.305,
    0.298,
    0.284,
    0.28,
    0.283
];

const keyCode = key => /\d/.test(key)
    ? `Digit${ key }`
    : key === '-'
        ? 'Minus'
        : `Key${ key.toUpperCase() }`;

const fireKeyAt = (target, key, timeStamp) => {
    const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        code: key === 'Enter' ? 'Enter' : keyCode(key),
        key
    });
    Object.defineProperty(event, 'timeStamp', { value: timeStamp });
    fireEvent(target, event);
    return event;
};

const insertCharacter = (target, character) => {
    if (!('value' in target)) return;

    const selectionStart = target.selectionStart ?? target.value.length;
    const selectionEnd = target.selectionEnd ?? selectionStart;
    const nextValue = `${ target.value.slice(0, selectionStart) }${ character }${ target.value.slice(selectionEnd) }`;
    fireEvent.input(target, { target: { value: nextValue } });
    target.setSelectionRange(selectionStart + 1, selectionStart + 1);
};

const scanWithObservedE81wTiming = (target, value, startedAt = 1_000) => {
    let timeStamp = startedAt;

    [...value].forEach((character, index) => {
        const event = fireKeyAt(target, character, timeStamp);
        if (!event.defaultPrevented) insertCharacter(target, character);
        timeStamp += E81W_EVENT_GAPS_MS[index] ?? 0.3;
    });
    fireKeyAt(target, 'Enter', timeStamp);
    return timeStamp;
};

const setupHumanUser = () => userEvent.setup({ delay: 35 });

describe('Cashier search and cart', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cashierMocks.getItemDetails.mockReset();
        cashierMocks.getItemList.mockReset();
        Object.assign(cashierMocks.session, {
            currentSession: { id: 7, status: 'OPEN' },
            currentStatus: 'ready',
            drawerActionsEnabled: true
        });
    });

    it('waits for a verified open session before enabling search and cart interaction', () => {
        Object.assign(cashierMocks.session, {
            currentSession: null,
            currentStatus: 'ready',
            drawerActionsEnabled: false
        });

        const { rerender } = render(<Cashier />);

        const search = screen.getByRole('textbox', { name: 'SKU atau nama barang' });
        expect(search).toBeDisabled();
        expect(screen.getByText('Buka sesi kas untuk mulai mencari dan menyusun keranjang.')).toBeInTheDocument();
        expect(cashierMocks.getItemList).not.toHaveBeenCalled();
        scanWithObservedE81wTiming(document.body, '8998824554842');
        expect(cashierMocks.getItemDetails).not.toHaveBeenCalled();

        Object.assign(cashierMocks.session, {
            currentSession: { id: 8, status: 'OPEN' },
            currentStatus: 'ready',
            drawerActionsEnabled: true
        });
        rerender(<Cashier />);
        expect(search).toBeEnabled();
        expect(search).toHaveFocus();
    });

    it('shows loading and empty states for a manual SKU or name search', async () => {
        const user = setupHumanUser();
        const request = deferred();
        cashierMocks.getItemList.mockReturnValue(request.promise);
        render(<Cashier />);

        await user.type(screen.getByRole('textbox', { name: 'SKU atau nama barang' }), 'tidak ada');
        await user.click(screen.getByRole('button', { name: 'Cari' }));

        expect(screen.getByRole('status')).toHaveTextContent('Mencari barang...');
        expect(cashierMocks.getItemList).toHaveBeenCalledWith(expect.objectContaining({
            signal: expect.any(AbortSignal),
            params: { page: 1, size: 10, skuOrName: 'tidak ada' }
        }));

        await act(async () => request.resolve(listResponse([])));
        expect(await screen.findByText('Tidak ada barang aktif untuk “tidak ada”.')).toBeInTheDocument();
    });

    it('adds, increments duplicates by one, warns above advisory STORE stock, removes, and restores search focus', async () => {
        const user = setupHumanUser();
        cashierMocks.getItemList.mockResolvedValue(listResponse([item()]));
        render(<Cashier />);

        const search = screen.getByRole('textbox', { name: 'SKU atau nama barang' });
        await user.type(search, 'kain');
        await user.keyboard('{Enter}');
        const addButton = await screen.findByRole('button', { name: 'Tambah Kain katun ke keranjang' });

        await user.click(addButton);
        expect(screen.getByRole('textbox', { name: 'Jumlah Kain katun' })).toHaveValue('1');
        expect(search).toHaveFocus();
        expect(screen.getByText(/jumlah keranjang melebihi informasi stok saat ini/i)).toBeInTheDocument();

        await user.click(addButton);
        expect(screen.getByRole('textbox', { name: 'Jumlah Kain katun' })).toHaveValue('2');
        expect(screen.getByText(/sudah ada; jumlah ditambah 1 meter/i)).toBeInTheDocument();
        expect(search).toHaveFocus();

        const decrementButton = screen.getByRole('button', {
            name: 'Kurangi jumlah Kain katun sebesar 1 meter'
        });
        await user.click(decrementButton);
        expect(screen.getByRole('textbox', { name: 'Jumlah Kain katun' })).toHaveValue('1');
        expect(decrementButton).toBeDisabled();

        await user.click(screen.getByRole('button', {
            name: 'Tambah jumlah Kain katun sebesar 1 meter'
        }));
        expect(screen.getByRole('textbox', { name: 'Jumlah Kain katun' })).toHaveValue('2');
        expect(screen.getByText(/jumlah keranjang melebihi informasi stok saat ini/i)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Hapus Kain katun dari keranjang' }));
        expect(screen.queryByRole('textbox', { name: 'Jumlah Kain katun' })).not.toBeInTheDocument();
        expect(screen.getByText('Cari barang lalu tambahkan ke keranjang')).toBeInTheDocument();
        expect(search).toHaveFocus();
        expect(screen.queryByRole('button', { name: /bayar/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/subtotal/i)).not.toBeInTheDocument();
    });

    it('accepts comma fractions up to four decimals and rejects fractions for whole-unit items', async () => {
        const user = setupHumanUser();
        cashierMocks.getItemList.mockResolvedValue(listResponse([
            item(),
            item({
                sku: 'JARUM-00001',
                name: 'Jarum',
                baseUnitOfMeasure: 'PIECE',
                fractionalQuantityAllowed: false,
                stockStore: '10.0000'
            })
        ]));
        render(<Cashier />);

        await user.type(screen.getByRole('textbox', { name: 'SKU atau nama barang' }), 'barang');
        await user.keyboard('{Enter}');
        await user.click(await screen.findByRole('button', { name: 'Tambah Kain katun ke keranjang' }));
        await user.click(screen.getByRole('button', { name: 'Tambah Jarum ke keranjang' }));

        const fractionalInput = screen.getByRole('textbox', { name: 'Jumlah Kain katun' });
        await user.clear(fractionalInput);
        await user.type(fractionalInput, '1,1250{Enter}');
        expect(fractionalInput).toHaveValue('1.125');
        await user.click(screen.getByRole('button', {
            name: 'Kurangi jumlah Kain katun sebesar 1 meter'
        }));
        expect(fractionalInput).toHaveValue('0.125');
        expect(screen.getByRole('button', {
            name: 'Kurangi jumlah Kain katun sebesar 1 meter'
        })).toBeDisabled();

        const wholeInput = screen.getByRole('textbox', { name: 'Jumlah Jarum' });
        await user.clear(wholeInput);
        await user.type(wholeInput, '1,5{Enter}');
        expect(screen.getByText('Barang ini hanya dapat dijual dalam jumlah utuh.')).toBeInTheDocument();
        expect(wholeInput).toHaveFocus();
    });

    it('marks edited-query results stale and ignores a superseded request', async () => {
        const user = setupHumanUser();
        const olderRequest = deferred();
        const newerRequest = deferred();
        cashierMocks.getItemList
            .mockReturnValueOnce(olderRequest.promise)
            .mockReturnValueOnce(newerRequest.promise);
        render(<Cashier />);

        const search = screen.getByRole('textbox', { name: 'SKU atau nama barang' });
        await user.type(search, 'lama{Enter}');
        await waitFor(() => expect(cashierMocks.getItemList).toHaveBeenCalledTimes(1));
        const olderSignal = cashierMocks.getItemList.mock.calls[0][0].signal;

        await user.clear(search);
        await user.type(search, 'baru{Enter}');
        await waitFor(() => expect(cashierMocks.getItemList).toHaveBeenCalledTimes(2));
        expect(olderSignal.aborted).toBe(true);

        await act(async () => olderRequest.resolve(listResponse([item({ name: 'Hasil lama' })])));
        expect(screen.queryByText('Hasil lama')).not.toBeInTheDocument();

        await act(async () => newerRequest.resolve(listResponse([item({ sku: 'BARU-1', name: 'Hasil baru' })])));
        expect(await screen.findByText('Hasil baru')).toBeInTheDocument();

        await user.type(search, ' berubah');
        expect(screen.getByText(/Hasil ini untuk “baru” dan tidak dapat ditambahkan/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tambah Hasil baru ke keranjang' })).toBeDisabled();
    });

    it('shows an actionable focused search error and retries safely', async () => {
        const user = setupHumanUser();
        cashierMocks.getItemList
            .mockRejectedValueOnce(new Error('Pencarian terputus.'))
            .mockResolvedValueOnce(listResponse([]));
        render(<Cashier />);

        await user.type(screen.getByRole('textbox', { name: 'SKU atau nama barang' }), 'kain{Enter}');
        const error = await screen.findByRole('alert');
        expect(error).toHaveTextContent('Pencarian terputus.');
        expect(error).toHaveFocus();

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByText('Tidak ada barang aktif untuk “kain”.')).toBeInTheDocument();
        expect(cashierMocks.getItemList).toHaveBeenCalledTimes(2);
    });

    it('adds an exact active match from the observed E81W sequence without replacing a manual draft', async () => {
        const user = setupHumanUser();
        const scannedItem = item({ sku: '8998824554842', name: 'Produk pindai' });
        cashierMocks.getItemDetails.mockResolvedValue({ data: { data: scannedItem } });
        render(<Cashier />);

        const search = screen.getByRole('textbox', { name: 'SKU atau nama barang' });
        await user.type(search, 'draft manual');
        search.setSelectionRange(5, 5);

        scanWithObservedE81wTiming(search, scannedItem.sku);

        await waitFor(() => expect(cashierMocks.getItemDetails).toHaveBeenCalledWith(scannedItem.sku));
        expect(cashierMocks.getItemList).not.toHaveBeenCalled();
        expect(await screen.findByRole('textbox', { name: 'Jumlah Produk pindai' })).toHaveValue('1');
        expect(search).toHaveValue('draft manual');
        expect(search).toHaveFocus();
        expect(screen.getByText('Produk pindai ditambahkan ke keranjang.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /bayar/i })).not.toBeInTheDocument();
    });

    it('gives distinct not-found and inactive feedback without adding either scan', async () => {
        cashierMocks.getItemDetails
            .mockRejectedValueOnce({ category: 'not_found', status: 404 })
            .mockResolvedValueOnce({
                data: {
                    data: item({ sku: '2222222222222', name: 'Produk nonaktif', active: false })
                }
            });
        render(<Cashier />);

        const search = screen.getByRole('textbox', { name: 'SKU atau nama barang' });
        scanWithObservedE81wTiming(search, '1111111111111');
        expect(await screen.findByText('Barcode 1111111111111 tidak ditemukan.')).toBeInTheDocument();
        expect(screen.queryByRole('textbox', { name: /Jumlah/i })).not.toBeInTheDocument();

        scanWithObservedE81wTiming(search, '2222222222222', 2_000);
        expect(await screen.findByText(
            'Produk nonaktif ditemukan, tetapi barang tidak aktif dan tidak ditambahkan.'
        )).toBeInTheDocument();
        expect(screen.queryByRole('textbox', { name: /Jumlah/i })).not.toBeInTheDocument();
        expect(search).toHaveFocus();
    });

    it('keeps three rapid duplicate scans separate and applies FE-18 duplicate increments', async () => {
        const scannedItem = item({ sku: '8998824554842', name: 'Produk cepat' });
        cashierMocks.getItemDetails.mockResolvedValue({ data: { data: scannedItem } });
        render(<Cashier />);

        const search = screen.getByRole('textbox', { name: 'SKU atau nama barang' });
        const firstEndedAt = scanWithObservedE81wTiming(search, scannedItem.sku, 1_000);
        const secondEndedAt = scanWithObservedE81wTiming(search, scannedItem.sku, firstEndedAt + 443.197);
        scanWithObservedE81wTiming(search, scannedItem.sku, secondEndedAt + 435.157);

        await waitFor(() => expect(cashierMocks.getItemDetails).toHaveBeenCalledTimes(3));
        expect(await screen.findByRole('textbox', { name: 'Jumlah Produk cepat' })).toHaveValue('3');
        expect(screen.getByText(/sudah ada; jumlah ditambah 1 meter/i)).toBeInTheDocument();
        expect(cashierMocks.getItemList).not.toHaveBeenCalled();
    });

    it('preserves physical scan order when the first distinct-item lookup is slow', async () => {
        const firstRequest = deferred();
        const secondRequest = deferred();
        const firstItem = item({ sku: '1111111111111', name: 'Produk pertama' });
        const secondItem = item({ sku: '2222222222222', name: 'Produk kedua' });
        cashierMocks.getItemDetails
            .mockReturnValueOnce(firstRequest.promise)
            .mockReturnValueOnce(secondRequest.promise);
        render(<Cashier />);

        const search = screen.getByRole('textbox', { name: 'SKU atau nama barang' });
        const firstEndedAt = scanWithObservedE81wTiming(search, firstItem.sku, 1_000);
        scanWithObservedE81wTiming(search, secondItem.sku, firstEndedAt + 443.197);

        await waitFor(() => expect(cashierMocks.getItemDetails).toHaveBeenCalledTimes(1));
        expect(cashierMocks.getItemDetails).toHaveBeenNthCalledWith(1, firstItem.sku);

        await act(async () => firstRequest.resolve({ data: { data: firstItem } }));
        await waitFor(() => expect(cashierMocks.getItemDetails).toHaveBeenCalledTimes(2));
        expect(cashierMocks.getItemDetails).toHaveBeenNthCalledWith(2, secondItem.sku);

        await act(async () => secondRequest.resolve({ data: { data: secondItem } }));
        await screen.findByRole('textbox', { name: 'Jumlah Produk kedua' });
        expect(screen.getAllByRole('button', { name: /Hapus Produk/i })
            .map(button => button.getAttribute('aria-label'))).toEqual([
            'Hapus Produk pertama dari keranjang',
            'Hapus Produk kedua dari keranjang'
        ]);
    });

    it('restores quantity editing when a scan arrives there, then returns focus to search', async () => {
        const firstItem = item({ sku: 'KAIN-00001', name: 'Kain katun' });
        const scannedItem = item({ sku: '8998824554842', name: 'Produk kedua' });
        cashierMocks.getItemList.mockResolvedValue(listResponse([firstItem]));
        cashierMocks.getItemDetails.mockResolvedValue({ data: { data: scannedItem } });
        const user = setupHumanUser();
        render(<Cashier />);

        const search = screen.getByRole('textbox', { name: 'SKU atau nama barang' });
        await user.type(search, 'kain{Enter}');
        await user.click(await screen.findByRole('button', { name: 'Tambah Kain katun ke keranjang' }));
        const quantity = screen.getByRole('textbox', { name: 'Jumlah Kain katun' });
        await user.clear(quantity);
        await user.type(quantity, '2');
        quantity.setSelectionRange(1, 1);

        scanWithObservedE81wTiming(quantity, scannedItem.sku);

        expect(await screen.findByRole('textbox', { name: 'Jumlah Produk kedua' })).toHaveValue('1');
        expect(quantity).toHaveValue('2');
        expect(search).toHaveFocus();
        expect(cashierMocks.getItemList).toHaveBeenCalledTimes(1);
    });
});
