import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import StockTransferCreate from '@pages/stock-transfer/StockTransferCreate.jsx';
import useAuthStore from '@stores/modules/auth.js';
import useItemStore from '@stores/modules/item.js';
import useStockTransferStore, {
    createStockTransferState,
    STOCK_TRANSFER_STORAGE_KEY
} from '@stores/modules/stock-transfer.js';
import {
    act,
    render,
    screen,
    waitFor
} from '@/test/render.jsx';

const itemApi = vi.hoisted(() => ({
    createItem: vi.fn(),
    deactivateItem: vi.fn(),
    getItemAuditLog: vi.fn(),
    getItemDetails: vi.fn(),
    getItemList: vi.fn(),
    updateItem: vi.fn()
}));

const stockTransferApi = vi.hoisted(() => ({
    createStockTransfer: vi.fn()
}));

vi.mock('@api/item.js', () => ({ default: itemApi }));
vi.mock('@api/stock-transfer.js', () => ({ default: stockTransferApi }));

const fractionalItem = {
    name: 'Kain katun',
    sku: 'KAIN-00001',
    active: true,
    baseUnitOfMeasure: 'METER',
    fractionalQuantityAllowed: true,
    stockStore: '2.0000',
    stockWarehouse: '12.5000'
};

const wholeItem = {
    name: 'Benang gulung',
    sku: 'BENANG-00001',
    active: true,
    baseUnitOfMeasure: 'PIECE',
    fractionalQuantityAllowed: false,
    stockStore: '3.0000',
    stockWarehouse: '9.0000'
};

const itemListResponse = (
    content = [fractionalItem, wholeItem],
    totalPages = content.length ? 1 : 0
) => ({
    data: {
        data: {
            content,
            totalElements: content.length,
            totalPages
        }
    }
});

const itemDetailResponse = item => ({ data: { data: item } });

const transferResult = {
    id: 42,
    code: 'TRF-00042',
    requestKey: 'server-echoed-key',
    sourceLocation: 'WAREHOUSE',
    destinationLocation: 'STORE',
    description: 'Isi rak toko',
    createdBy: 'admin',
    createdAt: '2026-08-25T10:00:00Z',
    lines: [{
        id: 84,
        itemId: 7,
        itemSku: fractionalItem.sku,
        itemName: fractionalItem.name,
        quantity: '1.2500',
        unitOfMeasure: 'METER'
    }]
};

const deferred = () => {
    let reject;
    let resolve;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        reject = rejectPromise;
        resolve = resolvePromise;
    });
    return { promise, reject, resolve };
};

const selectItem = async (user, sku = 'KAIN-00001') => {
    const itemSelector = screen.getByRole('combobox', { name: 'Barang' });

    await waitFor(
        () => expect(itemSelector).toBeEnabled(),
        { timeout: 3000 }
    );
    await user.clear(itemSelector);
    await user.type(itemSelector, sku);
    await user.click(await screen.findByRole('option', { name: new RegExp(sku, 'i') }));
};

const getQuantityField = () => screen.getByRole('textbox', { name: 'Jumlah transfer' });

const openConfirmation = async (user, quantity = '1,2500') => {
    await selectItem(user);
    await user.type(getQuantityField(), quantity);
    await user.type(screen.getByLabelText('Keterangan (opsional)'), 'Isi rak toko');
    await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));
    return screen.findByRole('dialog', { name: 'Konfirmasi transfer stok' });
};

