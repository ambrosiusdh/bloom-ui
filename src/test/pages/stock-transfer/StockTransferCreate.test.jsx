import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import StockTransferCreate from '@pages/stock-transfer/StockTransferCreate.jsx';
import useItemStore from '@stores/modules/item.js';
import useStockTransferStore from '@stores/modules/stock-transfer.js';
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

const itemListResponse = (content = [fractionalItem, wholeItem]) => ({
    data: {
        data: {
            content,
            totalElements: content.length,
            totalPages: content.length ? 1 : 0
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

const selectItem = async (user, name = '[KAIN-00001] Kain katun') => {
    await user.click(screen.getByRole('combobox', { name: 'Barang' }));
    await user.click(screen.getByRole('option', { name }));
};

const openConfirmation = async (user, quantity = '1,2500') => {
    await selectItem(user);
    await user.type(screen.getByLabelText('Jumlah transfer'), quantity);
    await user.type(screen.getByLabelText('Keterangan (opsional)'), 'Isi rak toko');
    await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));
    return screen.findByRole('dialog', { name: 'Konfirmasi transfer stok' });
};

describe('StockTransferCreate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useItemStore.setState({ itemList: [], itemPaging: {}, itemDetails: {} });
        useStockTransferStore.setState({ lastCreatedTransfer: null });
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

    it('swaps direction and prevents identical source and destination locations', async () => {
        const user = userEvent.setup();
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });

        expect(screen.getByLabelText('Lokasi asal')).toHaveTextContent('Gudang');
        expect(screen.getByLabelText('Lokasi tujuan')).toHaveTextContent('Toko');
        await user.click(screen.getByRole('button', { name: 'Tukar lokasi asal dan tujuan' }));
        expect(screen.getByLabelText('Lokasi asal')).toHaveTextContent('Toko');
        expect(screen.getByLabelText('Lokasi tujuan')).toHaveTextContent('Gudang');

        await selectItem(user);
        await user.type(screen.getByLabelText('Jumlah transfer'), '1');
        await user.click(screen.getByRole('combobox', { name: 'Lokasi asal' }));
        await user.click(screen.getByRole('option', { name: 'Gudang (WAREHOUSE)' }));
        await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));

        expect(screen.getByText('Lokasi tujuan harus berbeda dari lokasi asal.'))
            .toBeInTheDocument();
        expect(screen.getByLabelText('Lokasi tujuan')).toHaveFocus();
        expect(stockTransferApi.createStockTransfer).not.toHaveBeenCalled();
    });

    it('enforces whole-unit and four-decimal item policies without stock math', async () => {
        const user = userEvent.setup();
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });

        await selectItem(user, '[BENANG-00001] Benang gulung');
        await user.type(screen.getByLabelText('Jumlah transfer'), '1,5');
        await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));
        expect(screen.getByText('Barang ini hanya dapat dipindahkan dalam jumlah utuh.'))
            .toBeInTheDocument();

        await user.clear(screen.getByLabelText('Jumlah transfer'));
        await user.type(screen.getByLabelText('Jumlah transfer'), '1,00001');
        await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));
        expect(screen.getByText('Maksimal 4 angka di belakang tanda desimal.'))
            .toBeInTheDocument();
        expect(stockTransferApi.createStockTransfer).not.toHaveBeenCalled();
    });

    it('confirms one exact decimal request, blocks duplicates, shows the server reference, and refreshes affected data', async () => {
        const user = userEvent.setup();
        const transferRequest = deferred();
        stockTransferApi.createStockTransfer.mockReturnValue(transferRequest.promise);
        render(<StockTransferCreate />, { route: '/stock-transfers/new?itemSku=KAIN-00001' });
        await screen.findByRole('combobox', { name: 'Barang' });

        await user.type(screen.getByLabelText('Jumlah transfer'), '1,2500');
        await user.type(screen.getByLabelText('Keterangan (opsional)'), 'Isi rak toko');
        await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));
        expect(await screen.findByText(/1,25 meter/)).toBeInTheDocument();

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

        await act(async () => transferRequest.resolve({ data: { data: transferResult } }));
        expect(await screen.findByText('Transfer TRF-00042 berhasil.')).toBeInTheDocument();
        expect(screen.getByText(/dipindahkan dari Gudang.*ke Toko/)).toBeInTheDocument();
        expect(screen.getByLabelText('Jumlah transfer')).toHaveValue('');
        await waitFor(() => expect(itemApi.getItemDetails).toHaveBeenCalledWith(
            'KAIN-00001', undefined, undefined
        ));
        expect(itemApi.getItemList).toHaveBeenCalledTimes(2);
    });

    it('preserves input, refreshes stock, and safely retries a conflict with the same key', async () => {
        const user = userEvent.setup();
        const conflict = Object.assign(new Error('Data telah berubah.'), {
            category: 'conflict',
            status: 409,
            validationErrors: []
        });
        stockTransferApi.createStockTransfer
            .mockRejectedValueOnce(conflict)
            .mockResolvedValueOnce({ data: { data: transferResult } });
        render(<StockTransferCreate />, { route: '/stock-transfers/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        await openConfirmation(user);

        await user.click(screen.getByRole('button', { name: 'Pindahkan stok' }));
        const alert = (await screen.findByText(/Stok berubah saat transfer diproses/))
            .closest('[role="alert"]');
        expect(alert).toHaveTextContent('Stok berubah saat transfer diproses.');
        await waitFor(() => expect(alert).toHaveFocus());
        expect(screen.getByLabelText('Jumlah transfer')).toHaveValue('1,2500');
        expect(screen.getByLabelText('Keterangan (opsional)')).toHaveValue('Isi rak toko');
        expect(itemApi.getItemDetails).toHaveBeenCalledWith('KAIN-00001', undefined, undefined);

        const firstRequestKey = stockTransferApi.createStockTransfer.mock.calls[0][1];
        await user.click(screen.getByRole('button', { name: 'Tinjau transfer' }));
        await user.click(screen.getByRole('button', { name: 'Pindahkan stok' }));
        await waitFor(() => expect(stockTransferApi.createStockTransfer).toHaveBeenCalledTimes(2));
        expect(stockTransferApi.createStockTransfer.mock.calls[1][1]).toBe(firstRequestKey);
        expect(await screen.findByText('Transfer TRF-00042 berhasil.')).toBeInTheDocument();
    });
});
