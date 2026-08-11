import { useNavigate } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ItemCategoryList from '@pages/item-category/ItemCategoryList.jsx';
import useItemCategoryStore from '@stores/modules/item-category.js';
import { act, fireEvent, render, screen, waitFor } from '@/test/render.jsx';

const categoryApi = vi.hoisted(() => ({
    createItemCategory: vi.fn(),
    deactivateItemCategory: vi.fn(),
    getItemCategoriesItemCount: vi.fn(),
    getItemCategoryDetails: vi.fn(),
    getItemCategoryList: vi.fn(),
    updateItemCategory: vi.fn()
}));

vi.mock('@api/item-category.js', () => ({ default: categoryApi }));

const listResponse = (content, paging = {}) => ({
    data: {
        data: {
            content,
            totalElements: content.length,
            totalPages: content.length ? 1 : 0,
            ...paging
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

describe('ItemCategoryList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useItemCategoryStore.setState({
            itemCategoryList: [],
            itemCategoryPaging: {}
        });
    });

    it('renders explicit loading and empty states', async () => {
        const request = deferred();
        categoryApi.getItemCategoryList.mockReturnValue(request.promise);
        render(<ItemCategoryList />, { route: '/item-categories' });

        expect(await screen.findByRole('status', {}, { timeout: 1500 })).toHaveTextContent('Memuat kategori...');
        await act(async () => request.resolve(listResponse([])));

        expect(await screen.findByText('Belum ada kategori aktif')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Buat kategori' })).toHaveAttribute('href', '/item-categories/new');
    });

    it('confirms the cascading deactivation, blocks duplicates, and restores focus', async () => {
        const user = userEvent.setup();
        const category = { code: 'KAIN', name: 'Kain', updatedAt: '2026-08-01T00:00:00Z' };
        const remainingCategory = { code: 'MAKANAN', name: 'Makanan', updatedAt: '2026-08-01T00:00:00Z' };
        const deactivateRequest = deferred();
        categoryApi.getItemCategoryList
            .mockResolvedValueOnce(listResponse([category, remainingCategory], { totalPages: 3 }))
            .mockResolvedValueOnce(listResponse([remainingCategory], { totalPages: 3 }));
        categoryApi.getItemCategoriesItemCount.mockResolvedValue({
            data: { data: { code: 'KAIN', itemCount: 2 } }
        });
        categoryApi.deactivateItemCategory.mockReturnValue(deactivateRequest.promise);
        render(<ItemCategoryList />, {
            route: '/item-categories?page=3&itemPerPage=10&key=code&q='
        });

        const trigger = await screen.findByRole(
            'button',
            { name: 'Nonaktifkan kategori Kain' },
            { timeout: 1500 }
        );
        trigger.focus();
        await user.keyboard('{Enter}');

        const dialog = await screen.findByRole('dialog', { name: 'Nonaktifkan Kain?' });
        expect(dialog).toHaveTextContent('menonaktifkan 2 barang aktif');
        await waitFor(() => expect(screen.getByRole('button', { name: 'Batal' })).toHaveFocus());
        await user.tab({ shift: true });
        expect(screen.getByRole('button', { name: 'Nonaktifkan' })).toHaveFocus();
        await user.tab();
        expect(screen.getByRole('button', { name: 'Batal' })).toHaveFocus();

        await user.click(screen.getByRole('button', { name: 'Batal' }));
        await waitFor(() => expect(trigger).toHaveFocus());
        await user.click(trigger);

        const confirm = await screen.findByRole('button', { name: 'Nonaktifkan' });
        fireEvent.click(confirm);
        fireEvent.click(confirm);
        expect(categoryApi.deactivateItemCategory).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Menonaktifkan...' })).toBeDisabled();

        await act(async () => deactivateRequest.resolve({ data: { data: true } }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await waitFor(() => expect(
            screen.queryByRole('button', { name: 'Nonaktifkan kategori Kain' })
        ).not.toBeInTheDocument());
        expect(categoryApi.getItemCategoryList.mock.calls[1][0].params.page).toBe(3);
        await waitFor(() => expect(screen.getByRole('heading', { name: 'Kategori Barang' })).toHaveFocus());
    });

    it('retries an item-count failure without reloading the category list', async () => {
        const user = userEvent.setup();
        const category = { code: 'KAIN', name: 'Kain', updatedAt: '2026-08-01T00:00:00Z' };
        categoryApi.getItemCategoryList.mockResolvedValue(listResponse([category]));
        categoryApi.getItemCategoriesItemCount
            .mockRejectedValueOnce(new Error('Jumlah barang kategori gagal dimuat.'))
            .mockResolvedValueOnce({ data: { data: { code: 'KAIN', itemCount: 1 } } });
        render(<ItemCategoryList />, { route: '/item-categories' });

        await user.click(await screen.findByRole('button', { name: 'Nonaktifkan kategori Kain' }));
        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Jumlah barang kategori gagal dimuat.');
        expect(alert).toHaveFocus();

        await user.click(screen.getByRole('button', { name: 'Coba lagi hitung jumlah' }));
        expect(await screen.findByRole('dialog', { name: 'Nonaktifkan Kain?' })).toBeInTheDocument();
        expect(categoryApi.getItemCategoriesItemCount).toHaveBeenCalledTimes(2);
        expect(categoryApi.getItemCategoryList).toHaveBeenCalledTimes(1);
    });

    it('ignores an older filtered response after a newer search has completed', async () => {
        const user = userEvent.setup();
        const kainRequest = deferred();
        const makananRequest = deferred();
        const initialCategory = { code: 'AWAL', name: 'Awal', updatedAt: '2026-08-01T00:00:00Z' };
        const kainCategory = { code: 'KAIN', name: 'Kain', updatedAt: '2026-08-01T00:00:00Z' };
        const makananCategory = { code: 'MAKANAN', name: 'Makanan', updatedAt: '2026-08-01T00:00:00Z' };
        categoryApi.getItemCategoryList
            .mockResolvedValueOnce(listResponse([initialCategory]))
            .mockReturnValueOnce(kainRequest.promise)
            .mockReturnValueOnce(makananRequest.promise);
        render(<ItemCategoryList />, { route: '/item-categories' });

        const searchInput = await screen.findByLabelText('Cari berdasarkan Kode');
        await user.type(searchInput, 'KAIN');
        await waitFor(
            () => expect(categoryApi.getItemCategoryList).toHaveBeenCalledTimes(2),
            { timeout: 1500 }
        );
        const oldSignal = categoryApi.getItemCategoryList.mock.calls[1][0].signal;

        await user.clear(searchInput);
        await user.type(searchInput, 'MAKANAN');
        await waitFor(
            () => expect(categoryApi.getItemCategoryList).toHaveBeenCalledTimes(3),
            { timeout: 1500 }
        );
        expect(oldSignal.aborted).toBe(true);

        await act(async () => makananRequest.resolve(listResponse([makananCategory])));
        expect(await screen.findByText('Makanan')).toBeInTheDocument();

        await act(async () => kainRequest.resolve(listResponse([kainCategory])));
        expect(screen.getByText('Makanan')).toBeInTheDocument();
        expect(screen.queryByText('Kain')).not.toBeInTheDocument();
    });

    it('does not expose previous-query rows or actions when a new search fails', async () => {
        const user = userEvent.setup();
        const category = { code: 'KAIN', name: 'Kain', updatedAt: '2026-08-01T00:00:00Z' };
        categoryApi.getItemCategoryList
            .mockResolvedValueOnce(listResponse([category]))
            .mockRejectedValueOnce(new Error('Pencarian kategori gagal dimuat.'));
        render(<ItemCategoryList />, { route: '/item-categories' });

        const searchInput = await screen.findByLabelText('Cari berdasarkan Kode');
        expect(await screen.findByText('Kain')).toBeInTheDocument();
        await user.type(searchInput, 'MAKANAN');

        expect(await screen.findByRole('alert', {}, { timeout: 1500 })).toHaveTextContent(
            'Pencarian kategori gagal dimuat.'
        );
        expect(screen.getByText('Data kategori belum dapat ditampilkan.')).toBeInTheDocument();
        expect(screen.queryByText('Kain')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Nonaktifkan kategori Kain' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Ubah kategori Kain' })).not.toBeInTheDocument();
    });

    it('restores filters and results when browser history changes the URL', async () => {
        const user = userEvent.setup();
        const kainCategory = { code: 'KAIN', name: 'Kain', updatedAt: '2026-08-01T00:00:00Z' };
        const makananCategory = { code: 'MAKANAN', name: 'Makanan', updatedAt: '2026-08-01T00:00:00Z' };
        categoryApi.getItemCategoryList.mockImplementation(({ params }) => Promise.resolve(
            listResponse([params.code === 'KAIN' ? kainCategory : makananCategory])
        ));
        render(
            <>
                <ItemCategoryList />
                <HistoryBackButton />
            </>,
            {
                initialEntries: [
                    '/item-categories?page=1&itemPerPage=10&key=code&q=KAIN',
                    '/item-categories?page=1&itemPerPage=10&key=code&q=MAKANAN'
                ],
                initialIndex: 1
            }
        );

        expect(await screen.findByLabelText('Cari berdasarkan Kode')).toHaveValue('MAKANAN');
        expect(await screen.findByText('Makanan')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Kembali' }));

        await waitFor(() => expect(screen.getByLabelText('Cari berdasarkan Kode')).toHaveValue('KAIN'));
        expect(await screen.findByText('Kain')).toBeInTheDocument();
        expect(categoryApi.getItemCategoryList.mock.lastCall[0].params).toMatchObject({
            page: 1,
            size: 10,
            code: 'KAIN'
        });
    });

    it('aborts a pending item-count lookup when the list query changes', async () => {
        const user = userEvent.setup();
        const countRequest = deferred();
        const category = { code: 'KAIN', name: 'Kain', updatedAt: '2026-08-01T00:00:00Z' };
        categoryApi.getItemCategoryList
            .mockResolvedValueOnce(listResponse([category]))
            .mockResolvedValueOnce(listResponse([]));
        categoryApi.getItemCategoriesItemCount.mockReturnValue(countRequest.promise);
        render(<ItemCategoryList />, { route: '/item-categories' });

        await user.click(await screen.findByRole('button', { name: 'Nonaktifkan kategori Kain' }));
        const countSignal = categoryApi.getItemCategoriesItemCount.mock.calls[0][1].signal;
        await user.type(screen.getByLabelText('Cari berdasarkan Kode'), 'MAKANAN');
        await waitFor(() => expect(countSignal.aborted).toBe(true), { timeout: 1500 });

        await act(async () => countRequest.resolve({
            data: { data: { code: 'KAIN', itemCount: 2 } }
        }));
        expect(screen.queryByRole('dialog', { name: 'Nonaktifkan Kain?' })).not.toBeInTheDocument();
    });
});
