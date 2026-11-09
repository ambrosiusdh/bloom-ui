import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Chip, Divider, Paper, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { formatQuantity } from '@utils/quantity-utils.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const formatCount = value => new Intl.NumberFormat('id-ID').format(value ?? 0);

const formatBusinessDate = value => {
    if (!DATE_PATTERN.test(value || '')) return 'tanggal tidak tersedia';

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
        timeZone: 'UTC'
    }).format(new Date(`${ value }T00:00:00Z`));
};

const formatDateTime = (value, timeZone) => {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return 'Waktu tidak tersedia';

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone
    }).format(date);
};

export const getDashboardDrillDownPath = drillDown => {
    if (!drillDown) return null;

    switch (drillDown.destination) {
        case 'SALES_HISTORY':
            if (!DATE_PATTERN.test(drillDown.startDate || '')
                    || !DATE_PATTERN.test(drillDown.endDate || '')) {
                return null;
            }

            return `/sales?startDate=${ encodeURIComponent(drillDown.startDate) }&endDate=${
                encodeURIComponent(drillDown.endDate)
            }`;
        case 'CASH_SESSION_HISTORY':
            return '/cash-sessions';
        case 'CASH_SESSION_DETAIL':
            if (!/^\d+$/.test(drillDown.reference || '')) return null;

            return `/cash-sessions/${ encodeURIComponent(drillDown.reference) }`;
        case 'EXPENSE_HISTORY':
            return '/expenses';
        case 'PAYABLES':
            return '/payables';
        case 'ITEM_LIST':
            return '/items';
        default:
            return null;
    }
};

const DashboardLink = ({ drillDown, label }) => {
    const path = getDashboardDrillDownPath(drillDown);
    if (!path) return null;

    return (
        <Button
            component={ Link }
            to={ path }
            size="small"
            sx={ { alignSelf: 'flex-start' } }
        >
            { label }
        </Button>
    );
};

DashboardLink.propTypes = {
    drillDown: PropTypes.shape({
        destination: PropTypes.string,
        endDate: PropTypes.string,
        reference: PropTypes.string,
        startDate: PropTypes.string
    }),
    label: PropTypes.string.isRequired
};

const Metric = ({ label, value, valueLabel }) => (
    <div>
        <dt className="text-sm text-gray-600">{ label }</dt>
        <dd
            className="mt-1 text-lg font-semibold text-gray-900"
            aria-label={ valueLabel }
        >
            { value }
        </dd>
    </div>
);

Metric.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.node.isRequired,
    valueLabel: PropTypes.string.isRequired
};

const SalesWidget = ({ businessDate, salesToday }) => {
    const formattedAmount = formatRupiah(salesToday.salesAmount);
    const formattedTransactions = formatCount(salesToday.transactionCount);
    const hasSales = Number(salesToday.transactionCount) > 0;

    return (
        <Paper
            component="section"
            aria-labelledby="dashboard-sales-title"
            className="p-5 shadow-md md:p-6"
        >
            <div className="flex h-full flex-col gap-4">
                <div>
                    <Typography
                        id="dashboard-sales-title"
                        variant="h6"
                        component="h2"
                        className="font-bold text-gray-900"
                    >
                        Penjualan hari ini
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        { formatBusinessDate(businessDate) }
                    </Typography>
                </div>

                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <Metric
                        label="Total penjualan"
                        value={ formattedAmount }
                        valueLabel={ `Total penjualan hari ini ${ formattedAmount }` }
                    />
                    <Metric
                        label="Jumlah transaksi"
                        value={ formattedTransactions }
                        valueLabel={ `${ formattedTransactions } transaksi penjualan hari ini` }
                    />
                </dl>

                { !hasSales && (
                    <Typography variant="body2" className="text-gray-600">
                        Belum ada transaksi penjualan pada hari bisnis ini.
                    </Typography>
                ) }

                <div className="mt-auto pt-2">
                    <DashboardLink
                        drillDown={ salesToday.drillDown }
                        label="Buka riwayat penjualan hari ini"
                    />
                </div>
            </div>
        </Paper>
    );
};

SalesWidget.propTypes = {
    businessDate: PropTypes.string.isRequired,
    salesToday: PropTypes.shape({
        drillDown: PropTypes.object,
        salesAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        transactionCount: PropTypes.number.isRequired
    }).isRequired
};

