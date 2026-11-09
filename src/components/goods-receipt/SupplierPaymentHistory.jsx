import { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from '@mui/material';
import PropTypes from 'prop-types';

import supplierPaymentApi from '@api/supplier-payment.js';
import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { formatDate } from '@utils/date-utils.js';
import { SUPPLIER_PAYMENT_METHODS } from '@utils/supplier-payment-utils.js';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const valueOrFallback = (value, fallback = '-') => value || fallback;

const PaymentStatus = ({ payment }) => (
    <div className="space-y-1">
        <Chip
            size="small"
            variant="outlined"
            color={ payment.voided ? 'warning' : 'success' }
            label={ payment.voided ? 'Dibatalkan' : 'Aktif' }
            aria-label={ `Status pembayaran: ${ payment.voided ? 'Dibatalkan' : 'Aktif' }` }
        />
        { payment.voided && (
            <>
                <span className="block break-words text-sm text-gray-600">
                    { valueOrFallback(payment.voidReason, 'Alasan tidak tersedia') }
                </span>
                <span className="block text-sm text-gray-600">
                    { valueOrFallback(payment.voidedBy, 'Pelaku tidak tersedia') } ·{ ' ' }
                    { formatDate(payment.voidedAt) || 'Waktu tidak tersedia' }
                </span>
            </>
        ) }
    </div>
);

PaymentStatus.propTypes = {
    payment: PropTypes.object.isRequired
};

const PaymentMethod = ({ payment }) => (
    <div className="space-y-1">
        <strong className="block font-medium">
            { SUPPLIER_PAYMENT_METHODS[payment.paymentMethod]
                || payment.paymentMethod
                || '-' }
        </strong>
        <span className="block break-all text-sm text-gray-600">
            { valueOrFallback(payment.reference, 'Tanpa referensi') }
        </span>
        { payment.note && (
            <span className="block whitespace-pre-wrap break-words text-sm text-gray-600">
                { payment.note }
            </span>
        ) }
        { payment.cashSessionId && (
            <span className="block text-sm text-gray-600">Sesi kas #{ payment.cashSessionId }</span>
        ) }
    </div>
);

PaymentMethod.propTypes = {
    payment: PropTypes.object.isRequired
};

export default function SupplierPaymentHistory({ receiptCode, refreshKey }) {
    const [payments, setPayments] = useState([]);
    const [paging, setPaging] = useState({});
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [retryVersion, setRetryVersion] = useState(0);
    const totalElements = Number.isFinite(Number(paging.totalElements))
        ? Number(paging.totalElements)
        : payments.length;
    const totalPages = Math.max(Number(paging.totalPages) || 0, 0);
    const rangeStart = payments.length ? ((page - 1) * size) + 1 : 0;
    const rangeEnd = payments.length
        ? Math.min(rangeStart + payments.length - 1, totalElements)
        : 0;

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        setStatus('loading');
        setError(null);

        supplierPaymentApi.getSupplierPaymentHistory(
            receiptCode,
            {
                page,
                size
            },
            { signal: controller.signal },
            { useLoader: false }
        ).then(({ data: response }) => {
            if (!active || controller.signal.aborted) return;

            const { content, ...nextPaging } = response.data || {};

            setPayments(Array.isArray(content) ? content : []);
            setPaging(nextPaging);
            setStatus('ready');
        }).catch(nextError => {
            if (!active || controller.signal.aborted) return;

            setPayments([]);
            setPaging({});
            setError(nextError);
            setStatus('error');
        });

        return () => {
            active = false;
            controller.abort();
        };
    }, [page, receiptCode, refreshKey, retryVersion, size]);

    useEffect(() => {
        if (status !== 'ready' || totalPages <= 0 || page <= totalPages) return;

        setPage(totalPages);
    }, [page, status, totalPages]);

    return (
        <section
            className="min-w-0 overflow-hidden rounded-lg bg-white shadow-lg"
            aria-labelledby="supplier-payment-history-heading"
        >
            <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 id="supplier-payment-history-heading" className="text-xl font-bold">
                        Riwayat pembayaran
                    </h2>
                    <p className="mt-1 text-sm text-gray-600" aria-live="polite">
                        { status === 'ready' && payments.length
                            ? `${ rangeStart }–${ rangeEnd } dari ${ totalElements } pembayaran · Terbaru lebih dulu`
                            : status === 'ready' ? '0 pembayaran' : 'Catatan pembayaran penerimaan ini.' }
                    </p>
                </div>
                <div
                    className="flex flex-wrap items-center gap-2 print:hidden"
                    aria-label="Navigasi halaman riwayat pembayaran"
                >
                    <TextField
                        select
                        label="Per halaman"
                        size="small"
                        value={ size }
                        className="w-32"
                        onChange={ event => {
                            setSize(Number(event.target.value));
                            setPage(1);
                        } }
                    >
                        { PAGE_SIZE_OPTIONS.map(value => (
                            <MenuItem key={ value } value={ value }>{ value }</MenuItem>
                        )) }
                    </TextField>
                    <Button
                        type="button"
                        size="small"
                        disabled={ status === 'loading' || page <= 1 || !totalPages }
                        onClick={ () => setPage(value => value - 1) }
                    >
                        Sebelumnya
                    </Button>
                    <span className="min-w-24 text-center text-sm text-gray-600" aria-current="page">
                        Halaman { totalPages ? Math.min(page, totalPages) : 1 } dari { totalPages || 1 }
                    </span>
                    <Button
                        type="button"
                        size="small"
                        disabled={ status === 'loading' || !totalPages || page >= totalPages }
                        onClick={ () => setPage(value => value + 1) }
                    >
                        Berikutnya
                    </Button>
                </div>
            </div>

            { status === 'loading' || status === 'idle' ? (
                <div className="py-10 text-center" role="status" aria-live="polite">
                    <CircularProgress size={ 22 } aria-hidden="true" />{ ' ' }
                    <span>Memuat riwayat pembayaran...</span>
                </div>
            ) : status === 'error' ? (
                <div className="p-4">
                    <Alert
                        severity="error"
                        action={ (
                            <Button
                                color="inherit"
                                onClick={ () => setRetryVersion(value => value + 1) }
                            >
                                Coba lagi
                            </Button>
                        ) }
                    >
                        <strong>Riwayat pembayaran gagal dimuat.</strong>{ ' ' }
                        { error?.message || 'Periksa koneksi lalu coba lagi.' }
                    </Alert>
                </div>
            ) : payments.length ? (
                <TableContainer component="div" className="!overflow-x-hidden">
                    <Table
                        className="!block xl:!table xl:!table-fixed"
                        aria-label="Riwayat pembayaran pemasok untuk penerimaan ini"
                    >
                        <caption className="sr-only">
                            Pembayaran, metode, referensi, audit, nominal, dan status dari server.
                        </caption>
                        <TableHead className="hidden bg-gray-100 xl:!table-header-group">
                            <TableRow>
                                <TableCell className="xl:!w-[12%]">Pembayaran</TableCell>
                                <TableCell className="xl:!w-[28%]">Metode &amp; referensi</TableCell>
                                <TableCell className="xl:!w-[24%]">Dibayar oleh &amp; pada</TableCell>
                                <TableCell className="xl:!w-[16%]" align="right">Nominal</TableCell>
                                <TableCell className="xl:!w-[20%]">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="!block xl:!table-row-group">
                            { payments.map((payment, index) => {
                                const isLastRow = index === payments.length - 1;
                                const rowBorderClass = isLastRow ? '' : 'border-b border-gray-200';
                                const tableCellClass = isLastRow ? '!border-b-0' : '';

                                return (
                                    <TableRow
                                        key={ payment.id }
                                        className={ `!grid grid-cols-1 gap-x-5 gap-y-4 px-4 py-4 sm:grid-cols-2 xl:!table-row xl:p-0 ${ rowBorderClass } xl:border-b-0` }
                                    >
                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                Pembayaran
                                            </span>
                                            <strong className="mt-1 block font-semibold xl:mt-0">#{ payment.id }</strong>
                                        </TableCell>
                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                Metode &amp; referensi
                                            </span>
                                            <div className="mt-1 xl:mt-0"><PaymentMethod payment={ payment } /></div>
                                        </TableCell>
                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                Dibayar oleh &amp; pada
                                            </span>
                                            <strong className="mt-1 block break-words font-medium xl:mt-0">
                                                { valueOrFallback(payment.actor, 'Pelaku tidak tersedia') }
                                            </strong>
                                            <span className="mt-1 block text-sm text-gray-600">
                                                { formatDate(payment.paidAt) || 'Waktu tidak tersedia' }
                                            </span>
                                        </TableCell>
                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4 xl:!text-right` }>
                                            <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                Nominal
                                            </span>
                                            <strong className="mt-1 block whitespace-nowrap font-semibold tabular-nums xl:mt-0">
                                                { payment.amount == null ? '-' : formatRupiah(payment.amount) }
                                            </strong>
                                        </TableCell>
                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 sm:col-span-2 xl:!table-cell xl:!border-b xl:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                Status
                                            </span>
                                            <div className="mt-1 xl:mt-0"><PaymentStatus payment={ payment } /></div>
                                        </TableCell>
                                    </TableRow>
                                );
                            }) }
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <div className="px-4 py-10 text-center" role="status">
                    <strong className="block">Belum ada pembayaran</strong>
                    <p className="mt-1 text-gray-600">
                        Penerimaan ini belum memiliki catatan pembayaran.
                    </p>
                </div>
            ) }
        </section>
    );
}

SupplierPaymentHistory.propTypes = {
    receiptCode: PropTypes.string.isRequired,
    refreshKey: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};
