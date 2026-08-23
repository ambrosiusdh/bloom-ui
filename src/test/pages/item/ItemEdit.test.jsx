import { Route, Routes, useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ItemEdit from '@pages/item/ItemEdit.jsx';
import useItemStore from '@stores/modules/item.js';
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

vi.mock('@api/item.js', () => ({ default: itemApi }));

const baseItem = {
    sku: 'KAIN-00001',
    name: 'Kain katun',
    description: 'Kain lembut',
    price: '15000.5000',
    baseUnitOfMeasure: 'METER',
    fractionalQuantityAllowed: true,
    stockStore: '10.0000',
    stockWarehouse: '4.0000',
    active: true,
    baseUnitOfMeasureLocked: false,
    fractionalQuantityAllowedLocked: false,
    category: { code: 'KAIN', name: 'Kain' }
};

const apiResponse = item => ({ data: { data: item } });

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

const renderEdit = () => render(
    <Routes>
        <Route path="/items/:sku/edit" element={ <ItemEdit /> } />
        <Route path="/items" element={ <LocationDisplay /> } />
    </Routes>,
    { route: '/items/KAIN-00001/edit' }
);

describe('ItemEdit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useItemStore.setState({ itemDetails: {}, itemList: [], itemPaging: {} });
        itemApi.getItemDetails.mockResolvedValue(apiResponse(baseItem));
    });

    it('shows loading and retry states and refuses to infer missing lock flags', async () => {
        const user = userEvent.setup();
        const request = deferred();
        itemApi.getItemDetails.mockReturnValueOnce(request.promise);
        renderEdit();

        expect(await screen.findByRole('status')).toHaveTextContent('Memuat data barang...');
        await act(async () => request.resolve(apiResponse({
            ...baseItem,
            baseUnitOfMeasureLocked: undefined
        })));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('belum memberikan status kunci');
        await waitFor(() => expect(alert).toHaveFocus());

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByRole('heading', { name: 'Ubah barang KAIN-00001' }))
            .toBeInTheDocument();
        expect(itemApi.getItemDetails).toHaveBeenCalledTimes(2);
    });

    it('submits editable metadata and unlocked semantics without any stock fields once', async () => {
        const user = userEvent.setup();
        const updateRequest = deferred();
        itemApi.updateItem.mockReturnValue(updateRequest.promise);
        renderEdit();

        await screen.findByRole('heading', { name: 'Ubah barang KAIN-00001' });
        expect(screen.queryByLabelText(/Stok (STORE|WAREHOUSE)/i)).not.toBeInTheDocument();

        await user.clear(screen.getByLabelText('Nama barang'));
        await user.type(screen.getByLabelText('Nama barang'), 'Kain katun premium');
        await user.click(screen.getByRole('combobox', { name: 'Satuan dasar (UOM)' }));
        await user.click(screen.getByRole('option', { name: 'Liter' }));
        await user.click(screen.getByRole('checkbox', { name: 'Izinkan jumlah pecahan' }));
        await user.dblClick(screen.getByRole('button', { name: 'Simpan perubahan' }));

        expect(itemApi.updateItem).toHaveBeenCalledTimes(1);
        expect(itemApi.updateItem).toHaveBeenCalledWith('KAIN-00001', {
            data: {
                name: 'Kain katun premium',
                sku: 'KAIN-00001',
                description: 'Kain lembut',
                price: '15000.5000',
                baseUnitOfMeasure: 'LITER',
                fractionalQuantityAllowed: false
            }
        }, undefined);
        expect(itemApi.updateItem.mock.lastCall[1].data).not.toHaveProperty('stockQuantity');
        expect(itemApi.updateItem.mock.lastCall[1].data).not.toHaveProperty('stockStore');
        expect(itemApi.updateItem.mock.lastCall[1].data).not.toHaveProperty('stockWarehouse');
        expect(screen.getByRole('button', { name: /Menyimpan/ })).toBeDisabled();

        await act(async () => updateRequest.reject(Object.assign(new Error('Jaringan gagal.'), {
            category: 'network',
            validationErrors: []
        })));
    });

    it('explains backend-reported locks accessibly and omits locked semantics from update', async () => {
        const user = userEvent.setup();
        const lockedItem = {
            ...baseItem,
            baseUnitOfMeasureLocked: true,
            fractionalQuantityAllowedLocked: true
        };
        itemApi.getItemDetails.mockResolvedValue(apiResponse(lockedItem));
        itemApi.updateItem.mockResolvedValue(apiResponse({ ...lockedItem, name: 'Kain baru' }));
        renderEdit();

        await screen.findByRole('heading', { name: 'Ubah barang KAIN-00001' });
        const uom = screen.getByRole('combobox', { name: 'Satuan dasar (UOM)' });
        const fractionalPolicy = screen.getByRole('checkbox', {
            name: 'Izinkan jumlah pecahan'
        });
        expect(uom).toHaveAttribute('aria-disabled', 'true');
        expect(fractionalPolicy).toBeDisabled();
        expect(screen.getByText(/arti riwayat jumlah lama menjadi tidak jelas/))
            .toBeInTheDocument();
        expect(fractionalPolicy).toHaveAccessibleDescription(/Terkunci setelah pergerakan stok/);

        await user.clear(screen.getByLabelText('Nama barang'));
        await user.type(screen.getByLabelText('Nama barang'), 'Kain baru');
        await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));

        await waitFor(() => expect(itemApi.updateItem).toHaveBeenCalledTimes(1));
        expect(itemApi.updateItem.mock.lastCall[1].data).toEqual({
            name: 'Kain baru',
            sku: 'KAIN-00001',
            description: 'Kain lembut',
            price: '15000.5000'
        });
    });

    it('maps validation to the field, preserves input, and focuses the invalid field', async () => {
        const user = userEvent.setup();
        itemApi.updateItem.mockRejectedValue(Object.assign(new Error('Masukan tidak valid.'), {
            category: 'validation',
            validationErrors: [{ field: 'sku', message: 'SKU sudah digunakan.' }]
        }));
        renderEdit();

        await screen.findByRole('heading', { name: 'Ubah barang KAIN-00001' });
        await user.clear(screen.getByLabelText('Nama barang'));
        await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));
        expect(screen.getByText('Nama barang wajib diisi.')).toBeInTheDocument();
        expect(screen.getByLabelText('Nama barang')).toHaveFocus();
        expect(itemApi.updateItem).not.toHaveBeenCalled();

        await user.type(screen.getByLabelText('Nama barang'), 'Nama tetap ada');
        await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));
        expect(await screen.findByText('SKU sudah digunakan.')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByLabelText('SKU')).toHaveFocus());
        expect(screen.getByLabelText('Nama barang')).toHaveValue('Nama tetap ada');
    });

    it('requires a refresh after conflict and replaces the form with backend lock truth', async () => {
        const user = userEvent.setup();
        const refreshedItem = {
            ...baseItem,
            name: 'Nama dari server',
            baseUnitOfMeasureLocked: true,
            fractionalQuantityAllowedLocked: true
        };
        itemApi.getItemDetails
            .mockResolvedValueOnce(apiResponse(baseItem))
            .mockResolvedValueOnce(apiResponse(refreshedItem));
        itemApi.updateItem.mockRejectedValue(Object.assign(new Error('Data telah berubah.'), {
            category: 'conflict',
            validationErrors: []
        }));
        renderEdit();

        await screen.findByRole('heading', { name: 'Ubah barang KAIN-00001' });
        await user.clear(screen.getByLabelText('Nama barang'));
        await user.type(screen.getByLabelText('Nama barang'), 'Edit lokal');
        await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Muat ulang data terbaru');
        await waitFor(() => expect(alert).toHaveFocus());
        expect(screen.getByRole('button', { name: 'Simpan perubahan' })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Muat ulang data' }));
        expect(await screen.findByText('Data terbaru berhasil dimuat. Periksa kembali sebelum menyimpan.'))
            .toBeInTheDocument();
        expect(screen.getByLabelText('Nama barang')).toHaveValue('Nama dari server');
        expect(screen.getByRole('combobox', { name: 'Satuan dasar (UOM)' }))
            .toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByRole('checkbox', { name: 'Izinkan jumlah pecahan' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Simpan perubahan' })).toBeEnabled();
    });

    it('navigates with backend-confirmed identity after success', async () => {
        const user = userEvent.setup();
        itemApi.updateItem.mockResolvedValue(apiResponse({
            ...baseItem,
            sku: 'KAIN-NEW',
            name: 'Nama server'
        }));
        renderEdit();

        await screen.findByRole('heading', { name: 'Ubah barang KAIN-00001' });
        await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));

        await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/items?'));
        expect(screen.getByTestId('location')).toHaveTextContent('KAIN-NEW');
        expect(screen.getByTestId('location')).toHaveTextContent('Nama+server');
    });
});
