import React, { useState, useEffect } from 'react';

import { Typography, Button } from '@mui/material';

import {
    ShoppingCart,
    DollarSign,
    Package,
    RefreshCw,
    TrendingUp
} from 'lucide-react';

import { useDashboardStore } from '@stores/index.js';

// Components
import LowStockAlert from '@components/dashboard/LowStockAlert';
import RecentTransactions from '@components/dashboard/RecentTransactions';
import RevenueChart from '@components/dashboard/RevenueChart';
import SummaryCard from '@components/dashboard/SummaryCard';
import TopCategories from '@components/dashboard/TopCategories';

export default function Dashboard() {
    const [revenueFilter, setRevenueFilter] = useState('week');
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const getDashboardOverview = useDashboardStore(state => state.getDashboardOverview);
    const dashboardData = useDashboardStore(state => state.dashboardData);
    const isLoading = useDashboardStore(state => state.isLoading);

    const fetchDashboardData = async () => {
        try {
            await getDashboardOverview();
            setLastUpdated(new Date());
        } catch (error) {
            console.log("Error fetching dashboard data:", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

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
        <div className="dashboard p-4 bg-gray-50 min-h-screen flex flex-col gap-6">
            { /* Header */ }
            <div className="dashboard__header flex justify-between items-center">
                <div>
                    <Typography variant="h4" className="font-bold mb-1 text-gray-900">
                        Dashboard
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Ringkasan performa toko Anda hari ini.
                    </Typography>
                </div>
                <div className="dashboard__actions flex items-center gap-4">
                    <Typography variant="caption" className="text-gray-500 italic">
                        Terakhir diperbarui: { lastUpdated.toLocaleTimeString('id-ID') }
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={ <RefreshCw size={ 16 } className={ isLoading ? "animate-spin" : "" } /> }
                        onClick={ fetchDashboardData }
                        disabled={ isLoading }
                        className="text-maroon-600 border-maroon-600 hover:bg-maroon-600/5"
                    >
                        { isLoading ? 'Memuat...' : 'Refresh Data' }
                    </Button>
                </div>
            </div>

            { /* Top Section: Summary Cards & Revenue Chart */ }
            <div className="dashboard__top-section flex flex-col md:flex-row gap-6">
                { /* Left Column: Summary Cards (Stacked) */ }
                <div className="flex flex-col gap-4 md:w-1/4 min-w-[250px]">
                    { summaryList.length > 0 ? (
                        summaryList.map((item, index) => (
                            <div key={ index } className="flex-1">
                                <SummaryCard
                                    title={ item.label }
                                    value={ item.summary } // API uses 'summary' for the value
                                    icon={ getIconForLabel(item.label) }
                                />
                            </div>
                        ))
                    ) : (
                        // Fallback/Loading skeleton could go here, for now just empty or placeholder
                        <div className="text-gray-500 text-center py-4">Memuat data...</div>
                    ) }
                </div>

                { /* Right Column: Revenue Chart (Flex Grow) */ }
                <div className="flex-1 min-h-[400px]">
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
        </div>
    );
}