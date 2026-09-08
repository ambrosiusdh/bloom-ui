import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
    Alert, Button, Chip, CircularProgress, MenuItem, Pagination, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField
} from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { useBreadcrumbStore, useGoodsReceiptStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const FILTER_KEYS = { code: 'Nomor penerimaan', supplierName: 'Nama pemasok' };
const RECEIPT_STATUS_LABELS = { POSTED: 'Dibukukan', CANCELLED: 'Dibatalkan' };
const PAYMENT_STATUS_LABELS = {
    UNPAID: 'Belum dibayar',
    PARTIALLY_PAID: 'Dibayar sebagian',
    PAID: 'Lunas'
};
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const validDate = value => DATE_PATTERN.test(value || '')
    && !Number.isNaN(new Date(`${ value }T00:00:00`).getTime());

const getQueryState = params => {
    const requestedPage = Number(params.get('page'));
    const requestedSize = Number(params.get('size'));
    const requestedKey = params.get('key');
    const startDate = validDate(params.get('receivedDateFrom')) ? params.get('receivedDateFrom') : '';
    const endDate = validDate(params.get('receivedDateTo')) ? params.get('receivedDateTo') : '';

    return {
        page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
        size: PAGE_SIZE_OPTIONS.includes(requestedSize) ? requestedSize : 10,
        filterKey: Object.hasOwn(FILTER_KEYS, requestedKey) ? requestedKey : 'code',
        query: params.get('q') || '',
        startDate: startDate && (!endDate || startDate <= endDate) ? startDate : '',
        endDate: endDate && (!startDate || startDate <= endDate) ? endDate : ''
    };
};

const toInstant = (date, endOfDay = false) => date
    ? new Date(`${ date }T${ endOfDay ? '23:59:59.999' : '00:00:00.000' }`).toISOString()
    : undefined;

const money = value => value == null ? '-' : formatRupiah(value);
const statusColor = value => value === 'PAID' || value === 'POSTED'
    ? 'success'
    : value === 'PARTIALLY_PAID' ? 'warning' : 'default';

const StatusChip = ({ labels, value, type }) => (
    <Chip
        size="small"
        variant="outlined"
        color={ statusColor(value) }
        label={ labels[value] || value || '-' }
        aria-label={ `${ type}: ${ labels[value] || value || '-' }` }
    />
);

StatusChip.propTypes = {
    labels: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    value: PropTypes.string
};

export default function GoodsReceiptList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const receipts = useGoodsReceiptStore(state => state.goodsReceiptList);
    const paging = useGoodsReceiptStore(state => state.goodsReceiptPaging);
    const status = useGoodsReceiptStore(state => state.goodsReceiptListStatus);
    const error = useGoodsReceiptStore(state => state.goodsReceiptListError);
    const getGoodsReceiptList = useGoodsReceiptStore(state => state.getGoodsReceiptList);
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [retryVersion, setRetryVersion] = useState(0);
    const queryState = getQueryState(searchParams);
    const [draft, setDraft] = useState({
        filterKey: queryState.filterKey,
        query: queryState.query,
        startDate: queryState.startDate,
        endDate: queryState.endDate
    });
    const [filterError, setFilterError] = useState('');
    const returnTo = `${ location.pathname }${ location.search }`;

    const updateQuery = updates => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => value
            ? next.set(key, String(value)) : next.delete(key));
        setSearchParams(next);
    };

    useEffect(() => setBreadcrumbs(['Penerimaan Barang']), [setBreadcrumbs]);

    useEffect(() => {
        setDraft({
            filterKey: queryState.filterKey,
            query: queryState.query,
            startDate: queryState.startDate,
            endDate: queryState.endDate
        });
    }, [queryState.filterKey, queryState.query, queryState.startDate, queryState.endDate]);

    useEffect(() => {
        const controller = new AbortController();
        const params = {
            page: queryState.page,
            size: queryState.size,
            ...(queryState.query ? { [queryState.filterKey]: queryState.query } : {}),
            ...(queryState.startDate ? { receivedDateFrom: toInstant(queryState.startDate) } : {}),
            ...(queryState.endDate ? { receivedDateTo: toInstant(queryState.endDate, true) } : {})
        };
        getGoodsReceiptList(params, { signal: controller.signal }, { useLoader: false }).catch(() => {});
        return () => controller.abort();
    }, [getGoodsReceiptList, queryState.endDate, queryState.filterKey, queryState.page,
        queryState.query, queryState.size, queryState.startDate, retryVersion]);

    const applyFilters = event => {
        event.preventDefault();
        if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
            setFilterError('Tanggal mulai tidak boleh setelah tanggal akhir.');
            return;
        }
        setFilterError('');
        updateQuery({
            key: draft.filterKey,
            q: draft.query.trim(),
            receivedDateFrom: draft.startDate,
            receivedDateTo: draft.endDate,
            page: 1
        });
    };

    const clearFilters = () => {
        setFilterError('');
        updateQuery({ key: '', q: '', receivedDateFrom: '', receivedDateTo: '', page: 1 });
    };

    return (
        <div className="space-y-4">
            <header>
                <h2 className="font-bold text-2xl">Riwayat Penerimaan Barang</h2>
                <p className="mt-1 text-gray-600">Nilai penerimaan dan pembayaran dikonfirmasi langsung oleh server.</p>
            </header>

            { error && (
                <Alert
                    severity="error"
                    action={ (
                    <Button color="inherit" onClick={ () => setRetryVersion(value => value + 1) }>Coba lagi</Button>
                    ) }
                >{ error.message || 'Riwayat penerimaan barang gagal dimuat.' }</Alert>
            ) }

            <form className="card space-y-3" aria-label="Filter riwayat penerimaan barang" onSubmit={ applyFilters }>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <TextField
                        select
                        label="Cari berdasarkan"
                        value={ draft.filterKey }
                        onChange={ event => setDraft(value => ({ ...value, filterKey: event.target.value })) }>
                        { Object.entries(FILTER_KEYS).map(([value, label]) => (
                            <MenuItem key={ value } value={ value }>{ label }</MenuItem>
                        )) }
                    </TextField>
                    <TextField
                        label={ FILTER_KEYS[draft.filterKey] }
                        value={ draft.query }
                        onChange={ event => setDraft(value => ({ ...value, query: event.target.value })) } />
                    <TextField
                        label="Tanggal mulai"
                        type="date"
                        value={ draft.startDate }
                        slotProps={ { inputLabel: { shrink: true }, htmlInput: { max: draft.endDate || undefined } } }
                        onChange={ event => setDraft(value => ({ ...value, startDate: event.target.value })) } />
                    <TextField
                        label="Tanggal akhir"
                        type="date"
                        value={ draft.endDate }
                        slotProps={ { inputLabel: { shrink: true }, htmlInput: { min: draft.startDate || undefined } } }
                        onChange={ event => setDraft(value => ({ ...value, endDate: event.target.value })) } />
                </div>
                { filterError && <Alert severity="warning">{ filterError }</Alert> }
                <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="contained">Terapkan filter</Button>
                    <Button
                        type="button"
                        onClick={ clearFilters }
                        disabled={ !queryState.query && !queryState.startDate && !queryState.endDate }>Hapus filter</Button>
                </div>
            </form>

            <section className="rounded-lg bg-white shadow-lg pb-2" aria-label="Daftar penerimaan barang">
                <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-xl font-bold">Daftar penerimaan</h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm">Data per halaman:</span>
                        <TextField
                            select
                            size="small"
                            value={ queryState.size }
                            className="w-20"
                            aria-label="Data per halaman"
                            onChange={ event => updateQuery({ size: event.target.value, page: 1 }) }>
                            { PAGE_SIZE_OPTIONS.map(value => <MenuItem key={ value } value={ value }>{ value }</MenuItem>) }
                        </TextField>
                        <Pagination
                            page={ queryState.page }
                            count={ paging.totalPages || 1 }
                            disabled={ status === 'loading' || !paging.totalPages }
                            onChange={ (_, value) => updateQuery({ page: value }) }
                            aria-label="Halaman riwayat penerimaan barang" />
                    </div>
                </div>

                { status === 'loading' || status === 'idle' ? (
                    <div className="py-12 text-center" role="status" aria-live="polite">
                        <CircularProgress size={ 22 } aria-hidden="true" /> <span>Memuat penerimaan barang...</span>
                    </div>
                ) : status === 'error' ? (
                    <div className="py-12 text-center text-gray-600">Riwayat penerimaan belum dapat ditampilkan.</div>
                ) : receipts.length ? (
                    <TableContainer component={ Paper } elevation={ 0 }>
                        <Table sx={ { minWidth: 1080 } } aria-label="Riwayat penerimaan barang">
                            <TableHead className="bg-gray-100"><TableRow>
                                <TableCell>Referensi</TableCell><TableCell>Pemasok</TableCell><TableCell>Status</TableCell>
                                <TableCell align="right">Nilai server</TableCell><TableCell>Tanggal</TableCell><TableCell />
                            </TableRow></TableHead>
                            <TableBody>{ receipts.map(receipt => (
                                <TableRow key={ receipt.code } hover>
                                    <TableCell><strong>{ receipt.code }</strong><div className="text-sm text-gray-600">{ receipt.createdBy || 'SYSTEM' }</div></TableCell>
                                    <TableCell><strong>{ receipt.supplierName || '-' }</strong>
                                        <div className="text-sm text-gray-600">ID #{ receipt.supplierId ?? '-' } · { receipt.supplierCode || '-' }</div></TableCell>
                                    <TableCell><div className="flex flex-col items-start gap-1">
                                        <StatusChip labels={ RECEIPT_STATUS_LABELS } value={ receipt.status } type="Status penerimaan" />
                                        <StatusChip labels={ PAYMENT_STATUS_LABELS } value={ receipt.paymentStatus } type="Status pembayaran" />
                                    </div></TableCell>
                                    <TableCell align="right" className="tabular-nums">
                                        <div>Total: { money(receipt.totalAmount) }</div>
                                        <div className="text-sm text-gray-600">Dibayar: { money(receipt.paidAmount) }</div>
                                        <div className="text-sm font-medium">Sisa: { money(receipt.outstandingAmount) }</div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap"><div>{ formatDate(receipt.receivedDate) || '-' }</div>
                                        <div className="text-sm text-gray-600">Dicatat: { formatDate(receipt.createdAt) || '-' }</div></TableCell>
                                    <TableCell><Button component={ Link }
                                        to={ `/goods-receipts/${ encodeURIComponent(receipt.code) }` }
                                        state={ { from: returnTo } }>Detail</Button></TableCell>
                                </TableRow>
                            )) }</TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <div className="py-12 px-4 text-center">
                        <div className="font-semibold">Tidak ada penerimaan barang</div>
                        <p className="mt-1 text-gray-600">{ queryState.query || queryState.startDate || queryState.endDate
                            ? 'Ubah atau hapus filter untuk melihat penerimaan lain.'
                            : 'Riwayat akan tampil setelah penerimaan berhasil dibukukan.' }</p>
                    </div>
                ) }
            </section>
        </div>
    );
}
