import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authApi = vi.hoisted(() => ({
    getCurrentUser: vi.fn()
}));

vi.mock('@api/auth.js', () => ({ default: authApi }));
vi.mock('@components/app/Header.jsx', () => ({ default: () => <div>Header</div> }));
vi.mock('@components/app/Loader.jsx', () => ({ default: () => null }));
vi.mock('@components/app/Sidebar.jsx', () => ({ default: () => <div>Sidebar</div> }));

import useAuthStore from '@stores/modules/auth.js';
import App from '@/App.jsx';

const LoginLocation = () => {
    const location = useLocation();
    const from = location.state?.from;

    return (
        <div>
            { `${ location.pathname }:${ from?.pathname || '' }${ from?.search || '' }${ from?.hash || '' }` }
        </div>
    );
};

const renderApp = initialEntry => {
    const router = createMemoryRouter([
        {
            path: '/',
            element: <App />,
            children: [
                { path: 'dashboard', element: <h1>Dashboard</h1> },
                { path: 'login', element: <LoginLocation />, handle: { hideLayout: true } }
            ]
        }
    ], { initialEntries: [initialEntry] });

    render(<RouterProvider router={ router } />);
    return router;
};

describe('protected route auth gating', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.setState({ currentUser: null, authStatus: 'checking' });
    });

    afterEach(() => {
        useAuthStore.setState({ currentUser: null, authStatus: 'checking' });
    });

    it('does not render protected content before the current-session request resolves', async () => {
        let resolveSession;
        authApi.getCurrentUser.mockReturnValue(new Promise(resolve => {
            resolveSession = resolve;
        }));

        renderApp('/dashboard');

        expect(screen.getByRole('status')).toHaveTextContent('Memeriksa sesi…');
        expect(screen.getByRole('status')).toHaveTextContent('Konten yang dilindungi belum ditampilkan.');
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

        await act(async () => {
            resolveSession({
                status: 200,
                data: {
                    data: {
                        accountId: '101',
                        username: 'kasir'
                    }
                }
            });
        });

        expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    });

    it('redirects an expired session to login and preserves the protected destination', async () => {
        authApi.getCurrentUser.mockRejectedValue(new Error('expired'));

        renderApp('/dashboard?page=2#stock');

        expect(await screen.findByText('/login:/dashboard?page=2#stock')).toBeInTheDocument();
    });

    it('focuses the destination heading after a successful protected return', async () => {
        authApi.getCurrentUser.mockResolvedValue({
            status: 200,
            data: {
                data: {
                    accountId: '101',
                    username: 'kasir'
                }
            }
        });

        renderApp({
            pathname: '/dashboard',
            state: { focusPageHeading: true }
        });

        const heading = await screen.findByRole('heading', { name: 'Dashboard' });

        await waitFor(() => {
            expect(heading).toHaveFocus();
        });
    });
});
