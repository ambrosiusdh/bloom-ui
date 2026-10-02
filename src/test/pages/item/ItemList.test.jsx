import { useNavigate } from 'react-router-dom';
import { describe, beforeEach, expect, it, vi } from 'vitest';

import ItemList from '@pages/item/ItemList.jsx';
import useItemStore from '@stores/modules/item.js';
import { act, fireEvent, render, screen, waitFor } from '@/test/render.jsx';

const itemApi = vi.hoisted(() => ({
    createItem: vi.fn(),
    deactivateItem: vi.fn(),
    downloadBulkBarcodes: vi.fn(),
    getItemAuditLog: vi.fn(),
    getItemDetails: vi.fn(),
    getItemList: vi.fn(),
    updateItem: vi.fn()
}));
const itemCategoryApi = vi.hoisted(() => ({
    createItemCategory: vi.fn(),
    deactivateItemCategory: vi.fn(),
    getItemCategoriesItemCount: vi.fn(),
    getItemCategoryDetails: vi.fn(),
    getItemCategoryList: vi.fn(),
    updateItemCategory: vi.fn()
}));

vi.mock('@api/item.js', () => ({ default: itemApi }));
vi.mock('@api/item-category.js', () => ({ default: itemCategoryApi }));
vi.mock('react-barcode', () => ({
    default: ({ value }) => <div data-testid="barcode-preview">{ value }</div>
}));

const listResponse = (content, paging = {}) => ({
    data: {
        data: {
            content,
            totalElements: paging.totalElements ?? content.length,
            totalPages: paging.totalPages ?? (content.length ? 1 : 0)
        }
    }
});

const deferred = () => {
    let reject;
    let resolve;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        reject = rejectPromise;
        resolve = resolvePromise;
    });
    return {
        promise,
        reject,
        resolve
    };
};

const HistoryBackButton = () => {
    const navigate = useNavigate();
    return <button onClick={ () => navigate(-1) }>Kembali</button>;
};

