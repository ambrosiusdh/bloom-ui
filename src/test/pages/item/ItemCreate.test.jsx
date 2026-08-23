import { Route, Routes, useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ItemCreate from '@pages/item/ItemCreate.jsx';
import useItemCategoryStore from '@stores/modules/item-category.js';
import useItemStore from '@stores/modules/item.js';
import {
    act,
    fireEvent,
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

const categoriesResponse = content => ({
    data: {
        data: {
            content,
            totalElements: content.length,
            totalPages: content.length ? 1 : 0
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
    return { promise, reject, resolve };
};

const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location">{ location.pathname }{ location.search }</div>;
};

const selectCategory = async user => {
    await waitFor(() => expect(itemCategoryApi.getItemCategoryList).toHaveBeenCalled());
    await user.click(screen.getByRole('combobox', { name: 'Kategori barang' }));
    await user.click(screen.getByRole('option', { name: '[KAIN] Kain' }));
};

const fillRequiredFields = async user => {
    await user.type(screen.getByLabelText('Nama barang'), 'Kain katun');
    await selectCategory(user);
    await user.type(screen.getByLabelText('Harga jual'), '15000,5000');
};

describe('ItemCreate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useItemStore.setState({ itemDetails: {}, itemList: [], itemPaging: {} });
        useItemCategoryStore.setState({
            itemCategoryDetails: {},
            itemCategoryList: [],
            itemCategoryPaging: {}
        });
        itemCategoryApi.getItemCategoryList.mockResolvedValue(categoriesResponse([
            { code: 'KAIN', name: 'Kain' }
        ]));
    });

    it('shows category loading and empty recovery states', async () => {
        const request = deferred();
        itemCategoryApi.getItemCategoryList.mockReturnValue(request.promise);
        render(<ItemCreate />, { route: '/items/new' });

        expect(await screen.findByRole('status')).toHaveTextContent('Memuat kategori aktif...');
        await act(async () => request.resolve(categoriesResponse([])));

        expect(await screen.findByText('Belum ada kategori aktif. Barang belum dapat dibuat.'))
            .toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Buat kategori' })).toBeInTheDocument();
    });

    it('focuses a category load error and retries it', async () => {
        const user = userEvent.setup();
        itemCategoryApi.getItemCategoryList
            .mockRejectedValueOnce(new Error('Kategori gagal dimuat.'))
            .mockResolvedValueOnce(categoriesResponse([{ code: 'KAIN', name: 'Kain' }]));
        render(<ItemCreate />, { route: '/items/new' });

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Kategori gagal dimuat.');
        await waitFor(() => expect(alert).toHaveFocus());
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        await waitFor(() => expect(itemCategoryApi.getItemCategoryList).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.queryByText('Kategori gagal dimuat.')).not.toBeInTheDocument());
    });

    it('validates required and whole-unit opening fields and focuses the first error', async () => {
        const user = userEvent.setup();
        render(<ItemCreate />, { route: '/items/new' });

        await user.click(screen.getByRole('button', { name: 'Buat barang' }));
        expect(screen.getByLabelText('Nama barang')).toHaveFocus();
        expect(screen.getByText('Nama barang wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Kategori barang wajib dipilih.')).toBeInTheDocument();
        expect(screen.getByText('Nilai wajib diisi.')).toBeInTheDocument();

        await fillRequiredFields(user);
        await user.type(screen.getByLabelText('Stok awal STORE'), '1,5');
        await user.click(screen.getByRole('button', { name: 'Buat barang' }));

        expect(screen.getByText('Barang satuan utuh hanya menerima jumlah tanpa pecahan.'))
            .toBeInTheDocument();
        expect(screen.getByLabelText('Stok awal STORE')).toHaveFocus();
        expect(itemApi.createItem).not.toHaveBeenCalled();

        await user.click(screen.getByRole('checkbox', { name: 'Izinkan jumlah pecahan' }));
        await user.clear(screen.getByLabelText('Stok awal STORE'));
        await user.type(screen.getByLabelText('Stok awal STORE'), '1,25000');
        await user.click(screen.getByRole('button', { name: 'Buat barang' }));
        expect(screen.getByText('Maksimal 4 angka di belakang tanda desimal.'))
            .toBeInTheDocument();
        expect(itemApi.createItem).not.toHaveBeenCalled();
    });

    it('submits exact decimal strings atomically and blocks duplicate clicks while pending', async () => {
        const user = userEvent.setup();
        const createRequest = deferred();
        itemApi.createItem.mockReturnValue(createRequest.promise);
        render(<ItemCreate />, { route: '/items/new' });

        await fillRequiredFields(user);
        await user.click(screen.getByRole('combobox', { name: 'Satuan dasar (UOM)' }));
        await user.click(screen.getByRole('option', { name: 'Meter' }));
        await user.click(screen.getByRole('checkbox', { name: 'Izinkan jumlah pecahan' }));
        await user.type(screen.getByLabelText('Stok awal STORE'), '1,2500');
        await user.type(screen.getByLabelText('Stok awal WAREHOUSE'), '2.0001');
        await user.dblClick(screen.getByRole('button', { name: 'Buat barang' }));

        expect(itemApi.createItem).toHaveBeenCalledTimes(1);
        expect(itemApi.createItem).toHaveBeenCalledWith({
            data: {
                name: 'Kain katun',
                categoryCode: 'KAIN',
                description: '',
                price: '15000.5000',
                baseUnitOfMeasure: 'METER',
                fractionalQuantityAllowed: true,
                stockStore: '1.2500',
                stockWarehouse: '2.0001'
            }
        }, undefined);
        expect(screen.getByRole('button', { name: /Menyimpan/ })).toBeDisabled();
        expect(screen.getByLabelText('Nama barang')).toBeDisabled();

        await act(async () => createRequest.reject(Object.assign(new Error('Data berkonflik.'), {
            category: 'conflict',
            validationErrors: []
        })));
    });

    it('preserves all input and focuses an accessible conflict message after failure', async () => {
        const user = userEvent.setup();
        itemApi.createItem.mockRejectedValue(Object.assign(new Error('Data telah berubah.'), {
            category: 'conflict',
            validationErrors: []
        }));
        render(<ItemCreate />, { route: '/items/new' });

        await fillRequiredFields(user);
        await user.click(screen.getByLabelText('Buat SKU otomatis'));
        await user.type(screen.getByLabelText('SKU'), 'KAIN-MANUAL');
        await user.type(screen.getByLabelText('Deskripsi barang (opsional)'), 'Input tetap ada');
        await user.click(screen.getByRole('button', { name: 'Buat barang' }));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('datanya berkonflik');
        await waitFor(() => expect(alert).toHaveFocus());
        expect(screen.getByLabelText('Nama barang')).toHaveValue('Kain katun');
        expect(screen.getByLabelText('SKU')).toHaveValue('KAIN-MANUAL');
        expect(screen.getByLabelText('Deskripsi barang (opsional)')).toHaveValue('Input tetap ada');
    });

    it('maps backend field validation without losing input and focuses that field', async () => {
        const user = userEvent.setup();
        itemApi.createItem.mockRejectedValue(Object.assign(new Error('Masukan tidak valid.'), {
            category: 'validation',
            validationErrors: [{ field: 'stockStore', message: 'Jumlah stok tidak valid.' }]
        }));
        render(<ItemCreate />, { route: '/items/new' });

        await fillRequiredFields(user);
        fireEvent.change(screen.getByLabelText('Stok awal STORE'), {
            target: { value: '2' }
        });
        await user.click(screen.getByRole('button', { name: 'Buat barang' }));

        expect(await screen.findByText('Jumlah stok tidak valid.')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByLabelText('Stok awal STORE')).toHaveFocus());
        expect(screen.getByLabelText('Stok awal STORE')).toHaveValue('2');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('navigates with the backend-confirmed SKU after success', async () => {
        const user = userEvent.setup();
        itemApi.createItem.mockResolvedValue({
            data: { data: { sku: 'KAIN-00042' } }
        });
        render(
            <Routes>
                <Route path="/items/new" element={ <ItemCreate /> } />
                <Route path="/items" element={ <LocationDisplay /> } />
            </Routes>,
            { route: '/items/new' }
        );

        await fillRequiredFields(user);
        await user.click(screen.getByRole('button', { name: 'Buat barang' }));

        await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/items?'));
        expect(screen.getByTestId('location')).toHaveTextContent('KAIN-00042');
        expect(itemApi.createItem.mock.lastCall[0].data).not.toHaveProperty('stockStore');
        expect(itemApi.createItem.mock.lastCall[0].data).not.toHaveProperty('stockWarehouse');
    });
});
