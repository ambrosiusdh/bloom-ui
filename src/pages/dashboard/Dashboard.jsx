import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Typography } from '@mui/material';
import { RefreshCw } from 'lucide-react';

import OperationalDashboardWidgets from '@components/dashboard/OperationalDashboardWidgets.jsx';
import { useDashboardStore } from '@stores/index.js';

const formatDashboardTimestamp = (value, timeZone) => {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return 'waktu tidak tersedia';

    try {
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone
        }).format(date);
    } catch {
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    }
};

export default function Dashboard() {
    const [refreshMessage, setRefreshMessage] = useState('');
    const [isStale, setIsStale] = useState(false);
    const errorAlertRef = useRef(null);
    const requestInFlightRef = useRef(false);

    const getOperationalOverview = useDashboardStore(state => state.getOperationalOverview);
    const dashboardData = useDashboardStore(state => state.dashboardData);
    const isLoading = useDashboardStore(state => state.isLoading);
    const error = useDashboardStore(state => state.error);
    const hasDashboardData = dashboardData !== null;

    const fetchDashboardData = useCallback(async ({ isRefresh = false } = {}) => {
        if (requestInFlightRef.current) return;

        requestInFlightRef.current = true;
        setRefreshMessage('');
        try {
            await getOperationalOverview();
            if (isRefresh) {
                setRefreshMessage('Data dashboard berhasil diperbarui.');
            }
        } catch {
            // The shared API boundary supplies the normalized error used by the store.
        } finally {
            requestInFlightRef.current = false;
        }
    }, [getOperationalOverview]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        if (error) {
            errorAlertRef.current?.focus();
        }
    }, [error]);

    useEffect(() => {
        const freshUntil = Date.parse(dashboardData?.freshUntil);
        if (!Number.isFinite(freshUntil)) {
            setIsStale(Boolean(dashboardData));
            return undefined;
        }

        let staleTimer;
        const updateFreshness = () => {
            const remainingFreshness = freshUntil - Date.now();
            setIsStale(remainingFreshness <= 0);

            if (remainingFreshness > 0) {
                staleTimer = window.setTimeout(
                    updateFreshness,
                    Math.min(remainingFreshness, 2_147_483_647)
                );
            }
        };

        updateFreshness();

        return () => window.clearTimeout(staleTimer);
    }, [dashboardData]);

    const lastUpdatedText = dashboardData
        ? formatDashboardTimestamp(dashboardData.asOf, dashboardData.storeZoneId)
        : null;

    return (
        <div className="dashboard flex min-h-screen flex-col gap-6 bg-gray-50 p-4 md:p-6">
            <div className="dashboard__header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Typography
                        variant="h4"
                        component="h1"
                        className="mb-1 font-bold text-gray-900"
                    >
                        Dashboard
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Ringkasan operasional Release 1 dari data yang dihitung server.
                    </Typography>
                </div>
                <div className="dashboard__actions flex flex-wrap items-center gap-3 sm:justify-end">
                    <Typography
                        id="dashboard-last-updated"
                        variant="caption"
                        className="text-gray-500"
                        aria-live="polite"
                    >
                        { lastUpdatedText
                            ? `Data per: ${ lastUpdatedText }`
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
                        className="border-maroon-600 text-maroon-600 hover:bg-maroon-600/5"
                    >
                        { isLoading ? 'Memuat...' : 'Perbarui data' }
                    </Button>
                </div>
            </div>

            { isLoading && !hasDashboardData && (
                <Alert severity="info" role="status" aria-live="polite">
                    Memuat data dashboard...
                </Alert>
            ) }

            { isLoading && hasDashboardData && (
                <Alert severity="info" role="status" aria-live="polite">
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
                <Alert severity="success" role="status" aria-live="polite">
                    { refreshMessage }
                </Alert>
            ) }

            { hasDashboardData && isStale && (
                <Alert severity="warning" role="status" aria-live="polite">
                    Data dashboard sudah kedaluwarsa menurut batas waktu dari server. Perbarui data
                    sebelum mengambil keputusan operasional.
                </Alert>
            ) }

            { hasDashboardData && (
                <OperationalDashboardWidgets data={ dashboardData } />
            ) }
        </div>
    );
}