describe('ItemList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useItemStore.setState({
            itemDetails: {},
            itemList: [],
            itemPaging: {}
        });
        itemCategoryApi.getItemCategoryList.mockResolvedValue(listResponse([]));
    });

    it('shows explicit loading and empty states', async () => {
        const request = deferred();
        itemApi.getItemList.mockReturnValue(request.promise);
        render(<ItemList />, { route: '/items' });

        expect(await screen.findByRole('status')).toHaveTextContent('Memuat barang...');
        await act(async () => request.resolve(listResponse([])));

        expect(await screen.findByText('Belum ada barang aktif')).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: 'Tambah barang' })).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ href: expect.stringContaining('/items/new') })
            ])
        );
    });

    it('shows barcode checkboxes only after entering selection mode', async () => {
        const item = {
            name: 'Kain katun',
            sku: 'KAIN-00001',
            price: '15000',
            stockStore: '2',
            stockWarehouse: '3',
            baseUnitOfMeasure: 'METER',
            fractionalQuantityAllowed: false,
            category: {
                code: 'KAIN',
                name: 'Kain'
            }
        };
        itemApi.getItemList.mockResolvedValue(listResponse([item]));
        render(<ItemList />, { route: '/items' });

        const selectionButton = await screen.findByRole('button', {
            name: 'Pilih untuk cetak'
        });
        await screen.findByText('Kain katun');
        await waitFor(() => expect(selectionButton).toBeEnabled());
        expect(screen.queryByRole('checkbox', {
            name: 'Pilih Kain katun untuk cetak barcode'
        })).not.toBeInTheDocument();

        fireEvent.click(selectionButton);
        const itemCheckbox = screen.getByRole('checkbox', {
            name: 'Pilih Kain katun untuk cetak barcode'
        });
        expect(itemCheckbox).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cetak barcode (0)' })).toBeDisabled();

        fireEvent.click(itemCheckbox);
        expect(screen.getByRole('button', { name: 'Cetak barcode (1)' })).toBeEnabled();

        fireEvent.click(screen.getByRole('button', { name: 'Batal memilih' }));
        expect(screen.queryByRole('checkbox', {
            name: 'Pilih Kain katun untuk cetak barcode'
        })).not.toBeInTheDocument();
    });

    it('shows an actionable error instead of stale item rows when the list read fails', async () => {
        itemApi.getItemList.mockRejectedValue(new Error('Daftar barang gagal dimuat.'));
        render(<ItemList />, { route: '/items' });

        expect(await screen.findByRole('alert')).toHaveTextContent('Daftar barang gagal dimuat.');
        expect(screen.getByText('Data barang belum dapat ditampilkan.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
    });

    it('groups item identity, renders exact server facts, and opens complete detail actions', async () => {
        const item = {
            name: 'Kain katun',
            sku: 'KAIN-00001',
            price: '23456.7500',
            stockQuantity: 999,
            stockStore: '12.5000',
            stockWarehouse: '0.0001',
            baseUnitOfMeasure: 'METER',
            fractionalQuantityAllowed: true,
            active: true,
            updatedAt: '2026-09-23T03:00:00Z',
            updatedBy: 'Admin User',
            category: {
                code: 'KAIN',
                name: 'Kain'
            }
        };
        itemApi.getItemList.mockResolvedValue(listResponse([item]));
        itemApi.getItemDetails.mockResolvedValue({
            data: {
                data: {
                    ...item,
                    baseUnitOfMeasureLocked: true,
                    fractionalQuantityAllowedLocked: true
                }
            }
        });
        render(<ItemList />, { route: '/items' });

        expect(await screen.findByText('12,5 meter')).toBeInTheDocument();
        expect(screen.getByText('0,0001 meter')).toBeInTheDocument();
        expect(screen.getByText('Rp 23.456,75')).toBeInTheDocument();
        expect(screen.getByText('Pecahan diizinkan')).toBeInTheDocument();
        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.queryByText('999')).not.toBeInTheDocument();
        expect(screen.getByRole('table')).toHaveClass('!block', 'lg:!table');
        expect(screen.getByText('Toko · STORE')).toBeInTheDocument();
        expect(screen.getByText('Gudang · WAREHOUSE')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Riwayat stok Kain katun' })).toHaveAttribute(
            'href',
            '/stock-movements?itemSku=KAIN-00001'
        );
        expect(screen.getByRole('button', { name: 'Cetak barcode Kain katun' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Ubah barang Kain katun' })).toHaveAttribute(
            'href',
            '/items/KAIN-00001/edit'
        );
        expect(screen.getByRole('button', { name: 'Nonaktifkan barang Kain katun' })).toBeInTheDocument();

        fireEvent.click(await screen.findByRole('button', { name: 'Kain katun' }));
        expect(await screen.findByText('Terkunci karena sudah ada pergerakan stok')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Riwayat stok' })).toHaveAttribute(
            'href',
            '/stock-movements?itemSku=KAIN-00001'
        );
        expect(screen.getByRole('link', { name: 'Ubah barang' })).toHaveAttribute(
            'href',
            '/items/KAIN-00001/edit'
        );

        fireEvent.click(screen.getByRole('button', { name: 'Barcode' }));
        expect(await screen.findByRole('dialog', { name: /Cetak barcode/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tutup pratinjau barcode' })).toBeInTheDocument();
        expect(itemApi.getItemDetails).toHaveBeenCalledWith(
            'KAIN-00001',
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
            undefined
        );
    });

    it('ignores an older list result after a newer request starts', async () => {
        const olderRequest = deferred();
        const newerRequest = deferred();
        itemApi.getItemList
            .mockReturnValueOnce(olderRequest.promise)
            .mockReturnValueOnce(newerRequest.promise);
        render(<ItemList />, { route: '/items' });

        await waitFor(() => expect(itemApi.getItemList).toHaveBeenCalledTimes(1));
        const oldSignal = itemApi.getItemList.mock.calls[0][0].signal;
        fireEvent.change(await screen.findByRole('searchbox', { name: 'Cari barang' }), {
            target: { value: 'terbaru' }
        });
        await waitFor(() => expect(itemApi.getItemList).toHaveBeenCalledTimes(2));
        expect(oldSignal.aborted).toBe(true);

        await act(async () => newerRequest.resolve(listResponse([{
            name: 'Barang terbaru',
            sku: 'BARANG-00002',
            stockStore: '1',
            stockWarehouse: '0',
            baseUnitOfMeasure: 'PIECE',
            active: true
        }])));
        expect(await screen.findByText('Barang terbaru')).toBeInTheDocument();
        await act(async () => olderRequest.resolve(listResponse([{
            name: 'Barang lama',
            sku: 'BARANG-00001',
            stockStore: '1',
            stockWarehouse: '0',
            baseUnitOfMeasure: 'PIECE',
            active: true
        }])));

        expect(screen.queryByText('Barang lama')).not.toBeInTheDocument();
    });

    it('restores filters and results when browser history changes the URL', async () => {
        itemApi.getItemList.mockImplementation(({ params }) => Promise.resolve(listResponse([{
            name: params.skuOrName === 'KAIN' ? 'Kain' : 'Makanan',
            sku: params.skuOrName === 'KAIN' ? 'KAIN-00001' : 'MAKANAN-00001',
            stockStore: '1',
            stockWarehouse: '0',
            baseUnitOfMeasure: 'PIECE',
            active: true
        }])));
        render(
            <>
                <ItemList />
                <HistoryBackButton />
            </>,
            {
                initialEntries: [
                    '/items?page=1&itemPerPage=10&q=KAIN&category=',
                    '/items?page=1&itemPerPage=10&q=MAKANAN&category='
                ],
                initialIndex: 1
            }
        );

        const searchInput = await screen.findByRole('searchbox', { name: 'Cari barang' });
        expect(searchInput).toHaveValue('MAKANAN');
        expect(await screen.findByText('Makanan')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));

        await waitFor(() => expect(searchInput).toHaveValue('KAIN'));
        expect(await screen.findByText('Kain')).toBeInTheDocument();
        expect(itemApi.getItemList.mock.lastCall[0].params).toMatchObject({ skuOrName: 'KAIN' });
    });

    it('uses the supported combined search and category filters with stable paging context', async () => {
        itemCategoryApi.getItemCategoryList.mockResolvedValue(listResponse([{
            code: 'KAIN',
            name: 'Kain'
        }]));
        itemApi.getItemList.mockResolvedValue(listResponse([{
            name: 'Kain katun',
            sku: 'KAIN-00001',
            price: '15000.0000',
            stockStore: '2',
            stockWarehouse: '3',
            baseUnitOfMeasure: 'METER',
            fractionalQuantityAllowed: false,
            updatedBy: null,
            updatedAt: null,
            category: {
                code: 'KAIN',
                name: 'Kain'
            }
        }], {
            totalElements: 24,
            totalPages: 3
        }));
        render(<ItemList />, { route: '/items' });

        expect(await screen.findByText('Menampilkan 1–1 dari 24 barang aktif')).toBeInTheDocument();
        expect(screen.getByText('Halaman 1 dari 3')).toBeInTheDocument();
        expect(screen.getByText('Belum tersedia')).toBeInTheDocument();
        expect(screen.getByText('Belum diperbarui')).toBeInTheDocument();

        fireEvent.change(screen.getByRole('searchbox', { name: 'Cari barang' }), {
            target: { value: 'katun' }
        });
        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Kategori' }));
        fireEvent.click(await screen.findByRole('option', { name: '[KAIN] Kain' }));

        await waitFor(() => expect(itemApi.getItemList.mock.lastCall[0].params).toMatchObject({
            skuOrName: 'katun',
            category: 'KAIN',
            page: 1,
            size: 10
        }));

        fireEvent.click(screen.getByRole('button', { name: 'Reset filter' }));
        expect(screen.getByRole('searchbox', { name: 'Cari barang' })).toHaveValue('');
        await waitFor(() => expect(itemApi.getItemList.mock.lastCall[0].params).toMatchObject({
            skuOrName: '',
            category: ''
        }));
    });

    it('explains history-preserving deactivation, starts on cancel, and restores trigger focus', async () => {
        const item = {
            name: 'Kain katun',
            sku: 'KAIN-00001',
            price: '15000',
            stockStore: '2',
            stockWarehouse: '3',
            baseUnitOfMeasure: 'METER',
            fractionalQuantityAllowed: false,
            category: {
                code: 'KAIN',
                name: 'Kain'
            }
        };
        itemApi.getItemList.mockResolvedValue(listResponse([item]));
        render(<ItemList />, { route: '/items' });

        const trigger = await screen.findByRole('button', {
            name: 'Nonaktifkan barang Kain katun'
        });
        fireEvent.click(trigger);

        expect(await screen.findByRole('dialog', { name: 'Nonaktifkan Kain katun?' }))
            .toBeInTheDocument();
        expect(screen.getByText(/Riwayat dan saldo barang tidak dihapus/))
            .toBeInTheDocument();
        const cancelButton = screen.getByRole('button', { name: 'Batal' });
        await waitFor(() => expect(cancelButton).toHaveFocus());

        fireEvent.click(cancelButton);
        await waitFor(() => expect(trigger).toHaveFocus());
        expect(itemApi.deactivateItem).not.toHaveBeenCalled();
    });

    it('locks duplicate deactivation, retains failures, and focuses the preserved-history result', async () => {
        const item = {
            name: 'Kain katun',
            sku: 'KAIN-00001',
            price: '15000',
            stockStore: '2',
            stockWarehouse: '3',
            baseUnitOfMeasure: 'METER',
            fractionalQuantityAllowed: false,
            category: {
                code: 'KAIN',
                name: 'Kain'
            }
        };
        const firstRequest = deferred();
        itemApi.getItemList.mockResolvedValue(listResponse([item]));
        itemApi.deactivateItem
            .mockReturnValueOnce(firstRequest.promise)
            .mockResolvedValueOnce({ data: { data: true } });
        render(<ItemList />, { route: '/items' });

        fireEvent.click(await screen.findByRole('button', {
            name: 'Nonaktifkan barang Kain katun'
        }));
        const confirmButton = screen.getByRole('button', { name: 'Nonaktifkan' });
        fireEvent.click(confirmButton);
        fireEvent.click(confirmButton);

        expect(itemApi.deactivateItem).toHaveBeenCalledTimes(1);
        expect(itemApi.deactivateItem).toHaveBeenCalledWith(
            'KAIN-00001',
            { useLoader: false }
        );
        expect(screen.getByRole('button', { name: 'Menonaktifkan...' })).toBeDisabled();

        await act(async () => firstRequest.reject(new Error('Barang gagal dinonaktifkan.')));
        const errorAlert = await screen.findByRole('alert');
        expect(errorAlert).toHaveTextContent('Barang gagal dinonaktifkan.');
        await waitFor(() => expect(errorAlert).toHaveFocus());
        expect(screen.getByRole('dialog', { name: 'Nonaktifkan Kain katun?' }))
            .toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Nonaktifkan' }));
        await waitFor(() => expect(screen.getByRole('alert'))
            .toHaveTextContent('Kain katun berhasil dinonaktifkan'));
        const successAlert = screen.getByRole('alert');
        expect(successAlert).toHaveTextContent('Kain katun berhasil dinonaktifkan');
        expect(successAlert).toHaveTextContent('riwayat dan saldo tidak dihapus');
        await waitFor(() => expect(successAlert).toHaveFocus());
        expect(screen.queryByRole('dialog', { name: 'Nonaktifkan Kain katun?' }))
            .not.toBeInTheDocument();
    });
});
