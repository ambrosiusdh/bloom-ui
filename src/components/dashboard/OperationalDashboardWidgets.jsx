import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Chip, Divider, Paper, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';

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
            className="h-full p-5 shadow-md md:p-6"
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
            aria-labelledby="dashboard-cash-session-title"
            className="h-full p-5 shadow-md md:p-6"
        >
            <div className="flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Typography
                            id="dashboard-cash-session-title"
                            variant="h6"
                            component="h2"
                            className="font-bold text-gray-900"
                        >
                            Sesi kas saat ini
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
            className="h-full p-5 shadow-md md:p-6"
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

const OperationalDashboardWidgets = ({ data }) => (
    <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
        aria-label="Ringkasan operasional"
    >
        <SalesWidget
            businessDate={ data.businessDate }
            salesToday={ data.salesToday }
        />
        <CurrentCashSessionWidget
            currentCashSession={ data.currentCashSession }
            storeZoneId={ data.storeZoneId }
        />
        <SupplierPayablesWidget supplierPayables={ data.supplierPayables } />
    </div>
);

OperationalDashboardWidgets.propTypes = {
    data: PropTypes.shape({
        businessDate: PropTypes.string.isRequired,
        currentCashSession: PropTypes.object.isRequired,
        salesToday: PropTypes.object.isRequired,
        storeZoneId: PropTypes.string.isRequired,
        supplierPayables: PropTypes.object.isRequired
    }).isRequired
};

export default OperationalDashboardWidgets;
