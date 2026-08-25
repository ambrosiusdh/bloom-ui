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
    openSession: vi.fn(),
    getSessionDetails: vi.fn(),
    getExpectedCash: vi.fn(),
    closeSession: vi.fn()
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

const noSessionResponse = () => ({ data: { data: null } });

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
            drawerActionsEnabled: false,
            isOpening: false,
            openingError: null,
            isClosing: false,
            closingError: null
        });
    });

    it('shows loading, focuses a current-state error, and retries to a verified empty state', async () => {
        const user = userEvent.setup();
        const firstRequest = deferred();
        cashSessionApi.getCurrentSession
            .mockReturnValueOnce(firstRequest.promise)
            .mockResolvedValueOnce(noSessionResponse());
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
        cashSessionApi.getCurrentSession.mockResolvedValue(noSessionResponse());
        cashSessionApi.openSession.mockReturnValue(openingRequest.promise);
        render(<CurrentCashSession />);

        await user.click(await screen.findByRole('button', { name: 'Buka sesi kas' }));
        const input = screen.getByLabelText(/Modal awal/);
        expect(input).toHaveFocus();

        await user.type(input, '500.50.1');
        await user.click(screen.getByRole('button', { name: 'Buka sesi' }));
        expect(screen.getByText('Masukkan nominal uang yang valid.')).toBeInTheDocument();
        expect(cashSessionApi.openSession).not.toHaveBeenCalled();

        await user.clear(input);
        await user.type(input, '1234567890123456');
        expect(input).toHaveValue('1,234,567,890,123,456');
        await user.click(screen.getByRole('button', { name: 'Buka sesi' }));
        expect(screen.getByText(/Maksimal 15 angka/)).toBeInTheDocument();
        expect(input).toHaveFocus();

        await user.clear(input);
        await user.type(input, '500000.5000');
        expect(input).toHaveValue('500,000.5000');
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
            .mockResolvedValueOnce(noSessionResponse())
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
        cashSessionApi.getCurrentSession.mockResolvedValue(noSessionResponse());
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
        expect(screen.getByLabelText(/Modal awal/)).toHaveValue('250,000');
        expect(cashSessionApi.getCurrentSession).toHaveBeenCalledTimes(2);
    });

    it('renders the server preview, validates actual cash, blocks duplicate close, and shows final negative variance', async () => {
        const user = userEvent.setup();
        const closeRequest = deferred();
        const closedSession = {
            ...currentSession,
            expectedClosingCash: '1010000.0000',
            actualClosingCash: '1000000.0000',
            difference: '-10000.0000',
            closedAt: '2026-08-25T09:00:00Z',
            closedBy: 'supervisor',
            status: 'CLOSED',
            version: 1
        };
        cashSessionApi.getCurrentSession.mockResolvedValue({ data: { data: currentSession } });
        cashSessionApi.getExpectedCash.mockResolvedValue({
            data: { data: { sessionId: 17, expectedClosingCash: '999999.0000' } }
        });
        cashSessionApi.closeSession.mockReturnValue(closeRequest.promise);
        render(<CurrentCashSession />);

        await user.click(await screen.findByRole('button', { name: 'Tutup sesi kas' }));
        expect(await screen.findByText('Rp 999.999')).toBeInTheDocument();
        const input = screen.getByLabelText(/Uang aktual di laci/);
        await waitFor(() => expect(input).toHaveFocus());

        await user.click(screen.getByRole('button', { name: 'Konfirmasi tutup sesi' }));
        expect(screen.getByText('Uang aktual wajib diisi.')).toBeInTheDocument();
        expect(cashSessionApi.closeSession).not.toHaveBeenCalled();

        await user.type(input, '1000000');
        await user.dblClick(screen.getByRole('button', { name: 'Konfirmasi tutup sesi' }));
        expect(cashSessionApi.closeSession).toHaveBeenCalledTimes(1);
        expect(cashSessionApi.closeSession).toHaveBeenCalledWith(17, {
            data: { actualClosingCash: '1000000' }
        }, undefined);
        expect(screen.getByRole('button', { name: 'Menutup...' })).toBeDisabled();
        expect(useCashSessionStore.getState().drawerActionsEnabled).toBe(false);

        await act(async () => closeRequest.resolve({ data: { data: closedSession } }));

        const success = await screen.findByText('Sesi kas #17 berhasil ditutup.');
        await waitFor(() => expect(success.closest('[role="status"]')).toHaveFocus());
        expect(screen.getByText('Ditutup')).toBeInTheDocument();
        expect(screen.getByText('Rp 1.010.000')).toBeInTheDocument();
        expect(screen.getByText('Rp 1.000.000')).toBeInTheDocument();
        expect(screen.getByText('Selisih kurang')).toBeInTheDocument();
        expect(screen.getByText('-Rp 10.000')).toBeInTheDocument();
        expect(screen.getByText('supervisor')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Tutup sesi kas' })).not.toBeInTheDocument();
    });

    it('recovers an already-closed conflict and renders the positive server variance', async () => {
        const user = userEvent.setup();
        const conflict = Object.assign(new Error('Data telah berubah.'), {
            category: 'conflict',
            status: 409,
            validationErrors: []
        });
        const remotelyClosedSession = {
            ...currentSession,
            expectedClosingCash: '999999.0000',
            actualClosingCash: '1000004.0000',
            difference: '5.0000',
            closedAt: '2026-08-25T09:05:00Z',
            closedBy: 'other-admin',
            status: 'CLOSED',
            version: 1
        };
        cashSessionApi.getCurrentSession.mockResolvedValue({ data: { data: currentSession } });
        cashSessionApi.getExpectedCash.mockResolvedValue({
            data: { data: { sessionId: 17, expectedClosingCash: '999999.0000' } }
        });
        cashSessionApi.closeSession.mockRejectedValue(conflict);
        cashSessionApi.getSessionDetails.mockResolvedValue({
            data: { data: remotelyClosedSession }
        });
        render(<CurrentCashSession />);

        await user.click(await screen.findByRole('button', { name: 'Tutup sesi kas' }));
        await user.type(await screen.findByLabelText(/Uang aktual di laci/), '999999');
        await user.click(screen.getByRole('button', { name: 'Konfirmasi tutup sesi' }));

        expect(await screen.findByText(/Sesi sudah ditutup di tempat lain/)).toBeInTheDocument();
        expect(cashSessionApi.getSessionDetails).toHaveBeenCalledWith(17, undefined);
        expect(screen.getByText('Selisih lebih')).toBeInTheDocument();
        expect(screen.getByText('Rp 5')).toBeInTheDocument();
        expect(screen.getByText('other-admin')).toBeInTheDocument();
        expect(useCashSessionStore.getState().drawerActionsEnabled).toBe(false);
    });

    it('keeps close disabled until a failed server preview is retried successfully', async () => {
        const user = userEvent.setup();
        cashSessionApi.getCurrentSession.mockResolvedValue({ data: { data: currentSession } });
        cashSessionApi.getExpectedCash
            .mockRejectedValueOnce(Object.assign(new Error('Gagal terhubung ke server.'), {
                category: 'network'
            }))
            .mockResolvedValueOnce({
                data: { data: { sessionId: 17, expectedClosingCash: '999999.0000' } }
            });
        render(<CurrentCashSession />);

        await user.click(await screen.findByRole('button', { name: 'Tutup sesi kas' }));
        expect(await screen.findByText('Gagal terhubung ke server.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Konfirmasi tutup sesi' })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByText('Rp 999.999')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Konfirmasi tutup sesi' })).toBeEnabled();
        expect(cashSessionApi.getExpectedCash).toHaveBeenCalledTimes(2);
    });

    it('aborts an unfinished preview request when the close dialog is dismissed', async () => {
        const user = userEvent.setup();
        const previewRequest = deferred();
        cashSessionApi.getCurrentSession.mockResolvedValue({ data: { data: currentSession } });
        cashSessionApi.getExpectedCash.mockReturnValue(previewRequest.promise);
        render(<CurrentCashSession />);

        await user.click(await screen.findByRole('button', { name: 'Tutup sesi kas' }));
        await waitFor(() => expect(cashSessionApi.getExpectedCash).toHaveBeenCalledTimes(1));
        const previewOptions = cashSessionApi.getExpectedCash.mock.calls[0][1];
        expect(previewOptions.signal).toBeInstanceOf(AbortSignal);
        expect(previewOptions.signal.aborted).toBe(false);

        await user.click(screen.getByRole('button', { name: 'Batal' }));

        await waitFor(() => expect(previewOptions.signal.aborted).toBe(true));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
});
