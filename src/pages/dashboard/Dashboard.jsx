import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Paper, Typography } from '@mui/material';
import {
    ShoppingCart,
    DollarSign,
    Package,
    RefreshCw,
    TrendingUp
} from 'lucide-react';


// Components
import LowStockAlert from '@components/dashboard/LowStockAlert';
import RecentTransactions from '@components/dashboard/RecentTransactions';
import RevenueChart from '@components/dashboard/RevenueChart';
import SummaryCard from '@components/dashboard/SummaryCard';
import TopCategories from '@components/dashboard/TopCategories';
import { useDashboardStore } from '@stores/index.js';

export default function Dashboard() {
    const [revenueFilter, setRevenueFilter] = useState('week');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshMessage, setRefreshMessage] = useState('');
    const errorAlertRef = useRef(null);
    const requestInFlightRef = useRef(false);

    const getDashboardOverview = useDashboardStore(state => state.getDashboardOverview);
    const dashboardData = useDashboardStore(state => state.dashboardData);
    const isLoading = useDashboardStore(state => state.isLoading);
    const error = useDashboardStore(state => state.error);
    const hasDashboardData = dashboardData !== null;

    const fetchDashboardData = useCallback(async ({ isRefresh = false } = {}) => {
        if (requestInFlightRef.current) return;

        requestInFlightRef.current = true;
        setRefreshMessage('');
        try {
            await getDashboardOverview();
            setLastUpdated(new Date());
            if (isRefresh) {
                setRefreshMessage('Data dashboard berhasil diperbarui.');
            }
        } catch {
            // The store exposes the normalized error for the accessible alert below.
        } finally {
            requestInFlightRef.current = false;
        }
    }, [getDashboardOverview]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        if (error) {
            errorAlertRef.current?.focus();
        }
    }, [error]);

    // Data Mapping
    const summaryList = dashboardData?.summary || [];
    const chartData = dashboardData?.revenueChart?.[revenueFilter] || [];
    const recentTransactionsData = dashboardData?.recentTransactions || [];
    const topCategoriesData = dashboardData?.topCategories || [];
    const lowStockData = dashboardData?.lowStock || [];

    // Helper to get icon based on label (since API doesn't provide icon)
    const getIconForLabel = (label) => {
        const lowerLabel = label?.toLowerCase() || '';
        if (lowerLabel.includes('pendapatan')) return DollarSign;
        if (lowerLabel.includes('pesanan') || lowerLabel.includes('transaksi')) return ShoppingCart;
        if (lowerLabel.includes('barang') || lowerLabel.includes('item')) return Package;
        return TrendingUp; // Default
    };

    return (
        <div
            className="dashboard p-4 bg-gray-50 min-h-screen flex flex-col gap-6"
            aria-busy={ isLoading }
        >
            { /* Header */ }
            <div className="dashboard__header flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <Typography
                        variant="h4"
                        component="h1"
                        className="font-bold mb-1 text-gray-900"
                    >
                        Dashboard
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Ringkasan performa toko Anda hari ini.
                    </Typography>
                </div>
                <div className="dashboard__actions flex flex-wrap items-center gap-3 sm:justify-end">
                    <Typography
                        id="dashboard-last-updated"
                        variant="caption"
                        className="text-gray-500"
                        aria-live="polite"
                    >
                        { lastUpdated
                            ? `Terakhir diperbarui: ${lastUpdated.toLocaleTimeString('id-ID')}`
                            : 'Belum pernah diperbarui' }
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={ (
                            <RefreshCw
                                size={ 16 }
                                className={ isLoading ? 'animate-spin' : '' }
                                aria-hidden="true"
                            />
                        ) }
                        onClick={ () => fetchDashboardData({ isRefresh: true }) }
                        disabled={ isLoading }
                        aria-describedby="dashboard-last-updated"
                        className="text-maroon-600 border-maroon-600 hover:bg-maroon-600/5"
                    >
                        { isLoading ? 'Memuat...' : 'Perbarui data' }
                    </Button>
                </div>
            </div>

            { isLoading && !hasDashboardData && (
                <Alert
                    severity="info"
                    role="status"
                    aria-live="polite"
                >
                    Memuat data dashboard...
                </Alert>
            ) }

            { isLoading && hasDashboardData && (
                <Alert
                    severity="info"
                    role="status"
                    aria-live="polite"
                >
                    Memperbarui data dashboard. Data sebelumnya tetap ditampilkan.
                </Alert>
            ) }

            { error && (
                <Alert
                    ref={ errorAlertRef }
                    severity="error"
                    role="alert"
                    tabIndex={ -1 }
                    action={ (
                        <Button
                            color="inherit"
                            size="small"
                            onClick={ () => fetchDashboardData({ isRefresh: hasDashboardData }) }
                            disabled={ isLoading }
                        >
                            Coba lagi
                        </Button>
                    ) }
                >
                    { hasDashboardData
                        ? 'Data terbaru gagal dimuat. Data terakhir yang berhasil dimuat masih ditampilkan.'
                        : 'Data dashboard gagal dimuat. Periksa koneksi Anda lalu coba lagi.' }
                </Alert>
            ) }

            { refreshMessage && !error && (
                <Alert
                    severity="success"
                    role="status"
                    aria-live="polite"
                >
                    { refreshMessage }
                </Alert>
            ) }

            { hasDashboardData && (
                <>
            { /* Top Section: Summary Cards & Revenue Chart */ }
            <div className="dashboard__top-section flex flex-col md:flex-row gap-6">
                { /* Left Column: Summary Cards (Stacked) */ }
                <section
                    className="flex flex-col gap-4 md:w-1/4 md:min-w-[250px]"
                    aria-label="Ringkasan dashboard"
                >
                    { summaryList.length > 0 ? (
                        summaryList.map(item => (
                            <div key={ item.label } className="flex-1">
                                <SummaryCard
                                    title={ item.label }
                                    value={ item.summary }
                                    icon={ getIconForLabel(item.label) }
                                />
                            </div>
                        ))
                    ) : (
                        <Paper className="p-6 rounded-xl shadow-md">
                            <Typography
                                role="status"
                                className="text-gray-600 text-center"
                            >
                                Ringkasan belum tersedia.
                            </Typography>
                        </Paper>
                    ) }
                </section>

                { /* Right Column: Revenue Chart (Flex Grow) */ }
                <div className="flex-1 min-w-0 min-h-[400px]">
                    <RevenueChart
                        data={ chartData }
                        filter={ revenueFilter }
                        onFilterChange={ (e) => setRevenueFilter(e.target.value) }
                    />
                </div>
            </div>

            { /* Bottom Section: Recent Transactions, Top Categories, Low Stock */ }
            <div className="dashboard__bottom-section flex flex-col lg:flex-row gap-6">
                <div className="flex-[2]">
                    <RecentTransactions data={ recentTransactionsData } />
                </div>
                <div className="flex-1">
                    <TopCategories data={ topCategoriesData } />
                </div>
                <div className="flex-[1.5]">
                    <LowStockAlert data={ lowStockData } />
                </div>
            </div>
                </>
            ) }
        </div>
    );
}
