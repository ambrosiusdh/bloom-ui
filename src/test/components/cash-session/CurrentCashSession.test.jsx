import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CurrentCashSession from '@components/cash-session/CurrentCashSession.jsx';
import useCashSessionStore from '@stores/modules/cash-session.js';
import {
    act,
    render,
    screen,
    waitFor
} from '@/test/render.jsx';

const cashSessionApi = vi.hoisted(() => ({
    getCurrentSession: vi.fn(),
    openSession: vi.fn()
}));

vi.mock('@api/cash-session.js', () => ({ default: cashSessionApi }));

const currentSession = {
    id: 17,
    openingCash: '500000.5000',
    expectedClosingCash: '999999.0000',
    openedAt: '2026-08-25T01:00:00Z',
    openedBy: 'admin',
    status: 'OPEN',
    version: 0
};

const noSessionError = () => Object.assign(new Error('Data tidak ditemukan.'), {
    category: 'not_found',
    status: 404,
    validationErrors: []
});

const deferred = () => {
    let reject;
    let resolve;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        reject = rejectPromise;
        resolve = resolvePromise;
    });
    return { promise, reject, resolve };
};

describe('CurrentCashSession', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useCashSessionStore.setState({
            currentSession: null,
            currentStatus: 'idle',
            currentError: null,
            lastCheckedAt: null,
            isOpening: false,
            openingError: null
        });
    });

    it('shows loading, focuses a current-state error, and retries to a verified empty state', async () => {
        const user = userEvent.setup();
        const firstRequest = deferred();
        cashSessionApi.getCurrentSession
            .mockReturnValueOnce(firstRequest.promise)
            .mockRejectedValueOnce(noSessionError());
        render(<CurrentCashSession />);

        expect(screen.getByRole('status')).toHaveTextContent('Memuat status sesi kas...');
        await act(async () => firstRequest.reject(Object.assign(
            new Error('Gagal terhubung ke server.'),
            { category: 'network' }
        )));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Gagal terhubung ke server.');
        await waitFor(() => expect(alert).toHaveFocus());

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByText(/Belum ada sesi kas yang terbuka\./))
            .toBeInTheDocument();
        expect(cashSessionApi.getCurrentSession).toHaveBeenCalledTimes(2);
    });

    it('validates currency text, focuses the field, blocks duplicates, and shows backend success', async () => {
        const user = userEvent.setup();
        const openingRequest = deferred();
        cashSessionApi.getCurrentSession.mockRejectedValue(noSessionError());
        cashSessionApi.openSession.mockReturnValue(openingRequest.promise);
        render(<CurrentCashSession />);

        await user.click(await screen.findByRole('button', { name: 'Buka sesi kas' }));
        const input = screen.getByLabelText(/Modal awal/);
        expect(input).toHaveFocus();

        await user.type(input, '1.000.000');
        await user.click(screen.getByRole('button', { name: 'Buka sesi' }));
        expect(screen.getByText(/Gunakan angka tanpa pemisah ribuan/)).toBeInTheDocument();
        expect(input).toHaveFocus();

        await user.clear(input);
        await user.type(input, '500000,5000');
        await user.dblClick(screen.getByRole('button', { name: 'Buka sesi' }));

        expect(cashSessionApi.openSession).toHaveBeenCalledTimes(1);
        expect(cashSessionApi.openSession).toHaveBeenCalledWith({
            data: { openingCash: '500000.5000' }
        }, undefined);
        expect(screen.getByRole('button', { name: 'Membuka...' })).toBeDisabled();

        await act(async () => openingRequest.resolve({ data: { data: currentSession } }));
        const success = await screen.findByText('Sesi kas #17 berhasil dibuka.');
        await waitFor(() => expect(success.closest('[role="status"]')).toHaveFocus());
        expect(screen.getByText('Rp 500.000,5')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.queryByText(/999.999/)).not.toBeInTheDocument();
    });

    it('refreshes the authoritative session after a server conflict', async () => {
        const user = userEvent.setup();
        const conflict = Object.assign(new Error('Data telah berubah.'), {
            category: 'conflict',
            status: 409,
            validationErrors: []
        });
        cashSessionApi.getCurrentSession
            .mockRejectedValueOnce(noSessionError())
            .mockResolvedValueOnce({ data: { data: currentSession } });
        cashSessionApi.openSession.mockRejectedValue(conflict);
        render(<CurrentCashSession />);

        await user.click(await screen.findByRole('button', { name: 'Buka sesi kas' }));
        await user.type(screen.getByLabelText(/Modal awal/), '100000');
        await user.click(screen.getByRole('button', { name: 'Buka sesi' }));

        expect(await screen.findByText(/Sesi kas sudah dibuka di tempat lain/))
            .toBeInTheDocument();
        await waitFor(() => expect(cashSessionApi.getCurrentSession).toHaveBeenCalledTimes(2));
        expect(await screen.findByText('Rp 500.000,5')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('preserves the amount and checks current state after an ambiguous opening error', async () => {
        const user = userEvent.setup();
        cashSessionApi.getCurrentSession.mockRejectedValue(noSessionError());
        cashSessionApi.openSession.mockRejectedValue(Object.assign(
            new Error('Gagal terhubung ke server.'),
            { category: 'network', validationErrors: [] }
        ));
        render(<CurrentCashSession />);

        await user.click(await screen.findByRole('button', { name: 'Buka sesi kas' }));
        await user.type(screen.getByLabelText(/Modal awal/), '250000');
        await user.click(screen.getByRole('button', { name: 'Buka sesi' }));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Periksa status sebelum mencoba lagi.');
        await waitFor(() => expect(alert).toHaveFocus());
        await user.click(screen.getByRole('button', { name: 'Periksa status' }));

        await user.click(await screen.findByRole('button', { name: 'Buka sesi kas' }));
        expect(screen.getByLabelText(/Modal awal/)).toHaveValue('250000');
        expect(cashSessionApi.getCurrentSession).toHaveBeenCalledTimes(2);
    });
});
