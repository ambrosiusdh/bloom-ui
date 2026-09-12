import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
    Alert, Button, Chip, CircularProgress, MenuItem, Pagination, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField
} from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { useBreadcrumbStore, useGoodsReceiptStore } from '@stores/index.js';
import { formatDate, isValidDateInput } from '@utils/date-utils.js';
import {
    getGoodsReceiptStatusColor,
    GOODS_RECEIPT_PAYMENT_STATUS_LABELS,
    GOODS_RECEIPT_STATUS_LABELS
} from '@utils/goods-receipt-utils.js';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const FILTER_KEYS = { code: 'Nomor penerimaan', supplierName: 'Nama pemasok' };

const getQueryState = params => {
    const next = new URLSearchParams(params);
    const requestedPage = Number(params.get('page'));
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    if (params.has('page') && params.get('page') !== String(page)) next.set('page', String(page));

    const requestedSize = Number(params.get('size'));
    const size = PAGE_SIZE_OPTIONS.includes(requestedSize) ? requestedSize : 10;
    if (params.has('size') && params.get('size') !== String(size)) next.set('size', String(size));

    const requestedKey = params.get('key');
    const filterKey = Object.hasOwn(FILTER_KEYS, requestedKey) ? requestedKey : 'code';
    if (params.has('key') && requestedKey !== filterKey) next.set('key', filterKey);

    const startDate = isValidDateInput(params.get('receivedDateFrom'))
        ? params.get('receivedDateFrom') : '';
    const endDate = isValidDateInput(params.get('receivedDateTo'))
        ? params.get('receivedDateTo') : '';
    if (params.has('receivedDateFrom') && !startDate) next.delete('receivedDateFrom');
    if (params.has('receivedDateTo') && !endDate) next.delete('receivedDateTo');
    if (startDate && endDate && startDate > endDate) {
        next.delete('receivedDateFrom');
        next.delete('receivedDateTo');
    }

    const canonicalSearch = next.toString();

    return {
        page,
        size,
        filterKey,
        query: params.get('q') || '',
        startDate: startDate && (!endDate || startDate <= endDate) ? startDate : '',
        endDate: endDate && (!startDate || startDate <= endDate) ? endDate : '',
        canonicalSearch,
        needsSanitization: canonicalSearch !== params.toString()
    };
};

const money = value => value == null ? '-' : formatRupiah(value);

const StatusChip = ({ labels, value, type }) => (
    <Chip
        size="small"
        variant="outlined"
        color={ getGoodsReceiptStatusColor(value) }
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
    const totalPages = Number(paging.totalPages) || 0;
    const isPageOutOfRange = status === 'ready'
        && totalPages > 0
        && queryState.page > totalPages;
    const hasAppliedFilters = Boolean(queryState.query || queryState.startDate || queryState.endDate);
    const hasDraftFilters = Boolean(draft.query || draft.startDate || draft.endDate
        || draft.filterKey !== 'code');

    const updateQuery = updates => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => value
            ? next.set(key, String(value)) : next.delete(key));
        setSearchParams(next);
    };

    useEffect(() => setBreadcrumbs(['Penerimaan Barang']), [setBreadcrumbs]);

    useEffect(() => {
        if (queryState.needsSanitization) {
            setSearchParams(queryState.canonicalSearch, { replace: true });
        }
    }, [queryState.canonicalSearch, queryState.needsSanitization, setSearchParams]);

    useEffect(() => {
        setDraft({
            filterKey: queryState.filterKey,
            query: queryState.query,
            startDate: queryState.startDate,
            endDate: queryState.endDate
        });
    }, [queryState.filterKey, queryState.query, queryState.startDate, queryState.endDate]);

    useEffect(() => {
        if (queryState.needsSanitization) return undefined;
        const controller = new AbortController();
        const params = {
            page: queryState.page,
            size: queryState.size,
            ...(queryState.query ? { [queryState.filterKey]: queryState.query } : {}),
            ...(queryState.startDate ? { receivedDateFrom: queryState.startDate } : {}),
            ...(queryState.endDate ? { receivedDateTo: queryState.endDate } : {})
        };
        getGoodsReceiptList(params, { signal: controller.signal }, { useLoader: false }).catch(() => {});
        return () => controller.abort();
    }, [getGoodsReceiptList, queryState.endDate, queryState.filterKey, queryState.page,
        queryState.query, queryState.size, queryState.startDate,
        queryState.needsSanitization, retryVersion]);

    useEffect(() => {
        if (!isPageOutOfRange) return;
        setSearchParams(current => {
            const next = new URLSearchParams(current);
            next.set('page', String(totalPages));
            return next;
        }, { replace: true });
    }, [isPageOutOfRange, setSearchParams, totalPages]);

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
        setDraft({ filterKey: 'code', query: '', startDate: '', endDate: '' });
        updateQuery({ key: '', q: '', receivedDateFrom: '', receivedDateTo: '', page: 1 });
    };

    return (
        <div className="space-y-4">
            <header>
                <h2 className="font-bold text-2xl">Riwayat Penerimaan Barang</h2>
                <p className="mt-1 text-gray-600">Nilai penerimaan dan pembayaran dikonfirmasi langsung oleh server.</p>
                <Button component={ Link } to="/goods-receipts/new" variant="contained" className="mt-3">Buat penerimaan</Button>
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
                        disabled={ !hasAppliedFilters && !hasDraftFilters }>Hapus filter</Button>
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
                            page={ totalPages ? Math.min(queryState.page, totalPages) : queryState.page }
                            count={ totalPages || 1 }
                            disabled={ status === 'loading' || !paging.totalPages }
                            onChange={ (_, value) => updateQuery({ page: value }) }
                            aria-label="Halaman riwayat penerimaan barang" />
                    </div>
                </div>

                { status === 'loading' || status === 'idle' || isPageOutOfRange ? (
                    <div className="py-12 text-center" role="status" aria-live="polite">
                        <CircularProgress size={ 22 } aria-hidden="true" /> <span>{ isPageOutOfRange
                            ? 'Menyesuaikan halaman penerimaan...'
                            : 'Memuat penerimaan barang...' }</span>
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
                                        <StatusChip labels={ GOODS_RECEIPT_STATUS_LABELS } value={ receipt.status } type="Status penerimaan" />
                                        <StatusChip labels={ GOODS_RECEIPT_PAYMENT_STATUS_LABELS } value={ receipt.paymentStatus } type="Status pembayaran" />
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