describe('StockTransferCreate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        useAuthStore.setState({
            authStatus: 'authenticated',
            currentUser: {
                accountId: '101',
                username: 'admin'
            }
        });
        useItemStore.setState({ itemList: [], itemPaging: {}, itemDetails: {} });
        useStockTransferStore.setState(createStockTransferState());
        itemApi.getItemList.mockResolvedValue(itemListResponse());
        itemApi.getItemDetails.mockResolvedValue(itemDetailResponse(fractionalItem));
    });

    it('shows loading, focuses item-load errors, and recovers through retry', async () => {
        const user = userEvent.setup();
        const firstRequest = deferred();
        itemApi.getItemList
            .mockReturnValueOnce(firstRequest.promise)
            .mockResolvedValueOnce(itemListResponse([]));
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });

        expect(await screen.findByRole('status')).toHaveTextContent('Memuat barang aktif...');
        await act(async () => firstRequest.reject(new Error('Barang gagal dimuat.')));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Barang gagal dimuat.');
        await waitFor(() => expect(alert).toHaveFocus());
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect(await screen.findByText('Belum ada barang aktif yang dapat ditransfer.'))
            .toBeInTheDocument();
        expect(itemApi.getItemList).toHaveBeenCalledTimes(2);
    });

    it('keeps locations opposite when either side changes and swaps the direction', async () => {
        const user = userEvent.setup();
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });

        expect(screen.getByLabelText('Lokasi asal')).toHaveTextContent('Gudang');
        expect(screen.getByLabelText('Lokasi tujuan')).toHaveTextContent('Toko');

        await user.click(screen.getByRole('combobox', { name: 'Lokasi asal' }));
        await user.click(screen.getByRole('option', { name: 'Toko (STORE)' }));
        expect(screen.getByLabelText('Lokasi asal')).toHaveTextContent('Toko');
        expect(screen.getByLabelText('Lokasi tujuan')).toHaveTextContent('Gudang');

        await user.click(screen.getByRole('button', { name: 'Tukar lokasi asal dan tujuan' }));
        expect(screen.getByLabelText('Lokasi asal')).toHaveTextContent('Gudang');
        expect(screen.getByLabelText('Lokasi tujuan')).toHaveTextContent('Toko');

        await user.click(screen.getByRole('combobox', { name: 'Lokasi tujuan' }));
        await user.click(screen.getByRole('option', { name: 'Gudang (WAREHOUSE)' }));
        expect(screen.getByLabelText('Lokasi asal')).toHaveTextContent('Toko');
        expect(screen.getByLabelText('Lokasi tujuan')).toHaveTextContent('Gudang');

        await selectItem(user);
        await user.type(getQuantityField(), '1');
        await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));

        expect(await screen.findByRole('dialog', { name: 'Konfirmasi transfer stok' }))
            .toHaveTextContent(/Toko \(STORE\).*Gudang \(WAREHOUSE\)/s);
    });

    it('loads every active item page and supports keyboard-first name or SKU search', async () => {
        const user = userEvent.setup();
        itemApi.getItemList
            .mockResolvedValueOnce(itemListResponse([fractionalItem], 2))
            .mockResolvedValueOnce(itemListResponse([wholeItem], 2));

        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        const itemSelector = await screen.findByRole('combobox', { name: 'Barang' });
        await user.type(itemSelector, 'benang');

        const option = await screen.findByRole('option', { name: /BENANG-00001/i });
        expect(option).toHaveTextContent('Benang gulung');
        expect(option).toHaveTextContent('Jumlah utuh');
        expect(option).toHaveTextContent('Toko 3 pcs');
        await user.keyboard('{ArrowDown}{Enter}');

        expect(itemSelector).toHaveValue('BENANG-00001 · Benang gulung');
        expect(itemApi.getItemList).toHaveBeenNthCalledWith(1, {
            signal: expect.any(AbortSignal),
            params: {
                page: 1,
                size: 100,
                isRemoved: false
            }
        }, { useLoader: false });
        expect(itemApi.getItemList).toHaveBeenNthCalledWith(2, {
            signal: expect.any(AbortSignal),
            params: {
                page: 2,
                size: 100,
                isRemoved: false
            }
        }, { useLoader: false });
    });

    it('uses roomier responsive spacing around the transfer controls', async () => {
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });

        const form = screen.getByRole('button', { name: 'Tinjau transfer' }).closest('form');
        expect(form).toHaveClass('p-5', 'md:p-6');
        expect(form.querySelector('fieldset')).not.toHaveClass('space-y-6');
        expect(form.querySelector('.stock-transfer-create__fields'))
            .toHaveClass('flex', 'flex-col', 'gap-6');
    });

    it('puts visible keyboard focus on the item selector after required validation fails', async () => {
        const user = userEvent.setup();
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        const itemSelector = await screen.findByRole('combobox', { name: 'Barang' });

        await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));

        expect(screen.getByText('Barang wajib dipilih.')).toBeInTheDocument();
        expect(itemSelector).toHaveFocus();
    });

    it('enforces whole-unit and four-decimal item policies without stock math', async () => {
        const user = userEvent.setup();
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });

        await selectItem(user, 'BENANG-00001');
        await user.type(getQuantityField(), '1,5');
        await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));
        expect(screen.getByText('Barang ini hanya dapat dipindahkan dalam jumlah utuh.'))
            .toBeInTheDocument();

        await user.clear(getQuantityField());
        await user.type(getQuantityField(), '1,00001');
        await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));
        expect(screen.getByText('Maksimal 4 angka di belakang tanda desimal.'))
            .toBeInTheDocument();
        expect(stockTransferApi.createStockTransfer).not.toHaveBeenCalled();
    });

    it('starts confirmation on cancel and restores review focus after Escape', async () => {
        const user = userEvent.setup();
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        await openConfirmation(user);

        expect(screen.getByRole('button', { name: 'Batal' })).toHaveFocus();
        await user.keyboard('{Escape}');

        expect(screen.queryByRole('dialog', { name: 'Konfirmasi transfer stok' }))
            .not.toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole('button', {
            name: 'Tinjau transfer'
        })).toHaveFocus());
    });

    it('confirms one exact decimal request, blocks duplicates, shows the server reference, and refreshes affected data', async () => {
        const user = userEvent.setup();
        const transferRequest = deferred();
        stockTransferApi.createStockTransfer.mockReturnValue(transferRequest.promise);
        render(<StockTransferCreate />, { route: '/stock-transfers/new?itemSku=KAIN-00001' });
        await screen.findByRole('combobox', { name: 'Barang' });

        await user.type(getQuantityField(), '1,2500');
        await user.type(screen.getByLabelText('Keterangan (opsional)'), 'Isi rak toko');
        await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));
        const confirmation = await screen.findByRole('dialog', {
            name: 'Konfirmasi transfer stok'
        });
        expect(confirmation).toHaveTextContent('Kain katun');
        expect(confirmation).toHaveTextContent('KAIN-00001');
        expect(confirmation).toHaveTextContent('1,25 meter');
        expect(confirmation).toHaveTextContent('12,5 meter');
        expect(confirmation).toHaveTextContent('Isi rak toko');
        expect(screen.getByRole('button', { name: 'Batal' })).toHaveFocus();

        await user.dblClick(screen.getByRole('button', { name: 'Pindahkan stok' }));
        expect(stockTransferApi.createStockTransfer).toHaveBeenCalledTimes(1);
        expect(stockTransferApi.createStockTransfer).toHaveBeenCalledWith({
            data: {
                sourceLocation: 'WAREHOUSE',
                destinationLocation: 'STORE',
                description: 'Isi rak toko',
                lines: [{
                    itemSku: 'KAIN-00001',
                    quantity: '1.2500',
                    unitOfMeasure: 'METER'
                }]
            }
        }, expect.stringMatching(/^stock-transfer-/), undefined);
        expect(screen.getByRole('button', { name: 'Memindahkan...' })).toBeDisabled();
        expect(screen.getByRole('group', {
            name: 'Data transfer stok',
            hidden: true
        })).toBeDisabled();

        const requestKey = stockTransferApi.createStockTransfer.mock.calls[0][1];
        await act(async () => transferRequest.resolve({
            data: {
                data: {
                    ...transferResult,
                    requestKey
                }
            }
        }));
        expect(await screen.findByText('Transfer TRF-00042 berhasil.')).toBeInTheDocument();
        const resultPanel = screen.getByRole('region', { name: 'Hasil transfer stok' });
        expect(resultPanel).toHaveTextContent('Kain katun · KAIN-00001');
        expect(resultPanel).toHaveTextContent('1,25 meter');
        expect(resultPanel).toHaveTextContent('Gudang (WAREHOUSE)');
        expect(resultPanel).toHaveTextContent('Toko (STORE)');
        expect(resultPanel).toHaveTextContent('admin');
        expect(screen.getByRole('link', { name: 'Buka pergerakan stok' }))
            .toHaveAttribute('href', '/stock-movements?itemSku=KAIN-00001');
        expect(screen.queryByRole('group', { name: 'Data transfer stok' }))
            .not.toBeInTheDocument();
        await waitFor(() => expect(itemApi.getItemDetails).toHaveBeenCalledWith(
            'KAIN-00001', undefined, undefined
        ));
        expect(itemApi.getItemList).toHaveBeenCalledTimes(2);
    });

    it('keeps a known rejection editable, refreshes availability, and focuses guidance', async () => {
        const user = userEvent.setup();
        stockTransferApi.createStockTransfer.mockRejectedValueOnce(Object.assign(
            new Error('Insufficient stock'),
            {
                category: 'request',
                status: 400,
                validationErrors: []
            }
        ));
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        await openConfirmation(user, '999');

        await user.click(screen.getByRole('button', { name: 'Pindahkan stok' }));

        const alert = (await screen.findByText(/Transfer ditolak server/))
            .closest('[role="alert"]');
        await waitFor(() => expect(alert).toHaveFocus());
        expect(getQuantityField()).toHaveValue('999');
        expect(screen.getByLabelText('Keterangan (opsional)')).toHaveValue('Isi rak toko');
        expect(screen.getByRole('group', { name: 'Data transfer stok' })).not.toBeDisabled();
        expect(useStockTransferStore.getState()).toMatchObject({
            stockTransferAttempt: null,
            stockTransferCreateStatus: 'error'
        });
        expect(itemApi.getItemDetails).toHaveBeenCalledWith(
            'KAIN-00001',
            undefined,
            undefined
        );
        expect(itemApi.getItemList).toHaveBeenCalledTimes(2);
    });

    it('reloads all availability data without changing the transfer intent', async () => {
        const user = userEvent.setup();
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        await selectItem(user);
        await user.type(getQuantityField(), '2');

        await user.click(screen.getByRole('button', { name: 'Muat ulang stok' }));

        await waitFor(() => expect(itemApi.getItemList).toHaveBeenCalledTimes(2));
        expect(screen.getByRole('combobox', { name: 'Barang' }))
            .toHaveValue('KAIN-00001 · Kain katun');
        expect(getQuantityField()).toHaveValue('2');
    });

    it('persists an uncertain request, locks editing, and reconciles after reload with the same key', async () => {
        const user = userEvent.setup();
        const uncertain = Object.assign(new Error('Koneksi terputus.'), {
            category: 'network',
            status: null,
            validationErrors: []
        });
        stockTransferApi.createStockTransfer.mockRejectedValueOnce(uncertain);
        const view = render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        await openConfirmation(user);

        await user.click(screen.getByRole('button', { name: 'Pindahkan stok' }));
        const alert = (await screen.findByText(/Hasil transfer belum dapat dipastikan/))
            .closest('[role="alert"]');
        expect(alert).toHaveTextContent('Formulir dikunci');
        await waitFor(() => expect(alert).toHaveFocus());
        const recoveryPanel = screen.getByRole('region', {
            name: 'Permintaan transfer yang dikunci'
        });
        expect(recoveryPanel).toHaveTextContent('Kain katun · KAIN-00001');
        expect(recoveryPanel).toHaveTextContent('1,25 meter');
        expect(recoveryPanel).toHaveTextContent('Isi rak toko');
        expect(screen.queryByRole('group', { name: 'Data transfer stok' }))
            .not.toBeInTheDocument();

        const durableState = sessionStorage.getItem(STOCK_TRANSFER_STORAGE_KEY);
        const firstPayload = stockTransferApi.createStockTransfer.mock.calls[0][0];
        const firstRequestKey = stockTransferApi.createStockTransfer.mock.calls[0][1];
        expect(JSON.parse(durableState).state.stockTransferAttempt).toEqual({
            ownerAccountId: '101',
            key: firstRequestKey,
            request: firstPayload.data
        });

        view.unmount();
        useStockTransferStore.setState(createStockTransferState());
        sessionStorage.setItem(STOCK_TRANSFER_STORAGE_KEY, durableState);
        await useStockTransferStore.persist.rehydrate();
        stockTransferApi.createStockTransfer.mockImplementationOnce((payload, requestKey) =>
            Promise.resolve({
                data: {
                    data: {
                        ...transferResult,
                        requestKey
                    }
                }
            }));

        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        const recoveryAction = await screen.findByRole('button', {
            name: 'Periksa hasil transfer'
        });
        await user.click(recoveryAction);

        await waitFor(() => expect(stockTransferApi.createStockTransfer).toHaveBeenCalledTimes(2));
        expect(stockTransferApi.createStockTransfer.mock.calls[1][0]).toEqual(firstPayload);
        expect(stockTransferApi.createStockTransfer.mock.calls[1][1]).toBe(firstRequestKey);
        expect(await screen.findByText('Transfer TRF-00042 berhasil.')).toBeInTheDocument();
    });

    it('fails closed when the retained idempotency key conflicts with the server', async () => {
        const user = userEvent.setup();
        stockTransferApi.createStockTransfer.mockRejectedValueOnce(Object.assign(
            new Error('Idempotency conflict'),
            {
                category: 'conflict',
                status: 409,
                validationErrors: []
            }
        ));
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        await openConfirmation(user);

        await user.click(screen.getByRole('button', { name: 'Pindahkan stok' }));

        const alert = (await screen.findByText(/bertentangan dengan catatan server/))
            .closest('[role="alert"]');
        await waitFor(() => expect(alert).toHaveFocus());
        expect(screen.getByRole('region', {
            name: 'Permintaan transfer yang dikunci'
        })).toHaveTextContent('KAIN-00001');
        expect(screen.queryByRole('button', { name: 'Periksa hasil transfer' }))
            .not.toBeInTheDocument();
        expect(screen.queryByRole('group', { name: 'Data transfer stok' }))
            .not.toBeInTheDocument();
        expect(useStockTransferStore.getState()).toMatchObject({
            stockTransferCreateStatus: 'key_conflict'
        });
    });

    it('quarantines another account recovery state without exposing its transfer facts', async () => {
        useStockTransferStore.setState({
            ...createStockTransferState('101'),
            stockTransferAttempt: {
                ownerAccountId: '101',
                key: 'stock-transfer-owner-101',
                request: {
                    sourceLocation: 'WAREHOUSE',
                    destinationLocation: 'STORE',
                    description: 'Rahasia akun asal',
                    lines: [{
                        itemSku: 'KAIN-00001',
                        quantity: '1.2500',
                        unitOfMeasure: 'METER'
                    }]
                }
            },
            stockTransferCreateStatus: 'uncertain'
        });
        useAuthStore.setState({
            authStatus: 'authenticated',
            currentUser: {
                accountId: '202',
                username: 'operator-lain'
            }
        });

        render(<StockTransferCreate />, { route: '/stock-transfers/new' });

        expect(await screen.findByText(/pemulihan transfer milik akun lain/i))
            .toBeInTheDocument();
        expect(screen.queryByText('Rahasia akun asal')).not.toBeInTheDocument();
        expect(screen.queryByRole('group', { name: 'Data transfer stok' }))
            .not.toBeInTheDocument();
        expect(stockTransferApi.createStockTransfer).not.toHaveBeenCalled();
    });

    it('does not post when durable recovery storage is unavailable', async () => {
        const user = userEvent.setup();
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        await openConfirmation(user);
        const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
            .mockImplementation(() => {
                throw new Error('Storage blocked');
            });

        await user.click(screen.getByRole('button', { name: 'Pindahkan stok' }));

        expect(await screen.findByText(/Pemulihan transfer tidak dapat disimpan/))
            .toBeInTheDocument();
        expect(stockTransferApi.createStockTransfer).not.toHaveBeenCalled();
        expect(useStockTransferStore.getState()).toMatchObject({
            stockTransferAttempt: null,
            stockTransferCreateStatus: 'storage_error'
        });
        storageSpy.mockRestore();
    });
});
