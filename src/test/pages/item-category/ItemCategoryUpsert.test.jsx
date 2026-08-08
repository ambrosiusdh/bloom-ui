import { Route, Routes, useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ItemCategoryUpsert from '@pages/item-category/ItemCategoryUpsert.jsx';
import useItemCategoryStore from '@stores/modules/item-category.js';
import { act, render, screen, waitFor } from '@/test/render.jsx';

const categoryApi = vi.hoisted(() => ({
    createItemCategory: vi.fn(),
    deactivateItemCategory: vi.fn(),
    getItemCategoriesItemCount: vi.fn(),
    getItemCategoryDetails: vi.fn(),
    getItemCategoryList: vi.fn(),
    updateItemCategory: vi.fn()
}));

vi.mock('@api/item-category.js', () => ({ default: categoryApi }));

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
    return <div data-testid="location">{ location.pathname }</div>;
};

describe('ItemCategoryUpsert', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useItemCategoryStore.setState({ itemCategoryDetails: {} });
    });

    it('validates required fields and preserves input through a duplicate conflict', async () => {
        const user = userEvent.setup();
        const createRequest = deferred();
        categoryApi.createItemCategory.mockReturnValue(createRequest.promise);
        render(<ItemCategoryUpsert />, { route: '/item-categories/new' });

        await user.click(screen.getByRole('button', { name: 'Buat kategori' }));
        expect(screen.getByLabelText('Nama kategori')).toHaveFocus();
        expect(screen.getByText('Nama kategori wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Kode kategori wajib diisi.')).toBeInTheDocument();

        await user.type(screen.getByLabelText('Nama kategori'), 'Kain');
        await user.type(screen.getByLabelText('Kode kategori'), 'KAIN');
        await user.dblClick(screen.getByRole('button', { name: 'Buat kategori' }));

        expect(categoryApi.createItemCategory).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled();

        await act(async () => {
            createRequest.reject(Object.assign(new Error('Data telah berubah.'), {
                category: 'conflict',
                domainCode: 'item_category_already_exists',
                validationErrors: []
            }));
        });

        expect(await screen.findByRole('alert')).toHaveTextContent('Kode kategori [KAIN] sudah digunakan');
        expect(screen.getByRole('alert')).toHaveFocus();
        expect(screen.getByLabelText('Nama kategori')).toHaveValue('Kain');
        expect(screen.getByLabelText('Kode kategori')).toHaveValue('KAIN');
    });

    it('shows detail loading and sends only backend-supported update fields', async () => {
        const user = userEvent.setup();
        const detailsRequest = deferred();
        categoryApi.getItemCategoryDetails.mockReturnValue(detailsRequest.promise);
        categoryApi.updateItemCategory.mockResolvedValue({ data: { data: {} } });
        render(
            <Routes>
                <Route
                    path="/item-categories/:code/edit"
                    element={
                        <>
                            <ItemCategoryUpsert />
                            <LocationDisplay />
                        </>
                    }
                />
                <Route
                    path="/item-categories"
                    element={ <LocationDisplay /> }
                />
            </Routes>,
            { route: '/item-categories/KAIN/edit' }
        );

        expect(await screen.findByRole('status')).toHaveTextContent('Memuat kategori...');
        await act(async () => {
            detailsRequest.resolve({
                data: { data: { code: 'KAIN', name: 'Kain', description: 'Lama' } }
            });
        });

        await user.clear(await screen.findByLabelText('Nama kategori'));
        await user.type(screen.getByLabelText('Nama kategori'), 'Kain baru');
        await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));

        expect(categoryApi.updateItemCategory).toHaveBeenCalledWith('KAIN', {
            data: { name: 'Kain baru', description: 'Lama' }
        }, undefined);
        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/item-categories');
        });
    });
});
