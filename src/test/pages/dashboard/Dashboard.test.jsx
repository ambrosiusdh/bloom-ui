import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Dashboard from '@pages/dashboard/Dashboard.jsx';
import useDashboardStore from '@stores/modules/dashboard.js';
import { act, fireEvent, render, screen, waitFor, within } from '@/test/render.jsx';

const dashboardApi = vi.hoisted(() => ({
    getOperationalOverview: vi.fn()
}));

vi.mock('@api/dashboard.js', () => ({ default: dashboardApi }));

const drillDown = (destination, overrides = {}) => ({
    destination,
    reference: null,
    startDate: null,
    endDate: null,
    ...overrides
});

const salesDay = (businessDate, salesAmount = '0.0000', transactionCount = 0) => ({
    businessDate,
    salesAmount,
    transactionCount,
    periodStart: `${ businessDate }T00:00:00Z`,
    periodEndExclusive: `${ businessDate }T23:59:59Z`
});

const emptySalesDays = [
    '2026-09-06',
    '2026-09-07',
    '2026-09-08',
    '2026-09-09',
    '2026-09-10',
    '2026-09-11',
    '2026-09-12'
].map(date => salesDay(date));

const emptyOverview = {
    asOf: '2026-09-11T18:30:00Z',
    freshUntil: '2999-09-11T18:35:00Z',
    businessDate: '2026-09-12',
    storeZoneId: 'Asia/Jakarta',
    salesToday: {
        salesAmount: '0.0000',
        transactionCount: 0,
        periodStart: '2026-09-11T17:00:00Z',
        periodEndExclusive: '2026-09-12T17:00:00Z',
        drillDown: drillDown('SALES_HISTORY', {
            startDate: '2026-09-12',
            endDate: '2026-09-12'
        })
    },
    salesLast7Days: {
        periodStartDate: '2026-09-06',
        periodEndDate: '2026-09-12',
        totalSalesAmount: '0.0000',
        totalTransactionCount: 0,
        days: emptySalesDays,
        drillDown: drillDown('SALES_HISTORY', {
            startDate: '2026-09-06',
            endDate: '2026-09-12'
        })
    },
    stockAttention: {
        outOfStockCount: 0,
        lowStockCount: 0,
        threshold: '10.0000',
        location: 'STORE',
        preview: [],
        drillDown: drillDown('ITEM_LIST')
    },
    currentCashSession: {
        state: 'NONE',
        sessionId: null,
        openedAt: null,
        openedBy: null,
        openingCash: null,
        totalCashIn: null,
        totalCashOut: null,
        expectedClosingCash: null,
        activeExpenseAmount: null,
        activeExpenseCount: null,
        drillDowns: [drillDown('CASH_SESSION_HISTORY')]
    },
    supplierPayables: {
        outstandingAmount: '0.0000',
        openReceiptCount: 0,
        drillDown: drillDown('PAYABLES')
    }
};

const populatedOverview = {
    ...emptyOverview,
    salesToday: {
        ...emptyOverview.salesToday,
        salesAmount: '250000.1250',
        transactionCount: 12
    },
    salesLast7Days: {
        ...emptyOverview.salesLast7Days,
        totalSalesAmount: '450000.3750',
        totalTransactionCount: 20,
        days: [
            ...emptySalesDays.slice(0, 5),
            salesDay('2026-09-11', '200000.2500', 8),
            salesDay('2026-09-12', '250000.1250', 12)
        ]
    },
    stockAttention: {
        outOfStockCount: 1,
        lowStockCount: 1,
        threshold: '10.0000',
        location: 'STORE',
        preview: [{
            itemId: 41,
            sku: 'KAIN-001',
            name: 'Kain habis',
            baseUnitOfMeasure: 'METER',
            stockStore: '0.0000',
            state: 'OUT_OF_STOCK'
        }, {
            itemId: 52,
            sku: 'KAIN-002',
            name: 'Kain menipis',
            baseUnitOfMeasure: 'METER',
            stockStore: '0.2500',
            state: 'LOW_STOCK'
        }],
        drillDown: drillDown('ITEM_LIST')
    },
    currentCashSession: {
        state: 'OPEN',
        sessionId: 7,
        openedAt: '2026-09-11T18:05:00Z',
        openedBy: 'admin',
        openingCash: '100000.0000',
        totalCashIn: '175000.1250',
        totalCashOut: '25000.5000',
        expectedClosingCash: '249999.6250',
        activeExpenseAmount: '5000.5000',
        activeExpenseCount: 2,
        drillDowns: [
            drillDown('CASH_SESSION_DETAIL', { reference: '7' }),
            drillDown('EXPENSE_HISTORY')
        ]
    },
    supplierPayables: {
        outstandingAmount: '82500.2500',
        openReceiptCount: 3,
        drillDown: drillDown('PAYABLES')
    }
};