const CurrentCashSessionWidget = ({ currentCashSession, storeZoneId }) => {
    const isOpen = currentCashSession.state === 'OPEN';

    return (
        <Paper
            component="section"
            aria-labelledby="dashboard-cash-session-detail-title"
            className="p-5 shadow-md md:p-6"
        >
            <div className="flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Typography
                            id="dashboard-cash-session-detail-title"
                            variant="h6"
                            component="h2"
                            className="font-bold text-gray-900"
                        >
                            Rincian sesi kas
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                            Ringkasan kas yang dihitung oleh server.
                        </Typography>
                    </div>
                    <Chip
                        label={ isOpen ? 'Buka' : 'Tidak ada sesi' }
                        color={ isOpen ? 'success' : 'default' }
                        size="small"
                        aria-label={ isOpen ? 'Status sesi kas: buka' : 'Status sesi kas: tidak ada sesi' }
                    />
                </div>

                { isOpen ? (
                    <>
                        <Typography variant="body2" className="text-gray-600">
                            Dibuka oleh { currentCashSession.openedBy } pada { ' ' }
                            { formatDateTime(currentCashSession.openedAt, storeZoneId) }.
                        </Typography>
                        <Divider />
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Metric
                                label="Kas awal"
                                value={ formatRupiah(currentCashSession.openingCash) }
                                valueLabel={ `Kas awal ${ formatRupiah(currentCashSession.openingCash) }` }
                            />
                            <Metric
                                label="Perkiraan kas saat ditutup"
                                value={ formatRupiah(currentCashSession.expectedClosingCash) }
                                valueLabel={ `Perkiraan kas saat ditutup ${
                                    formatRupiah(currentCashSession.expectedClosingCash)
                                }` }
                            />
                            <Metric
                                label="Total kas masuk"
                                value={ formatRupiah(currentCashSession.totalCashIn) }
                                valueLabel={ `Total kas masuk ${
                                    formatRupiah(currentCashSession.totalCashIn)
                                }` }
                            />
                            <Metric
                                label="Total kas keluar"
                                value={ formatRupiah(currentCashSession.totalCashOut) }
                                valueLabel={ `Total kas keluar ${
                                    formatRupiah(currentCashSession.totalCashOut)
                                }` }
                            />
                            <Metric
                                label="Pengeluaran aktif"
                                value={ formatRupiah(currentCashSession.activeExpenseAmount) }
                                valueLabel={ `Pengeluaran aktif ${
                                    formatRupiah(currentCashSession.activeExpenseAmount)
                                }` }
                            />
                            <Metric
                                label="Catatan pengeluaran aktif"
                                value={ formatCount(currentCashSession.activeExpenseCount) }
                                valueLabel={ `${
                                    formatCount(currentCashSession.activeExpenseCount)
                                } catatan pengeluaran aktif` }
                            />
                        </dl>
                    </>
                ) : (
                    <Typography variant="body2" className="text-gray-600">
                        Belum ada sesi kas yang sedang dibuka. Nilai kas tidak ditampilkan sebagai nol
                        karena belum ada sesi yang menjadi acuannya.
                    </Typography>
                ) }

                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    { currentCashSession.drillDowns.map(drillDown => (
                        <DashboardLink
                            key={ `${ drillDown.destination }-${ drillDown.reference || '' }` }
                            drillDown={ drillDown }
                            label={ drillDown.destination === 'CASH_SESSION_DETAIL'
                                ? 'Buka detail sesi kas'
                                : drillDown.destination === 'EXPENSE_HISTORY'
                                    ? 'Buka riwayat pengeluaran'
                                    : 'Buka riwayat sesi kas' }
                        />
                    )) }
                </div>
            </div>
        </Paper>
    );
};

CurrentCashSessionWidget.propTypes = {
    currentCashSession: PropTypes.shape({
        activeExpenseAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        activeExpenseCount: PropTypes.number,
        drillDowns: PropTypes.arrayOf(PropTypes.object).isRequired,
        expectedClosingCash: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        openedAt: PropTypes.string,
        openedBy: PropTypes.string,
        openingCash: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        state: PropTypes.oneOf(['OPEN', 'NONE']).isRequired,
        totalCashIn: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        totalCashOut: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }).isRequired,
    storeZoneId: PropTypes.string.isRequired
};

