import { describe, expect, it, vi } from 'vitest';

const cashierStore = vi.hoisted(() => ({
    getItemCategoryList: vi.fn().mockResolvedValue(undefined),
    getItemList: vi.fn().mockResolvedValue(undefined),
    getItemDetails: vi.fn(),
    setBreadcrumbs: vi.fn()
}));

vi.mock('notistack', async importOriginal => ({
    ...await importOriginal(),
    enqueueSnackbar: vi.fn()
}));
vi.mock('@components/cashier/CashierCart.jsx', () => ({
    default: () => <div data-testid="cashier-cart">Cart</div>
}));
vi.mock('@stores/index.js', () => ({
    useBreadcrumbStore: selector => selector({ setBreadcrumbs: cashierStore.setBreadcrumbs }),
    useItemCategoryStore: selector => selector({
        itemCategoryList: [],
        getItemCategoryList: cashierStore.getItemCategoryList
    }),
    useItemStore: selector => selector({
        itemList: [],
        getItemList: cashierStore.getItemList,
        getItemDetails: cashierStore.getItemDetails
    })
}));
vi.mock('@utils/general-utils.js', () => ({
    clearDebounce: vi.fn(),
    debounce: vi.fn()
}));

import Cashier from '@/pages/cashier/Cashier.jsx';
import { render, screen } from '@/test/render.jsx';

describe('Cashier responsive layout', () => {
    it('uses a focused two-pane layout at wide desktop widths and stacks at narrower widths', () => {
        render(<Cashier />);

        const cashier = document.querySelector('.cashier');
        const content = document.querySelector('.cashier__content');
        const cart = screen.getByTestId('cashier-cart').parentElement;

        expect(cashier).toHaveClass('flex-col', 'xl:flex-row');
        expect(content).toHaveClass('xl:basis-2/3');
        expect(cart).toHaveClass('xl:basis-1/3', 'xl:min-w-[20rem]');
    });
});
