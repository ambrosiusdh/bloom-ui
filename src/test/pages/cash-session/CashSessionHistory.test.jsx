import { Route, Routes, useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import cashSessionApi from '@api/cash-session.js';
import CashSessionDetail from '@pages/cash-session/CashSessionDetail.jsx';
import CashSessionHistory from '@pages/cash-session/CashSessionHistory.jsx';
import useCashSessionStore from '@stores/modules/cash-session.js';
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within
} from '@/test/render.jsx';

vi.mock('@api/cash-session.js', () => ({
    default: {
        getCurrentSession: vi.fn(),
        openSession: vi.fn(),
        getExpectedCash: vi.fn(),
        closeSession: vi.fn(),
        getSessionHistory: vi.fn(),
        getSessionDetails: vi.fn()
    }
}));

const closedSession = {
    id: 17,
    openingCash: '100000.0000',
    expectedClosingCash: '110000.0000',
    actualClosingCash: '108000.0000',
    difference: '-2000.0000',
    openedAt: '2026-08-25T03:00:00Z',
    openedBy: 'admin',
    closedAt: '2026-08-25T10:00:00Z',
    closedBy: 'manager',
    status: 'CLOSED'
};

const openSession = {
    id: 18,
    openingCash: '250000.5000',
    expectedClosingCash: '250000.5000',
    actualClosingCash: null,
    difference: null,
    openedAt: '2026-08-25T11:00:00Z',
    openedBy: 'admin',
    closedAt: null,
    closedBy: null,
    status: 'OPEN'
};

const overSession = {
    ...closedSession,
    id: 19,
    actualClosingCash: '112000.0000',
    difference: '2000.0000'
};

const historyResponse = ({
    content = [],
    totalElements = content.length,
    totalPages = content.length ? 1 : 0
} = {}) => ({
    data: {
        data: {
            content,
            totalElements,
            totalPages
        }
    }
});
const noSessionResponse = () => ({ data: { data: null } });
const detailResponse = session => ({ data: { data: session } });
const renderDetail = route => render(
    <Routes>
        <Route path="/cash-sessions/:sessionId" element={ <CashSessionDetail /> } />
    </Routes>,
    { route }
);

function LocationProbe() {
    const location = useLocation();
    return <output aria-label="Query saat ini">{ location.search }</output>;
}