const SupplierPayablesWidget = ({ supplierPayables }) => {
    const formattedAmount = formatRupiah(supplierPayables.outstandingAmount);
    const formattedReceipts = formatCount(supplierPayables.openReceiptCount);
    const hasPayables = Number(supplierPayables.openReceiptCount) > 0;

    return (
        <Paper
            component="section"
            aria-labelledby="dashboard-payables-title"
            className="p-5 shadow-md md:p-6"
        >
            <div className="flex h-full flex-col gap-4">
                <div>
                    <Typography
                        id="dashboard-payables-title"
                        variant="h6"
                        component="h2"
                        className="font-bold text-gray-900"
                    >
                        Utang pemasok
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Sisa tagihan dari penerimaan barang yang sudah diposting.
                    </Typography>
                </div>

                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <Metric
                        label="Total belum dibayar"
                        value={ formattedAmount }
                        valueLabel={ `Total utang pemasok belum dibayar ${ formattedAmount }` }
                    />
                    <Metric
                        label="Penerimaan masih terutang"
                        value={ formattedReceipts }
                        valueLabel={ `${ formattedReceipts } penerimaan barang masih terutang` }
                    />
                </dl>

                { !hasPayables && (
                    <Typography variant="body2" className="text-gray-600">
                        Tidak ada penerimaan barang dengan sisa pembayaran.
                    </Typography>
                ) }

                <div className="mt-auto pt-2">
                    <DashboardLink
                        drillDown={ supplierPayables.drillDown }
                        label="Buka daftar utang pemasok"
                    />
                </div>
            </div>
        </Paper>
    );
};

SupplierPayablesWidget.propTypes = {
    supplierPayables: PropTypes.shape({
        drillDown: PropTypes.object,
        openReceiptCount: PropTypes.number.isRequired,
        outstandingAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
    }).isRequired
};

const getSessionDrillDown = (currentCashSession, destination) =>
    currentCashSession.drillDowns.find(drillDown => drillDown.destination === destination);

const CashSessionSummary = ({ currentCashSession, storeZoneId }) => {
    const isOpen = currentCashSession.state === 'OPEN';
    const detail = getSessionDrillDown(currentCashSession,
        isOpen ? 'CASH_SESSION_DETAIL' : 'CASH_SESSION_HISTORY');

    return (
        <Paper
            component="section"
            aria-labelledby="dashboard-session-summary-title"
            className="p-5 shadow-md md:p-6"
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Typography
                            id="dashboard-session-summary-title"
                            variant="h6"
                            component="h2"
                            className="font-bold text-gray-900"
                        >
                            Sesi kas saat ini
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                            { isOpen ? `Sesi #${ currentCashSession.sessionId } sedang berjalan.`
                                : 'Belum ada sesi yang menjadi acuan.' }
                        </Typography>
                    </div>
                    <Chip
                        label={ isOpen ? 'Buka' : 'Tidak ada sesi' }
                        color={ isOpen ? 'success' : 'default' }
                        size="small"
                        aria-label={ isOpen ? 'Status sesi kas: buka' : 'Status sesi kas: tidak ada sesi' }
                    />
                </div>

                { isOpen ? (
                    <>
                        <Metric
                            label="Perkiraan kas saat ditutup"
                            value={ formatRupiah(currentCashSession.expectedClosingCash) }
                            valueLabel={ `Perkiraan kas saat ditutup ${
                                formatRupiah(currentCashSession.expectedClosingCash)
                            }` }
                        />
                        <Typography variant="body2" className="text-gray-600">
                            Dibuka oleh { currentCashSession.openedBy } pada { ' ' }
                            { formatDateTime(currentCashSession.openedAt, storeZoneId) }.
                        </Typography>
                    </>
                ) : (
                    <Typography variant="body2" className="text-gray-600">
                        Nilai kas tidak ditampilkan sebagai nol karena tidak ada sesi terbuka.
                    </Typography>
                ) }

                <DashboardLink
                    drillDown={ detail }
                    label={ isOpen ? 'Buka detail sesi kas' : 'Buka riwayat sesi kas' }
                />
            </div>
        </Paper>
    );
};

