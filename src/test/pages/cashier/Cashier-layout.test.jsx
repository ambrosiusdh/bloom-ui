import { beforeEach, describe, expect, it, vi } from 'vitest';

const cashierStore = vi.hoisted(() => ({
    getItemCategoryList: vi.fn().mockResolvedValue(undefined),
    getItemList: vi.fn().mockResolvedValue(undefined),
    getItemDetails: vi.fn(),
    createSale: vi.fn(),
    getCheckoutStatus: vi.fn(),
    getCurrentSession: vi.fn(),
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
    useAuthStore: selector => selector({
        authStatus: 'authenticated',
        currentUser: {
            accountId: '101',
            username: 'admin'
        }
    }),
    useBreadcrumbStore: selector => selector({ setBreadcrumbs: cashierStore.setBreadcrumbs }),
    useCashSessionStore: selector => selector({
        currentSession: { id: 1, status: 'OPEN' },
        currentStatus: 'ready',
        drawerActionsEnabled: true,
        getCurrentSession: cashierStore.getCurrentSession
    }),
    useItemCategoryStore: selector => selector({
        getItemCategoryList: cashierStore.getItemCategoryList
    }),
    useSaleStore: selector => selector({
        createSale: cashierStore.createSale,
        getCheckoutStatus: cashierStore.getCheckoutStatus,
        printReceipt: vi.fn(),
        receiptPrintStateBySale: {}
    })
}));
vi.mock('@api/item.js', () => ({ default: { getItemList: cashierStore.getItemList } }));

import Cashier from '@/pages/cashier/Cashier.jsx';
import { render, screen } from '@/test/render.jsx';

describe('Cashier responsive layout', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('uses a focused two-pane layout at wide desktop widths and stacks at narrower widths', () => {
        render(<Cashier />);

        const cashier = document.querySelector('.cashier');
        const content = document.querySelector('.cashier__content');
        const cart = screen.getByTestId('cashier-cart').parentElement;

        expect(cashier).toHaveClass('cashier-workspace');
        expect(content).toHaveClass('cashier-catalog', 'min-w-0');
        expect(cart).toHaveClass('cashier-transaction');
        expect(document.querySelector('.cashier-session-status')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Buka transaksi (0)' })).toHaveAttribute(
            'href',
            '#cashier-transaction'
        );
    });
});
