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

const listResponse = content => ({
    data: { data: { content, totalElements: content.length, totalPages: content.length ? 1 : 0 } }
});

const deferred = () => {
    let resolve;
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
};

describe('ItemCategoryList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useItemCategoryStore.setState({
            itemCategoriesItemCount: {},
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
        const deactivateRequest = deferred();
        categoryApi.getItemCategoryList.mockResolvedValue(listResponse([category]));
        categoryApi.getItemCategoriesItemCount.mockResolvedValue({
            data: { data: { code: 'KAIN', itemCount: 2 } }
        });
        categoryApi.deactivateItemCategory.mockReturnValue(deactivateRequest.promise);
        render(<ItemCategoryList />, { route: '/item-categories' });

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
        await waitFor(() => expect(screen.getByRole('heading', { name: 'Kategori Barang' })).toHaveFocus());
    });
});