describe('CashSessionHistory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cashSessionApi.getCurrentSession.mockResolvedValue(noSessionResponse());
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

    it('renders open and closed backend records directly with responsive summaries', async () => {
        cashSessionApi.getSessionHistory.mockResolvedValue(historyResponse({
            content: [openSession, overSession, closedSession],
            totalElements: 13,
            totalPages: 2
        }));
        render(<CashSessionHistory />, { route: '/cash-sessions?page=2&size=10' });

        expect(await screen.findAllByText('Sesi #18')).not.toHaveLength(0);
        expect(screen.getAllByLabelText('Status sesi: Terbuka')).not.toHaveLength(0);
        expect(screen.getAllByLabelText('Status sesi: Ditutup')).not.toHaveLength(0);
        expect(screen.getAllByText('Rp 250.000,5')).not.toHaveLength(0);
        expect(screen.getAllByText('Rp 110.000')).not.toHaveLength(0);
        expect(screen.getAllByText('-Rp 2.000')).not.toHaveLength(0);
        expect(screen.getAllByText('+Rp 2.000')).not.toHaveLength(0);
        expect(screen.getAllByText('Kurang')[0]).toHaveClass('bg-red-100', 'text-red-800', 'font-bold');
        expect(screen.getAllByText('Lebih')[0]).toHaveClass('bg-amber-100', 'text-amber-900', 'font-bold');
        expect(screen.getAllByText('-Rp 2.000')[0]).toHaveClass('text-red-700');
        expect(screen.getAllByText('+Rp 2.000')[0]).toHaveClass('text-amber-700');
        expect(screen.getAllByText(/25 Agu 2026, .* WIB/)).not.toHaveLength(0);
        const openRecord = screen.getAllByRole('article')
            .find(record => within(record).queryByText('Sesi #18'));
        expect(within(openRecord).getByText('Dibuka oleh & pada')).toBeInTheDocument();
        expect(within(openRecord).getByText('Kas awal')).toBeInTheDocument();
        expect(within(openRecord).getByText('Kas diharapkan')).toBeInTheDocument();
        expect(within(openRecord).getByText('Kas aktual')).toBeInTheDocument();
        expect(within(openRecord).getByText('Selisih')).toBeInTheDocument();
        expect(within(openRecord).getAllByText('Belum final')).toHaveLength(2);
        expect(within(openRecord).getByText('Belum ditutup')).toBeInTheDocument();
        expect(within(openRecord).getByRole('link', { name: 'Lihat detail' }))
            .toHaveAttribute('href', '/cash-sessions/18');
        expect(screen.getByText('11–13 dari 13 sesi')).toBeInTheDocument();
        expect(screen.getByText('Halaman 2 dari 2')).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Berikutnya' })).toBeDisabled();
        expect(cashSessionApi.getSessionHistory).toHaveBeenCalledTimes(1);
        expect(cashSessionApi.getSessionHistory).toHaveBeenCalledWith(expect.objectContaining({
            params: { page: 2, size: 10 }
        }));
        expect(cashSessionApi.getSessionDetails).not.toHaveBeenCalled();
        expect(cashSessionApi.getCurrentSession).toHaveBeenCalledTimes(1);
    });

    it('refreshes only the server history after a session is opened', async () => {
        const user = userEvent.setup();
        cashSessionApi.getSessionHistory.mockResolvedValue(historyResponse());
        cashSessionApi.openSession.mockResolvedValue({
            data: { data: openSession }
        });
        render(<CashSessionHistory />);

        await user.click(await screen.findByRole('button', { name: 'Buka sesi kas' }));
        await user.type(screen.getByLabelText(/Modal awal/), '250000,50');
        await user.click(screen.getByRole('button', { name: 'Buka sesi' }));

        expect(await screen.findByText('Sesi kas #18 berhasil dibuka.')).toBeInTheDocument();
        expect(cashSessionApi.openSession).toHaveBeenCalledWith({
            data: { openingCash: '250000.50' }
        }, undefined);
        await waitFor(() => expect(cashSessionApi.getSessionHistory).toHaveBeenCalledTimes(2));
        expect(cashSessionApi.getCurrentSession).toHaveBeenCalledTimes(1);
    });

    it('navigates the server pages with labelled previous and next actions', async () => {
        const user = userEvent.setup();
        cashSessionApi.getSessionHistory.mockResolvedValue(historyResponse({
            content: [closedSession],
            totalElements: 25,
            totalPages: 3
        }));
        render(<CashSessionHistory />, { route: '/cash-sessions?page=2&size=10' });

        await screen.findByText('11–11 dari 25 sesi');
        await user.click(screen.getByRole('button', { name: 'Sebelumnya' }));
        await waitFor(() => expect(cashSessionApi.getSessionHistory).toHaveBeenLastCalledWith(
            expect.objectContaining({
                params: {
                    page: 1,
                    size: 10
                }
            })
        ));

        await user.click(screen.getByRole('button', { name: 'Berikutnya' }));
        await waitFor(() => expect(cashSessionApi.getSessionHistory).toHaveBeenLastCalledWith(
            expect.objectContaining({
                params: {
                    page: 2,
                    size: 10
                }
            })
        ));
    });

    it('announces loading, exposes retry, and explains a filtered empty result', async () => {
        const user = userEvent.setup();
        let rejectRequest;
        cashSessionApi.getSessionHistory
            .mockReturnValueOnce(new Promise((_, reject) => { rejectRequest = reject; }))
            .mockResolvedValueOnce(historyResponse());
        render(<CashSessionHistory />, { route: '/cash-sessions?status=CLOSED' });

        expect(screen.getByText('Memuat sesi kas...')).toBeInTheDocument();
        rejectRequest(new Error('Riwayat sesi gagal dimuat.'));
        expect(await screen.findByRole('alert')).toHaveTextContent('Riwayat sesi gagal dimuat.');
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect(await screen.findByText('Tidak ada sesi kas')).toBeInTheDocument();
        expect(screen.getByText('Ubah atau hapus filter untuk melihat sesi lain.')).toBeInTheDocument();
        expect(cashSessionApi.getSessionHistory).toHaveBeenCalledTimes(2);
    });

    it('applies only the supported status filter and resets the requested page', async () => {
        const user = userEvent.setup();
        cashSessionApi.getSessionHistory.mockResolvedValue(historyResponse());
        render(<CashSessionHistory />, { route: '/cash-sessions?page=3&size=50' });
        await screen.findByText('Tidak ada sesi kas');

        await user.click(screen.getByRole('combobox', { name: 'Status sesi' }));
        await user.click(screen.getByRole('option', { name: 'Ditutup' }));

        await waitFor(() => expect(cashSessionApi.getSessionHistory).toHaveBeenLastCalledWith(expect.objectContaining({
            params: { page: 1, size: 50, status: 'CLOSED' }
        })));
        fireEvent.click(screen.getByRole('button', { name: 'Hapus filter' }));
        await waitFor(() => expect(cashSessionApi.getSessionHistory).toHaveBeenLastCalledWith(expect.objectContaining({
            params: { page: 1, size: 50 }
        })));
    });

    it('replaces invalid query values before making one canonical request', async () => {
        cashSessionApi.getSessionHistory.mockResolvedValue(historyResponse());
        render(
            <>
                <CashSessionHistory />
                <LocationProbe />
            </>,
            { route: '/cash-sessions?page=0&size=999&status=closed&keep=true' }
        );

        expect(await screen.findByRole('status', { name: 'Query saat ini' }))
            .toHaveTextContent('?page=1&size=20&keep=true');
        await screen.findByText('Tidak ada sesi kas');
        expect(cashSessionApi.getSessionHistory).toHaveBeenCalledTimes(1);
        expect(cashSessionApi.getSessionHistory).toHaveBeenCalledWith(expect.objectContaining({
            params: { page: 1, size: 20 }
        }));
    });
});

