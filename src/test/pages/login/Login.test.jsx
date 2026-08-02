import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryRouter, useLocation } from 'react-router-dom';

const authApi = vi.hoisted(() => ({
    doLogin: vi.fn(),
    getCurrentUser: vi.fn()
}));

vi.mock('@api/auth.js', () => ({ default: authApi }));

import useAuthStore from '@stores/modules/auth.js';

import Login from '@pages/login/Login.jsx';

const LocationDisplay = () => {
    const location = useLocation();

    return <div data-testid="location">{ location.pathname }</div>;
};

const renderLogin = initialEntry => render(
    <MemoryRouter initialEntries={ [initialEntry] }>
        <Login />
        <LocationDisplay />
    </MemoryRouter>
);

describe('Login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.setState({ currentUser: null, authStatus: 'unauthenticated' });
    });

    afterEach(() => {
        useAuthStore.setState({ currentUser: null, authStatus: 'checking' });
    });

    it('disables duplicate submission and focuses the normalized failure message', async () => {
        const user = userEvent.setup();
        let rejectLogin;
        authApi.doLogin.mockReturnValue(new Promise((_resolve, reject) => {
            rejectLogin = reject;
        }));

        renderLogin('/login');
        await user.type(screen.getByLabelText('Username'), 'kasir');
        await user.type(screen.getByLabelText('Password'), 'rahasia');

        const form = screen.getByRole('button', { name: 'Log in' }).closest('form');
        fireEvent.submit(form);
        fireEvent.submit(form);

        expect(authApi.doLogin).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Sedang masuk...' })).toBeDisabled();

        await act(async () => {
            rejectLogin(Object.assign(new Error('Sesi Anda telah berakhir.'), {
                name: 'ApiError',
                category: 'authentication'
            }));
        });

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Username atau kata sandi salah. Silakan coba lagi.');
        expect(alert).toHaveFocus();
        expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
    });

    it('returns to a safe internal redirect after login succeeds', async () => {
        const user = userEvent.setup();
        authApi.doLogin.mockResolvedValue({ data: { code: 200, data: true } });
        authApi.getCurrentUser.mockResolvedValue({
            status: 200,
            data: { data: { username: 'kasir' } }
        });

        renderLogin('/login?redirect=%2Fitems');
        await user.type(screen.getByLabelText('Username'), 'kasir');
        await user.type(screen.getByLabelText('Password'), 'rahasia');
        await user.click(screen.getByRole('button', { name: 'Log in' }));

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/items');
        });
    });
});
