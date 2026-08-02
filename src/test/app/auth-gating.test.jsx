import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom';

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

    return <div>{ `${location.pathname}:${location.state?.from?.pathname || ''}` }</div>;
};

const renderApp = initialEntry => {
    const router = createMemoryRouter([
        {
            path: '/',
            element: <App />,
            children: [
                { path: 'dashboard', element: <div>Dashboard</div> },
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

        expect(screen.getByRole('status')).toHaveTextContent('Memeriksa sesi...');
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

        await act(async () => {
            resolveSession({
                status: 200,
                data: { data: { username: 'kasir' } }
            });
        });

        expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    });

    it('redirects an expired session to login and preserves the protected destination', async () => {
        authApi.getCurrentUser.mockRejectedValue(new Error('expired'));

        renderApp('/dashboard');

        expect(await screen.findByText('/login:/dashboard')).toBeInTheDocument();
    });
});