describe('CashSessionDetail', () => {
    beforeEach(() => vi.clearAllMocks());

    it('shows server-confirmed closed reconciliation and audit fields', async () => {
        cashSessionApi.getSessionDetails.mockResolvedValue(detailResponse(closedSession));
        renderDetail('/cash-sessions/17');

        expect(await screen.findByRole('heading', { name: 'Detail Sesi Kas #17' })).toBeInTheDocument();
        expect(screen.getByLabelText('Status sesi: Ditutup')).toBeInTheDocument();
        expect(screen.getByText('Kas diharapkan').nextSibling).toHaveTextContent('Rp 110.000');
        expect(screen.getByText('Kas aktual').nextSibling).toHaveTextContent('Rp 108.000');
        const reconciliation = screen.getByRole('heading', {
            name: 'Penutupan dan rekonsiliasi'
        }).closest('section');
        expect(within(reconciliation).getByText('Selisih resmi')).toBeInTheDocument();
        expect(within(reconciliation).getByText('Kurang')).toHaveClass(
            'bg-red-100',
            'text-red-800'
        );
        expect(within(reconciliation).getByText('-Rp 2.000')).toHaveClass('text-red-700');
        expect(screen.getByText('manager')).toBeInTheDocument();
        expect(screen.getAllByText(/25 Agu 2026, .* WIB/)).not.toHaveLength(0);
        expect(cashSessionApi.getSessionDetails).toHaveBeenCalledTimes(1);
        expect(cashSessionApi.getSessionHistory).not.toHaveBeenCalled();
    });

    it('retries a failed detail and keeps unavailable open-session results explicit', async () => {
        cashSessionApi.getSessionDetails
            .mockRejectedValueOnce(new Error('Detail gagal dimuat.'))
            .mockResolvedValueOnce(detailResponse(openSession));
        renderDetail('/cash-sessions/18');

        expect(await screen.findByRole('alert')).toHaveTextContent('Detail gagal dimuat.');
        fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect(await screen.findByLabelText('Status sesi: Terbuka')).toBeInTheDocument();
        expect(screen.getByText(/Nilai kas aktual dan hasil selisih tersedia/)).toBeInTheDocument();
        expect(screen.getByText('Belum ada hasil penutupan untuk sesi ini.')).toBeInTheDocument();
        expect(screen.queryByText('Kas aktual')).not.toBeInTheDocument();
        expect(cashSessionApi.getSessionDetails).toHaveBeenCalledTimes(2);
    });

    it('rejects an invalid route ID without making a backend request', async () => {
        renderDetail('/cash-sessions/not-a-number');
        expect(await screen.findByRole('alert')).toHaveTextContent('ID sesi kas tidak valid.');
        expect(cashSessionApi.getSessionDetails).not.toHaveBeenCalled();
    });
});
