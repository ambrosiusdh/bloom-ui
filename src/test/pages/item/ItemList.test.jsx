import { useNavigate } from 'react-router-dom';
import { describe, beforeEach, expect, it, vi } from 'vitest';

import ItemList from '@pages/item/ItemList.jsx';
import useItemStore from '@stores/modules/item.js';
import { act, fireEvent, render, screen, waitFor } from '@/test/render.jsx';

const itemApi = vi.hoisted(() => ({
    createItem: vi.fn(),
    deactivateItem: vi.fn(),
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

const listResponse = content => ({
    data: {
        data: {
            content,
            totalElements: content.length,
            totalPages: content.length ? 1 : 0
        }
    }
});

const deferred = () => {
    let resolve;
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
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
        expect(screen.getByRole('link', { name: 'Buat barang' })).toHaveAttribute('href', '/items/new');
    });

    it('shows an actionable error instead of stale item rows when the list read fails', async () => {
        itemApi.getItemList.mockRejectedValue(new Error('Daftar barang gagal dimuat.'));
        render(<ItemList />, { route: '/items' });

        expect(await screen.findByRole('alert')).toHaveTextContent('Daftar barang gagal dimuat.');
        expect(screen.getByText('Data barang belum dapat ditampilkan.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
    });

    it('uses location stock fields and fetches a complete detail response', async () => {
        const item = {
            name: 'Kain katun',
            sku: 'KAIN-00001',
            price: 15000,
            stockQuantity: 999,
            stockStore: '12.5000',
            stockWarehouse: '0.0001',
            baseUnitOfMeasure: 'METER',
            fractionalQuantityAllowed: true,
            active: true,
            category: { name: 'Kain' }
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
        expect(screen.queryByText('999')).not.toBeInTheDocument();

        await screen.findByLabelText('Lihat detail Kain katun').then(row => row.click());
        expect(await screen.findByText('Terkunci karena sudah ada pergerakan stok')).toBeInTheDocument();
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
        fireEvent.change(await screen.findByRole('textbox', { name: 'Cari berdasarkan Nama barang' }), {
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
            name: params.name === 'KAIN' ? 'Kain' : 'Makanan',
            sku: params.name === 'KAIN' ? 'KAIN-00001' : 'MAKANAN-00001',
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
                    '/items?page=1&itemPerPage=10&key=name&q=KAIN',
                    '/items?page=1&itemPerPage=10&key=name&q=MAKANAN'
                ],
                initialIndex: 1
            }
        );

        const searchInput = await screen.findByRole('textbox', { name: 'Cari berdasarkan Nama barang' });
        expect(searchInput).toHaveValue('MAKANAN');
        expect(await screen.findByText('Makanan')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));

        await waitFor(() => expect(searchInput).toHaveValue('KAIN'));
        expect(await screen.findByText('Kain')).toBeInTheDocument();
        expect(itemApi.getItemList.mock.lastCall[0].params).toMatchObject({ name: 'KAIN' });
    });
});