CashSessionSummary.propTypes = CurrentCashSessionWidget.propTypes;

const ActiveExpensesSummary = ({ currentCashSession }) => {
    const isOpen = currentCashSession.state === 'OPEN';
    const expenseDrillDown = getSessionDrillDown(currentCashSession, 'EXPENSE_HISTORY');

    return (
        <Paper
            component="section"
            aria-labelledby="dashboard-expenses-title"
            className="p-5 shadow-md md:p-6"
        >
            <div className="flex flex-col gap-4">
                <div>
                    <Typography
                        id="dashboard-expenses-title"
                        variant="h6"
                        component="h2"
                        className="font-bold text-gray-900"
                    >
                        Pengeluaran sesi aktif
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Hanya catatan aktif pada sesi kas yang sedang terbuka.
                    </Typography>
                </div>

                { isOpen ? (
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <Metric
                            label="Total pengeluaran aktif"
                            value={ formatRupiah(currentCashSession.activeExpenseAmount) }
                            valueLabel={ `Total pengeluaran aktif ${
                                formatRupiah(currentCashSession.activeExpenseAmount)
                            }` }
                        />
                        <Metric
                            label="Jumlah catatan"
                            value={ formatCount(currentCashSession.activeExpenseCount) }
                            valueLabel={ `${ formatCount(currentCashSession.activeExpenseCount) }
                                catatan pengeluaran aktif` }
                        />
                    </dl>
                ) : (
                    <Typography variant="body2" className="text-gray-600">
                        Tidak ada sesi kas terbuka; nilai pengeluaran sesi tidak ditampilkan sebagai nol.
                    </Typography>
                ) }

                { isOpen && (
                    <DashboardLink
                        drillDown={ expenseDrillDown }
                        label="Buka riwayat pengeluaran"
                    />
                ) }
            </div>
        </Paper>
    );
};

ActiveExpensesSummary.propTypes = {
    currentCashSession: CurrentCashSessionWidget.propTypes.currentCashSession
};

const formatCompactAmount = value => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(amount);
};

