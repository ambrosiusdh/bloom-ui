import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Dashboard from '@pages/dashboard/Dashboard.jsx';
import useDashboardStore from '@stores/modules/dashboard.js';
import { act, fireEvent, render, screen, waitFor } from '@/test/render.jsx';

const dashboardApi = vi.hoisted(() => ({
    getDashboardOverview: vi.fn()
}));

vi.mock('@api/dashboard.js', () => ({ default: dashboardApi }));

vi.mock('recharts', () => {
    const Container = ({ children }) => <div>{ children }</div>;
    Container.propTypes = { children: () => null };

    return {
        Area: () => null,
        AreaChart: () => <div />,
        CartesianGrid: () => null,
        Cell: () => null,
        Legend: () => null,
        Pie: Container,
        PieChart: Container,
        ResponsiveContainer: Container,
        Tooltip: () => null,
        XAxis: () => null,
        YAxis: () => null
    };
});

const emptyOverview = {
    summary: [
        { label: 'Total Pendapatan', summary: 'Rp. 0' },
        { label: 'Total Pesanan', summary: '0' },
        { label: 'Total Transaksi', summary: '0' }
    ],
    revenueChart: {
        week: [{ name: 'Senin', revenue: 0 }],
        month: []
    },
    recentTransactions: [],
    topCategories: [],
    lowStock: []
};

const response = data => ({ data: { data } });

const deferred = () => {
    let reject;
    let resolve;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        reject = rejectPromise;
        resolve = resolvePromise;
    });
    return { promise, reject, resolve };
};

describe('Dashboard reliability', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        dashboardApi.getDashboardOverview.mockReset();
        useDashboardStore.setState({
            dashboardData: null,
            lastSuccessfulAt: null,
            error: null,
            isLoading: false
        });
    });

    it('announces initial loading and renders backend zero and empty values explicitly', async () => {
        const request = deferred();
        dashboardApi.getDashboardOverview.mockReturnValue(request.promise);
        render(<Dashboard />, { route: '/dashboard' });

        expect(await screen.findByRole('status')).toHaveTextContent('Memuat data dashboard...');
        expect(screen.getByRole('button', { name: 'Memuat...' })).toBeDisabled();
        expect(screen.queryByText('Total Pendapatan')).not.toBeInTheDocument();

        await act(async () => request.resolve(response(emptyOverview)));

        expect(await screen.findByText('Total Pendapatan')).toBeInTheDocument();
        expect(screen.getByText('Rp. 0')).toBeInTheDocument();
        expect(screen.getAllByText('0')).toHaveLength(2);
        expect(screen.getByText(/Senin:.*Rp\s?0/)).toBeInTheDocument();
        expect(screen.getByText('Belum ada transaksi penjualan.')).toBeInTheDocument();
        expect(screen.getByText('Belum ada data kategori penjualan.')).toBeInTheDocument();
        expect(screen.getByText('Tidak ada barang dengan stok menipis.')).toBeInTheDocument();
        expect(screen.getByText(/Terakhir diperbarui:/)).toBeInTheDocument();
        expect(screen.queryAllByRole('status')).toHaveLength(0);
    });

    it('keeps old values during refresh, focuses failures, and retries successfully', async () => {
        const user = userEvent.setup();
        const refreshRequest = deferred();
        const refreshedOverview = {
            ...emptyOverview,
            summary: [
                { label: 'Total Pendapatan', summary: 'Rp. 25.000' },
                { label: 'Total Pesanan', summary: '2' },
                { label: 'Total Transaksi', summary: '1' }
            ]
        };
        dashboardApi.getDashboardOverview
            .mockResolvedValueOnce(response(emptyOverview))
            .mockReturnValueOnce(refreshRequest.promise)
            .mockResolvedValueOnce(response(refreshedOverview));
        render(<Dashboard />, { route: '/dashboard' });

        const refreshButton = await screen.findByRole('button', { name: 'Perbarui data' });
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);

        expect(
            screen.getByText(/Memperbarui data dashboard/).closest('[role="status"]')
        ).toBeInTheDocument();
        expect(screen.getByText('Rp. 0')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Memuat...' })).toBeDisabled();
        expect(dashboardApi.getDashboardOverview).toHaveBeenCalledTimes(2);

        await act(async () => refreshRequest.reject(new Error('Server gagal')));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Data terakhir yang berhasil dimuat masih ditampilkan');
        expect(alert).toHaveFocus();
        expect(screen.getByText('Rp. 0')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect(
            (await screen.findByText('Data dashboard berhasil diperbarui.'))
                .closest('[role="status"]')
        ).toBeInTheDocument();
        expect(screen.getByText('Rp. 25.000')).toBeInTheDocument();
        expect(dashboardApi.getDashboardOverview).toHaveBeenCalledTimes(3);
    });

    it('shows a recoverable initial error without rendering stale cards', async () => {
        const user = userEvent.setup();
        dashboardApi.getDashboardOverview
            .mockRejectedValueOnce(new Error('Server gagal'))
            .mockResolvedValueOnce(response(emptyOverview));
        render(<Dashboard />, { route: '/dashboard' });

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Data dashboard gagal dimuat');
        expect(alert).toHaveFocus();
        expect(screen.queryByText('Total Pendapatan')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        await waitFor(() => expect(screen.getByText('Total Pendapatan')).toBeInTheDocument());
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('keeps the last successful timestamp consistent after remount and refresh failure', async () => {
        dashboardApi.getDashboardOverview
            .mockResolvedValueOnce(response(emptyOverview))
            .mockRejectedValueOnce(Object.assign(new Error('Gagal terhubung.'), {
                name: 'ApiError',
                category: 'network'
            }));
        const firstRender = render(<Dashboard />, { route: '/dashboard' });

        const firstTimestamp = await screen.findByText(/Terakhir diperbarui:/);
        const timestampText = firstTimestamp.textContent;
        firstRender.unmount();

        render(<Dashboard />, { route: '/dashboard' });

        expect(screen.getByText(timestampText)).toBeInTheDocument();
        expect(screen.queryByText('Belum pernah diperbarui')).not.toBeInTheDocument();
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Data terakhir yang berhasil dimuat masih ditampilkan'
        );
        expect(screen.getByText(timestampText)).toBeInTheDocument();
    });
});
