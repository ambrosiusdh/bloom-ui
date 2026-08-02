import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

const authApi = vi.hoisted(() => ({
    getCurrentUser: vi.fn()
}));

vi.mock('@api/auth.js', () => ({ default: authApi }));
vi.mock('@components/app/Header.jsx', () => ({
    default: ({ cashierMode }) => (
        <header data-testid="app-header">
            { cashierMode ? 'Cashier header' : 'Back-office header' }
        </header>
    )
}));
vi.mock('@components/app/Loader.jsx', () => ({ default: () => null }));
vi.mock('@components/app/Sidebar.jsx', () => ({ default: () => <aside>Back-office navigation</aside> }));

import useAuthStore from '@stores/modules/auth.js';

import App from '@/App.jsx';

const renderApp = initialEntry => {
    const router = createMemoryRouter([
        {
            path: '/',
            element: <App />,
            children: [
                { path: 'cashier', element: <div>Cashier workspace</div>, handle: { cashierMode: true } },
                { path: 'dashboard', element: <div>Dashboard</div> }
            ]
        }
    ], { initialEntries: [initialEntry] });

    render(<RouterProvider router={ router } />);
};

describe('cashier-focused layout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authApi.getCurrentUser.mockResolvedValue({
            status: 200,
            data: { data: { username: 'kasir' } }
        });
        useAuthStore.setState({ currentUser: null, authStatus: 'checking' });
    });

    afterEach(() => {
        useAuthStore.setState({ currentUser: null, authStatus: 'checking' });
    });

    it('uses the focused shell for /cashier without changing the back-office shell', async () => {
        renderApp('/cashier');

        expect(await screen.findByText('Cashier workspace')).toBeInTheDocument();
        expect(screen.getByTestId('app-header')).toHaveTextContent('Cashier header');
        expect(screen.queryByText('Back-office navigation')).not.toBeInTheDocument();
        expect(document.querySelector('.bloom')).toHaveClass('bloom--cashier');
    });

    it('retains the existing back-office shell outside /cashier', async () => {
        renderApp('/dashboard');

        expect(await screen.findByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('app-header')).toHaveTextContent('Back-office header');
        expect(screen.getByText('Back-office navigation')).toBeInTheDocument();
        expect(document.querySelector('.bloom')).not.toHaveClass('bloom--cashier');
    });
});