const SalesLast7DaysChart = ({ salesLast7Days }) => {
    const [selectedIndex, setSelectedIndex] = useState(() =>
        Math.max(salesLast7Days.days.length - 1, 0));
    const dayRefs = useRef([]);

    useEffect(() => {
        setSelectedIndex(Math.max(salesLast7Days.days.length - 1, 0));
    }, [salesLast7Days.days]);

    const selectedDay = salesLast7Days.days[selectedIndex];
    const visualMaximum = Math.max(
        0,
        ...salesLast7Days.days.map(day => Number(day.salesAmount) || 0)
    );
    const periodLabel = `${ formatBusinessDate(salesLast7Days.periodStartDate) }–${
        formatBusinessDate(salesLast7Days.periodEndDate)
    }`;

    const moveSelection = (event, index) => {
        let nextIndex = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextIndex = Math.min(index + 1, salesLast7Days.days.length - 1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            nextIndex = Math.max(index - 1, 0);
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = salesLast7Days.days.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        setSelectedIndex(nextIndex);
        dayRefs.current[nextIndex]?.focus();
    };

    return (
        <Paper
            component="section"
            aria-labelledby="dashboard-weekly-sales-title"
            className="min-w-0 p-5 shadow-md md:p-6 xl:col-span-2"
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Typography
                            id="dashboard-weekly-sales-title"
                            variant="h6"
                            component="h2"
                            className="font-bold text-gray-900"
                        >
                            Penjualan 7 hari terakhir
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                            { periodLabel } · Nilai penjualan harian menurut server
                        </Typography>
                    </div>
                    <div className="sm:text-right">
                        <Typography
                            variant="h6"
                            component="p"
                            aria-label={ `Total penjualan tujuh hari ${
                                formatRupiah(salesLast7Days.totalSalesAmount)
                            }` }
                        >
                            { formatRupiah(salesLast7Days.totalSalesAmount) }
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                            { formatCount(salesLast7Days.totalTransactionCount) } transaksi dalam 7 hari
                        </Typography>
                    </div>
                </div>

                <div className="overflow-x-auto pb-1">
                    <div
                        className="grid min-w-[35rem] grid-cols-7 gap-2"
                        role="group"
                        aria-label="Pilih hari untuk melihat rincian penjualan"
                    >
                        { salesLast7Days.days.map((day, index) => {
                            const amount = Number(day.salesAmount) || 0;
                            const height = visualMaximum > 0
                                ? Math.max(4, (amount / visualMaximum) * 100)
                                : 4;
                            const selected = index === selectedIndex;
                            const dayName = new Intl.DateTimeFormat('id-ID', {
                                weekday: 'short',
                                timeZone: 'UTC'
                            }).format(new Date(`${ day.businessDate }T00:00:00Z`));

                            return (
                                <button
                                    key={ day.businessDate }
                                    ref={ element => {
                                        dayRefs.current[index] = element;
                                    } }
                                    type="button"
                                    aria-pressed={ selected }
                                    aria-label={ `${ formatBusinessDate(day.businessDate) }, penjualan ${
                                        formatRupiah(day.salesAmount)
                                    }, ${ formatCount(day.transactionCount) } transaksi` }
                                    onClick={ () => setSelectedIndex(index) }
                                    onKeyDown={ event => moveSelection(event, index) }
                                    className={ `grid min-h-56 min-w-0 grid-rows-[2rem_8.5rem_1.75rem]
                                        rounded-lg px-1 text-center transition-colors focus-visible:outline-none
                                        focus-visible:ring-2 focus-visible:ring-operational-600 focus-visible:ring-offset-2
                                        ${ selected ? 'bg-operational-50 text-operational-800' : 'hover:bg-gray-50' }` }
                                >
                                    <span className="self-end truncate text-xs font-medium">
                                        { formatCompactAmount(day.salesAmount) }
                                    </span>
                                    <span className="flex h-[8.5rem] items-end justify-center border-b border-gray-300">
                                        <span
                                            className="w-8 max-w-[68%] rounded-t bg-operational-500"
                                            style={ { height: `${ height }%` } }
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <span className="self-center text-xs">{ dayName }</span>
                                </button>
                            );
                        }) }
                    </div>
                </div>

                { selectedDay && (
                    <Typography
                        aria-live="polite"
                        aria-label={ `Rincian hari terpilih ${ formatBusinessDate(selectedDay.businessDate) }, ${
                            formatRupiah(selectedDay.salesAmount)
                        }, ${ formatCount(selectedDay.transactionCount) } transaksi` }
                    >
                        <strong>{ formatBusinessDate(selectedDay.businessDate) }:</strong>{ ' ' }
                        { formatRupiah(selectedDay.salesAmount) } ·{ ' ' }
                        { formatCount(selectedDay.transactionCount) } transaksi
                    </Typography>
                ) }

                <DashboardLink
                    drillDown={ salesLast7Days.drillDown }
                    label="Buka riwayat penjualan 7 hari"
                />
            </div>
        </Paper>
    );
};

SalesLast7DaysChart.propTypes = {
    salesLast7Days: PropTypes.shape({
        days: PropTypes.arrayOf(PropTypes.shape({
            businessDate: PropTypes.string.isRequired,
            salesAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
            transactionCount: PropTypes.number.isRequired
        })).isRequired,
        drillDown: PropTypes.object.isRequired,
        periodEndDate: PropTypes.string.isRequired,
        periodStartDate: PropTypes.string.isRequired,
        totalSalesAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        totalTransactionCount: PropTypes.number.isRequired
    }).isRequired
};

const DashboardAttention = ({ stockAttention, supplierPayables }) => {
    const hasPayables = Number(supplierPayables.openReceiptCount) > 0;
    const hasStockAttention = Number(stockAttention.outOfStockCount) > 0
        || Number(stockAttention.lowStockCount) > 0;

    return (
        <Paper
            component="aside"
            aria-labelledby="dashboard-attention-title"
            className="min-w-0 p-5 shadow-md md:p-6"
        >
            <div className="flex flex-col gap-5">
                <div>
                    <Typography
                        id="dashboard-attention-title"
                        variant="h6"
                        component="h2"
                        className="font-bold text-gray-900"
                    >
                        Perlu perhatian
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                        Tindakan yang didukung oleh ringkasan server saat ini.
                    </Typography>
                </div>

                { !hasPayables && !hasStockAttention && (
                    <Alert severity="success" role="status">
                        Tidak ada utang pemasok atau stok STORE yang masuk kondisi perhatian.
                    </Alert>
                ) }

                { hasPayables && (
                    <section>
                        <Typography
                            id="dashboard-payables-attention-title"
                            component="h3"
                            variant="subtitle1"
                        >
                            Utang pemasok
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                            { formatRupiah(supplierPayables.outstandingAmount) } dari { ' ' }
                            { formatCount(supplierPayables.openReceiptCount) } penerimaan masih terutang.
                        </Typography>
                        <DashboardLink
                            drillDown={ supplierPayables.drillDown }
                            label="Tinjau utang pemasok"
                        />
                    </section>
                ) }

                { hasStockAttention && (
                    <section>
                        <Typography
                            id="dashboard-stock-attention-title"
                            component="h3"
                            variant="subtitle1"
                        >
                            Stok STORE
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                            { formatCount(stockAttention.outOfStockCount) } habis · { ' ' }
                            { formatCount(stockAttention.lowStockCount) } di bawah batas server { ' ' }
                            { formatQuantity(stockAttention.threshold) }
                        </Typography>
                        { stockAttention.preview.length > 0 && (
                            <ul className="my-3 grid gap-2">
                                { stockAttention.preview.map(item => (
                                    <li
                                        key={ item.itemId }
                                        className="rounded-lg border border-gray-200 p-3"
                                    >
                                        <strong className="block break-words">{ item.name }</strong>
                                        <span className="block break-words text-sm text-gray-600">
                                            { item.sku } · { item.state === 'OUT_OF_STOCK'
                                                ? 'Habis di STORE'
                                                : 'Stok rendah di STORE' } · { ' ' }
                                            { formatQuantity(item.stockStore, item.baseUnitOfMeasure) }
                                        </span>
                                    </li>
                                )) }
                            </ul>
                        ) }
                        <DashboardLink
                            drillDown={ stockAttention.drillDown }
                            label="Buka data barang"
                        />
                    </section>
                ) }
            </div>
        </Paper>
    );
};

DashboardAttention.propTypes = {
    stockAttention: PropTypes.shape({
        drillDown: PropTypes.object.isRequired,
        location: PropTypes.oneOf(['STORE']).isRequired,
        lowStockCount: PropTypes.number.isRequired,
        outOfStockCount: PropTypes.number.isRequired,
        preview: PropTypes.arrayOf(PropTypes.shape({
            baseUnitOfMeasure: PropTypes.string.isRequired,
            itemId: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            sku: PropTypes.string.isRequired,
            state: PropTypes.oneOf(['OUT_OF_STOCK', 'LOW_STOCK']).isRequired,
            stockStore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
        })).isRequired,
        threshold: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
    }).isRequired,
    supplierPayables: SupplierPayablesWidget.propTypes.supplierPayables
};

const OperationalDashboardWidgets = ({ data }) => (
    <div className="grid min-w-0 gap-6">
        <div
            className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Ringkasan operasional"
        >
            <SalesWidget
                businessDate={ data.businessDate }
                salesToday={ data.salesToday }
            />
            <CashSessionSummary
                currentCashSession={ data.currentCashSession }
                storeZoneId={ data.storeZoneId }
            />
            <ActiveExpensesSummary currentCashSession={ data.currentCashSession } />
            <SupplierPayablesWidget supplierPayables={ data.supplierPayables } />
        </div>

        <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-3">
            <SalesLast7DaysChart salesLast7Days={ data.salesLast7Days } />
            <DashboardAttention
                stockAttention={ data.stockAttention }
                supplierPayables={ data.supplierPayables }
            />
        </div>

        <CurrentCashSessionWidget
            currentCashSession={ data.currentCashSession }
            storeZoneId={ data.storeZoneId }
        />
    </div>
);

OperationalDashboardWidgets.propTypes = {
    data: PropTypes.shape({
        businessDate: PropTypes.string.isRequired,
        currentCashSession: PropTypes.object.isRequired,
        salesLast7Days: PropTypes.object.isRequired,
        salesToday: PropTypes.object.isRequired,
        stockAttention: PropTypes.object.isRequired,
        storeZoneId: PropTypes.string.isRequired,
        supplierPayables: PropTypes.object.isRequired
    }).isRequired
};

export default OperationalDashboardWidgets;
