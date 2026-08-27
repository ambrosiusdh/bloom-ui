import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cashierMocks = vi.hoisted(() => ({
    getItemList: vi.fn(),
    setBreadcrumbs: vi.fn(),
    session: {
        currentSession: { id: 7, status: 'OPEN' },
        currentStatus: 'ready',
        drawerActionsEnabled: true
    }
}));

vi.mock('@api/item.js', () => ({
    default: { getItemList: cashierMocks.getItemList }
}));
vi.mock('@components/cash-session/CurrentCashSession.jsx', () => ({
    default: () => <div data-testid="current-cash-session">Sesi kas</div>
}));
vi.mock('@stores/index.js', () => ({
    useBreadcrumbStore: selector => selector({ setBreadcrumbs: cashierMocks.setBreadcrumbs }),
    useCashSessionStore: selector => selector(cashierMocks.session)
}));

import Cashier from '@/pages/cashier/Cashier.jsx';
import { render, screen, waitFor } from '@/test/render.jsx';

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

describe('Cashier search and cart', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
        const user = userEvent.setup();
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
        const user = userEvent.setup();
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
        const user = userEvent.setup();
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
        const user = userEvent.setup();
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
        const user = userEvent.setup();
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
});
