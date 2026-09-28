import {
    MemoryRouter,
    Route,
    Routes,
    useLocation
} from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authApi = vi.hoisted(() => ({
    doLogin: vi.fn(),
    getCurrentUser: vi.fn()
}));

vi.mock('@api/auth.js', () => ({ default: authApi }));

import Login from '@pages/login/Login.jsx';
import useAuthStore from '@stores/modules/auth.js';

const LocationDisplay = () => {
    const location = useLocation();

    return (
        <>
            <div data-testid="location">
                { `${ location.pathname }${ location.search }${ location.hash }` }
            </div>
            <div data-testid="focus-request">
                { String(location.state?.focusPageHeading === true) }
            </div>
        </>
    );
};

const renderLogin = initialEntry => render(
    <MemoryRouter initialEntries={ [initialEntry] }>
        <Routes>
            <Route
                path="/login"
                element={
                    <>
                        <Login />
                        <LocationDisplay />
                    </>
                }
            />
            <Route path="*" element={ <LocationDisplay /> } />
        </Routes>
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

    it('presents the operational story without adding another login action', () => {
        const { container } = renderLogin('/login');

        expect(screen.getByRole('heading', { name: 'Operasional toko dalam satu alur' })).toBeInTheDocument();
        expect(container.querySelectorAll('.login__visual img')).toHaveLength(3);
        expect(screen.getAllByRole('button', { name: 'Masuk' })).toHaveLength(1);
    });

    it('disables duplicate submission and focuses the normalized failure message', async () => {
        const user = userEvent.setup();
        let rejectLogin;
        authApi.doLogin.mockReturnValue(new Promise((_resolve, reject) => {
            rejectLogin = reject;
        }));

        renderLogin('/login');
        await user.type(screen.getByLabelText('Nama pengguna'), 'kasir');
        await user.type(screen.getByLabelText('Kata sandi'), 'rahasia');

        const form = screen.getByRole('button', { name: 'Masuk' }).closest('form');
        fireEvent.submit(form);
        fireEvent.submit(form);

        expect(authApi.doLogin).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Sedang masuk…' })).toBeDisabled();
        expect(screen.getByLabelText('Nama pengguna')).toHaveAttribute('readonly');
        expect(screen.getByLabelText('Kata sandi')).toHaveAttribute('readonly');

        await act(async () => {
            rejectLogin(Object.assign(new Error('Sesi Anda telah berakhir.'), {
                name: 'ApiError',
                category: 'authentication'
            }));
        });

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Nama pengguna atau kata sandi salah. Periksa kembali lalu coba lagi.');
        expect(alert).toHaveFocus();
        expect(screen.getByLabelText('Nama pengguna')).toHaveValue('kasir');
        expect(screen.getByLabelText('Kata sandi')).toHaveValue('rahasia');
        expect(screen.getByRole('button', { name: 'Masuk' })).toBeEnabled();
    });

    it('returns to the safe path, query, and hash and requests destination-heading focus', async () => {
        const user = userEvent.setup();
        authApi.doLogin.mockResolvedValue({ data: { code: 200, data: true } });
        authApi.getCurrentUser.mockResolvedValue({
            status: 200,
            data: {
                data: {
                    accountId: '101',
                    username: 'kasir'
                }
            }
        });

        renderLogin('/login?redirect=%2Fitems%3Fpage%3D2%23stock');
        await user.type(screen.getByLabelText('Nama pengguna'), 'kasir');
        await user.type(screen.getByLabelText('Kata sandi'), 'rahasia');
        await user.click(screen.getByRole('button', { name: 'Masuk' }));

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/items?page=2#stock');
        });
        expect(screen.getByTestId('focus-request')).toHaveTextContent('true');
    });

    it('identifies both required fields and focuses the first invalid field', async () => {
        const user = userEvent.setup();

        renderLogin('/login');
        await user.click(screen.getByRole('button', { name: 'Masuk' }));

        expect(screen.getByText('Nama pengguna wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Kata sandi wajib diisi.')).toBeInTheDocument();
        expect(screen.getByLabelText('Nama pengguna')).toHaveFocus();
        expect(authApi.doLogin).not.toHaveBeenCalled();
    });

    it('explains session expiry without offering to resubmit a transaction', () => {
        renderLogin('/login?redirect=%2Fsales%2FSALE%252FIX-2026%252F0003&reason=session-expired');

        const alert = screen.getByRole('alert');

        expect(alert).toHaveTextContent('Sesi telah berakhir');
        expect(alert).toHaveTextContent('Tidak ada transaksi yang dikirim ulang.');
        expect(alert).toHaveFocus();
        expect(screen.getByRole('button', { name: 'Masuk dan lanjutkan' })).toBeEnabled();
    });

    it.each([
        'https://evil.example/steal',
        '//evil.example/steal',
        '/\\evil.example/steal',
        '/login'
    ])('replaces unsafe return target %s with Dashboard', async redirect => {
        const user = userEvent.setup();
        authApi.doLogin.mockResolvedValue({ data: { code: 200, data: true } });
        authApi.getCurrentUser.mockResolvedValue({
            status: 200,
            data: {
                data: {
                    accountId: '101',
                    username: 'kasir'
                }
            }
        });

        renderLogin(`/login?redirect=${ encodeURIComponent(redirect) }`);
        await user.type(screen.getByLabelText('Nama pengguna'), 'kasir');
        await user.type(screen.getByLabelText('Kata sandi'), 'rahasia');
        await user.click(screen.getByRole('button', { name: 'Masuk' }));

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
        });
    });
});
