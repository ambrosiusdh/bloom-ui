import {
    Route,
    Routes,
    useLocation,
    useNavigate
} from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ItemCategoryUpsert from '@pages/item-category/ItemCategoryUpsert.jsx';
import useItemCategoryStore from '@stores/modules/item-category.js';
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor
} from '@/test/render.jsx';

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

const NavigateToMakanan = () => {
    const navigate = useNavigate();
    return (
        <button onClick={ () => navigate('/item-categories/MAKANAN/edit') }>
            Buka MAKANAN
        </button>
    );
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

    it('enforces the backend persistence lengths without inventing a ten-character code limit', async () => {
        const user = userEvent.setup();
        render(<ItemCategoryUpsert />, { route: '/item-categories/new' });

        fireEvent.change(screen.getByLabelText('Nama kategori'), {
            target: { value: 'N'.repeat(256) }
        });
        fireEvent.change(screen.getByLabelText('Kode kategori'), {
            target: { value: 'K'.repeat(101) }
        });
        await user.click(screen.getByRole('button', { name: 'Buat kategori' }));

        expect(screen.getByText('Nama kategori maksimal 255 karakter.')).toBeInTheDocument();
        expect(screen.getByText('Kode kategori maksimal 100 karakter.')).toBeInTheDocument();
        expect(categoryApi.createItemCategory).not.toHaveBeenCalled();
    });

    it('preserves a non-required backend validation reason and the entered values', async () => {
        const user = userEvent.setup();
        categoryApi.createItemCategory.mockRejectedValue(Object.assign(new Error('Masukan tidak valid.'), {
            category: 'validation',
            domainCode: null,
            validationErrors: [
                { field: 'code', message: 'Kode hanya boleh berisi huruf dan angka.' }
            ]
        }));
        render(<ItemCategoryUpsert />, { route: '/item-categories/new' });

        await user.type(screen.getByLabelText('Nama kategori'), 'Kain');
        await user.type(screen.getByLabelText('Kode kategori'), 'KAIN-');
        await user.click(screen.getByRole('button', { name: 'Buat kategori' }));

        expect(await screen.findByText('Kode hanya boleh berisi huruf dan angka.')).toBeInTheDocument();
        expect(screen.queryByText('Kode kategori wajib diisi.')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Nama kategori')).toHaveValue('Kain');
        expect(screen.getByLabelText('Kode kategori')).toHaveValue('KAIN-');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        await waitFor(() => expect(screen.getByLabelText('Kode kategori')).toHaveFocus());
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

    it('finishes loading when the backend returns a canonicalized category code', async () => {
        categoryApi.getItemCategoryDetails.mockResolvedValue({
            data: { data: { code: 'KAIN', name: 'Kain', description: '' } }
        });
        render(
            <Routes>
                <Route
                    path="/item-categories/:code/edit"
                    element={ <ItemCategoryUpsert /> }
                />
            </Routes>,
            { route: '/item-categories/kain/edit' }
        );

        expect(await screen.findByLabelText('Nama kategori')).toHaveValue('Kain');
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('reloads a reused edit route and ignores the previous category response arriving late', async () => {
        const user = userEvent.setup();
        const kainRequest = deferred();
        const makananRequest = deferred();
        categoryApi.getItemCategoryDetails.mockImplementation(categoryCode => (
            categoryCode === 'KAIN' ? kainRequest.promise : makananRequest.promise
        ));
        categoryApi.updateItemCategory.mockResolvedValue({ data: { data: {} } });
        render(
            <Routes>
                <Route
                    path="/item-categories/:code/edit"
                    element={
                        <>
                            <ItemCategoryUpsert />
                            <NavigateToMakanan />
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
        await user.click(screen.getByRole('button', { name: 'Buka MAKANAN' }));
        await waitFor(() => expect(categoryApi.getItemCategoryDetails).toHaveBeenCalledTimes(2));

        await act(async () => makananRequest.resolve({
            data: { data: { code: 'MAKANAN', name: 'Makanan', description: 'Baru' } }
        }));
        expect(await screen.findByLabelText('Nama kategori')).toHaveValue('Makanan');

        await act(async () => kainRequest.resolve({
            data: { data: { code: 'KAIN', name: 'Kain lama', description: 'Lama' } }
        }));
        expect(screen.getByLabelText('Nama kategori')).toHaveValue('Makanan');
        expect(useItemCategoryStore.getState().itemCategoryDetails).toMatchObject({
            code: 'MAKANAN',
            name: 'Makanan'
        });

        await user.clear(screen.getByLabelText('Nama kategori'));
        await user.type(screen.getByLabelText('Nama kategori'), 'Makanan baru');
        await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));
        expect(categoryApi.updateItemCategory).toHaveBeenCalledWith('MAKANAN', {
            data: { name: 'Makanan baru', description: 'Baru' }
        }, undefined);
    });

    it('ignores an old save after route reuse and disables editing while that save is pending', async () => {
        const user = userEvent.setup();
        const updateRequest = deferred();
        categoryApi.getItemCategoryDetails.mockImplementation(categoryCode => Promise.resolve({
            data: {
                data: categoryCode === 'KAIN'
                    ? { code: 'KAIN', name: 'Kain', description: 'Lama' }
                    : { code: 'MAKANAN', name: 'Makanan', description: 'Baru' }
            }
        }));
        categoryApi.updateItemCategory.mockReturnValue(updateRequest.promise);
        render(
            <Routes>
                <Route
                    path="/item-categories/:code/edit"
                    element={
                        <>
                            <ItemCategoryUpsert />
                            <NavigateToMakanan />
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

        const nameInput = await screen.findByLabelText('Nama kategori');
        await user.clear(nameInput);
        await user.type(nameInput, 'Kain baru');
        await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));
        expect(nameInput).toBeDisabled();
        expect(screen.getByLabelText('Deskripsi kategori')).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Buka MAKANAN' }));
        await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(
            '/item-categories/MAKANAN/edit'
        ));
        expect(await screen.findByLabelText('Nama kategori')).toHaveValue('Makanan');

        await act(async () => updateRequest.resolve({ data: { data: {} } }));
        expect(screen.getByTestId('location')).toHaveTextContent('/item-categories/MAKANAN/edit');
        expect(screen.getByLabelText('Nama kategori')).toHaveValue('Makanan');
    });
});