const response = data => ({ data: { data } });

const deferred = () => {
    let reject;
    let resolve;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        reject = rejectPromise;
        resolve = resolvePromise;
    });

    return {
        promise,
        reject,
        resolve
    };
};

describe('Release 1 operational dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        dashboardApi.getOperationalOverview.mockReset();
        useDashboardStore.setState({
            dashboardData: null,
            lastSuccessfulAt: null,
            error: null,
            isLoading: false
        });
    });

    it('announces loading and distinguishes zero metrics from no open cash session', async () => {
        const request = deferred();
        dashboardApi.getOperationalOverview.mockReturnValue(request.promise);
        render(<Dashboard />, { route: '/dashboard' });

        expect(await screen.findByRole('status')).toHaveTextContent('Memuat ringkasan operasional...');
        expect(screen.getByRole('button', { name: 'Memuat...' })).toBeDisabled();
        expect(screen.queryByText('Penjualan hari ini')).not.toBeInTheDocument();

        await act(async () => request.resolve(response(emptyOverview)));

        const sales = await screen.findByRole('region', { name: 'Penjualan hari ini' });
        const cashSession = screen.getByRole('region', { name: 'Sesi kas saat ini' });
        const expenses = screen.getByRole('region', { name: 'Pengeluaran sesi aktif' });
        const payables = screen.getByRole('region', { name: 'Utang pemasok' });
        const widgetGrid = screen.getByLabelText('Ringkasan operasional');

        expect(widgetGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3');
        expect(within(sales).getByLabelText('Total penjualan hari ini Rp 0')).toBeInTheDocument();
        expect(within(sales).getByText('Belum ada transaksi penjualan pada hari bisnis ini.'))
            .toBeInTheDocument();
        expect(within(cashSession).getByLabelText('Status sesi kas: tidak ada sesi'))
            .toBeInTheDocument();
        expect(within(cashSession).getByText(/belum ada sesi yang menjadi acuan/i))
            .toBeInTheDocument();
        expect(within(expenses).getByText(/tidak ada sesi kas terbuka/i)).toBeInTheDocument();
        expect(within(payables).getByLabelText('Total utang pemasok belum dibayar Rp 0'))
            .toBeInTheDocument();
        expect(screen.getByText(/Terakhir diperbarui:/)).toHaveTextContent('12 Sep 2026');
        expect(screen.getByText(/Terakhir diperbarui:/)).toHaveTextContent('Zona Asia/Jakarta');
        expect(screen.getByRole('region', { name: 'Penjualan 7 hari terakhir' }))
            .toHaveTextContent('Rp 0');
        expect(screen.getByRole('complementary', { name: 'Perlu perhatian' }))
            .toHaveTextContent('Tidak ada utang pemasok atau stok STORE');
    });

    it('renders Indonesian values and only backend-recognized completed drill-down routes', async () => {
        dashboardApi.getOperationalOverview.mockResolvedValue(response(populatedOverview));
        render(<Dashboard />, { route: '/dashboard' });

        const sales = await screen.findByRole('region', { name: 'Penjualan hari ini' });
        const cashSession = screen.getByRole('region', { name: 'Sesi kas saat ini' });
        const expenses = screen.getByRole('region', { name: 'Pengeluaran sesi aktif' });
        const payables = screen.getByRole('region', { name: 'Utang pemasok' });
        const chart = screen.getByRole('region', { name: 'Penjualan 7 hari terakhir' });
        const attention = screen.getByRole('complementary', { name: 'Perlu perhatian' });

        expect(within(sales).getByText('Rp 250.000,125')).toBeInTheDocument();
        expect(within(sales).getByLabelText('12 transaksi penjualan hari ini'))
            .toBeInTheDocument();
        expect(within(cashSession).getByText(/Dibuka oleh admin pada/)).toBeInTheDocument();
        expect(within(cashSession).getByText('Rp 249.999,625')).toBeInTheDocument();
        expect(within(expenses).getByText('Rp 5.000,5')).toBeInTheDocument();
        expect(within(payables).getByText('Rp 82.500,25')).toBeInTheDocument();
        expect(within(chart).getByLabelText('Total penjualan tujuh hari Rp 450.000,375'))
            .toBeInTheDocument();
        expect(within(chart).getByText('20 transaksi dalam 7 hari')).toBeInTheDocument();
        expect(within(attention).getByText('Kain habis')).toBeInTheDocument();
        expect(within(attention).getByText(/KAIN-002.*0,25 meter/)).toBeInTheDocument();

        expect(screen.getByRole('link', { name: 'Buka riwayat penjualan hari ini' }))
            .toHaveAttribute('href', '/sales?startDate=2026-09-12&endDate=2026-09-12');
        expect(screen.getAllByRole('link', { name: 'Buka detail sesi kas' })
            .every(link => link.getAttribute('href') === '/cash-sessions/7')).toBe(true);
        expect(screen.getAllByRole('link', { name: 'Buka riwayat pengeluaran' })
            .every(link => link.getAttribute('href') === '/expenses')).toBe(true);
        expect(screen.getByRole('link', { name: 'Buka daftar utang pemasok' }))
            .toHaveAttribute('href', '/payables');
        expect(screen.getByRole('link', { name: 'Buka riwayat penjualan 7 hari' }))
            .toHaveAttribute('href', '/sales?startDate=2026-09-06&endDate=2026-09-12');
        expect(screen.getByRole('link', { name: 'Buka data barang' }))
            .toHaveAttribute('href', '/items');
    });

    it('makes every sales day keyboard reachable and shows exact selected-day detail', async () => {
        const user = userEvent.setup();
        dashboardApi.getOperationalOverview.mockResolvedValue(response(populatedOverview));
        render(<Dashboard />, { route: '/dashboard' });

        const chart = await screen.findByRole('region', { name: 'Penjualan 7 hari terakhir' });
        const days = within(chart).getAllByRole('button');
        expect(days).toHaveLength(7);
        expect(days.every(day => day.getAttribute('tabindex') !== '-1')).toBe(true);
        expect(days[6]).toHaveAttribute('aria-pressed', 'true');
        expect(within(chart).getByLabelText(
            'Rincian hari terpilih 12 September 2026, Rp 250.000,125, 12 transaksi'
        )).toBeInTheDocument();

        days[5].focus();
        await user.keyboard('{ArrowRight}');
        expect(days[6]).toHaveFocus();
        await user.keyboard('{Home}');
        expect(days[0]).toHaveFocus();
        expect(days[0]).toHaveAttribute('aria-pressed', 'true');
        expect(within(chart).getByLabelText(
            'Rincian hari terpilih 6 September 2026, Rp 0, 0 transaksi'
        )).toBeInTheDocument();
    });

    it('keeps server-confirmed values during refresh, focuses failures, and retries', async () => {
        const user = userEvent.setup();
        const refreshRequest = deferred();
        dashboardApi.getOperationalOverview
            .mockResolvedValueOnce(response(emptyOverview))
            .mockReturnValueOnce(refreshRequest.promise)
            .mockResolvedValueOnce(response(populatedOverview));
        render(<Dashboard />, { route: '/dashboard' });

        const refreshButton = await screen.findByRole('button', { name: 'Perbarui data' });
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);

        expect(screen.getByText(/Memperbarui data dashboard/).closest('[role="status"]'))
            .toBeInTheDocument();
        expect(screen.getByLabelText('Total penjualan hari ini Rp 0')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Memuat...' })).toBeDisabled();
        expect(dashboardApi.getOperationalOverview).toHaveBeenCalledTimes(2);

        await act(async () => refreshRequest.reject(new Error('Server gagal')));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Data terakhir yang berhasil dimuat masih ditampilkan');
        expect(alert).toHaveFocus();
        expect(screen.getByLabelText('Total penjualan hari ini Rp 0')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect((await screen.findByText('Data dashboard berhasil diperbarui.'))
            .closest('[role="status"]')).toBeInTheDocument();
        expect(screen.getByLabelText('Total penjualan hari ini Rp 250.000,125'))
            .toBeInTheDocument();
        expect(dashboardApi.getOperationalOverview).toHaveBeenCalledTimes(3);
    });

    it('shows a recoverable initial error without rendering metric cards', async () => {
        const user = userEvent.setup();
        dashboardApi.getOperationalOverview
            .mockRejectedValueOnce(new Error('Server gagal'))
            .mockResolvedValueOnce(response(emptyOverview));
        render(<Dashboard />, { route: '/dashboard' });

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Data dashboard gagal dimuat');
        expect(alert).toHaveFocus();
        expect(screen.queryByText('Penjualan hari ini')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        await waitFor(() => expect(screen.getByText('Penjualan hari ini')).toBeInTheDocument());
        expect(screen.queryByText('Data dashboard gagal dimuat. Periksa koneksi Anda lalu coba lagi.'))
            .not.toBeInTheDocument();
    });

    it('labels retained data stale from the backend freshUntil value', async () => {
        dashboardApi.getOperationalOverview.mockResolvedValue(response({
            ...emptyOverview,
            freshUntil: '2000-01-01T00:00:00Z'
        }));
        render(<Dashboard />, { route: '/dashboard' });

        expect(await screen.findByText(/sudah kedaluwarsa menurut batas waktu dari server/i))
            .toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Penjualan hari ini' })).toBeInTheDocument();
    });

    it('does not create a link for an unknown or malformed drill-down', async () => {
        dashboardApi.getOperationalOverview.mockResolvedValue(response({
            ...emptyOverview,
            salesToday: {
                ...emptyOverview.salesToday,
                drillDown: drillDown('REPORTING_SUITE')
            },
            supplierPayables: {
                ...emptyOverview.supplierPayables,
                drillDown: drillDown('CASH_SESSION_DETAIL', { reference: '../admin' })
            },
            salesLast7Days: {
                ...emptyOverview.salesLast7Days,
                drillDown: drillDown('SALES_HISTORY', {
                    startDate: 'invalid',
                    endDate: '2026-09-12'
                })
            },
            stockAttention: {
                ...emptyOverview.stockAttention,
                outOfStockCount: 1,
                drillDown: drillDown('UNSUPPORTED_ITEMS')
            }
        }));
        render(<Dashboard />, { route: '/dashboard' });

        await screen.findByText('Penjualan hari ini');
        expect(screen.queryByRole('link', { name: 'Buka riwayat penjualan hari ini' }))
            .not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Buka daftar utang pemasok' }))
            .not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Buka riwayat penjualan 7 hari' }))
            .not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Buka data barang' }))
            .not.toBeInTheDocument();
    });
});
