import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    MenuItem,
    Pagination,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { useBreadcrumbStore, useSaleStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const FILTER_KEYS = { code: 'Kode penjualan', createdBy: 'Dibuat oleh' };
const PAYMENT_LABELS = { CASH: 'Tunai', QRIS: 'QRIS' };
const STATUS_LABELS = { COMPLETED: 'Selesai', PAID: 'Lunas' };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const validDate = value => DATE_PATTERN.test(value || '')
    && !Number.isNaN(new Date(`${ value }T00:00:00`).getTime());

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

    const startDate = validDate(params.get('startDate')) ? params.get('startDate') : '';
    const endDate = validDate(params.get('endDate')) ? params.get('endDate') : '';
    if (params.has('startDate') && !startDate) next.delete('startDate');
    if (params.has('endDate') && !endDate) next.delete('endDate');
    if (startDate && endDate && startDate > endDate) {
        next.delete('startDate');
        next.delete('endDate');
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

const toInstant = (date, endOfDay = false) => date
    ? new Date(`${ date }T${ endOfDay ? '23:59:59.999' : '00:00:00.000' }`).toISOString()
    : undefined;

const StatusChip = ({ value, type }) => (
    <Chip
        size="small"
        color={ value === 'COMPLETED' || value === 'PAID' ? 'success' : 'default' }
        label={ STATUS_LABELS[value] || value || '-' }
        aria-label={ `${ type }: ${ STATUS_LABELS[value] || value || '-' }` }
    />
);

StatusChip.propTypes = { value: PropTypes.string, type: PropTypes.string.isRequired };

export default function SaleList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const saleList = useSaleStore(state => state.saleList);
    const salePaging = useSaleStore(state => state.salePaging);
    const status = useSaleStore(state => state.saleListStatus);
    const error = useSaleStore(state => state.saleListError);
    const getSaleList = useSaleStore(state => state.getSaleList);
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

    useEffect(() => setBreadcrumbs(['Riwayat Penjualan']), [setBreadcrumbs]);

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
            ...(queryState.startDate ? { startDate: toInstant(queryState.startDate) } : {}),
            ...(queryState.endDate ? { endDate: toInstant(queryState.endDate, true) } : {})
        };
        getSaleList(params, { signal: controller.signal }, { useLoader: false }).catch(() => {});
        return () => controller.abort();
    }, [getSaleList, queryState.endDate, queryState.filterKey, queryState.needsSanitization,
        queryState.page, queryState.query, queryState.size, queryState.startDate, retryVersion]);

    const applyFilters = event => {
        event.preventDefault();
        if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
            setFilterError('Tanggal mulai tidak boleh setelah tanggal akhir.');
            return;
        }
        setFilterError('');
        updateQuery({ key: draft.filterKey, q: draft.query, startDate: draft.startDate,
            endDate: draft.endDate, page: 1 });
    };

    const clearFilters = () => {
        setFilterError('');
        updateQuery({ key: '', q: '', startDate: '', endDate: '', page: 1 });
    };

    return (
        <div className="space-y-4">
            <header>
                <h2 className="font-bold text-2xl">Riwayat Penjualan</h2>
                <p className="mt-1 text-gray-600">Nilai pembayaran dan status berikut dikonfirmasi langsung oleh server.</p>
            </header>

            { error && (
                <Alert severity="error" action={ <Button color="inherit" onClick={ () => setRetryVersion(value => value + 1) }>Coba lagi</Button> }>
                    { error.message || 'Riwayat penjualan gagal dimuat.' }
                </Alert>
            ) }

            <form className="card space-y-3" aria-label="Filter riwayat penjualan" onSubmit={ applyFilters }>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <TextField select
                        label="Cari berdasarkan"
                        value={ draft.filterKey }
                        onChange={ event => setDraft(value => ({ ...value, filterKey: event.target.value })) }>
                        { Object.entries(FILTER_KEYS).map(([value, label]) => <MenuItem key={ value } value={ value }>{ label }</MenuItem>) }
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
                    <Button type="button"
                        onClick={ clearFilters }
                        disabled={ !queryState.query && !queryState.startDate && !queryState.endDate }>Hapus filter</Button>
                </div>
            </form>

            <section className="rounded-lg bg-white shadow-lg pb-2" aria-label="Daftar penjualan">
                <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-xl font-bold">Daftar penjualan</h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm">Data per halaman:</span>
                        <TextField select
                            size="small"
                            value={ queryState.size }
                            className="w-20"
                            aria-label="Data per halaman"
                            onChange={ event => updateQuery({ size: event.target.value, page: 1 }) }>
                            { PAGE_SIZE_OPTIONS.map(value => <MenuItem key={ value } value={ value }>{ value }</MenuItem>) }
                        </TextField>
                        <Pagination
                            page={ queryState.page }
                            count={ salePaging.totalPages || 1 }
                            disabled={ status === 'loading' || !salePaging.totalPages }
                            onChange={ (_, value) => updateQuery({ page: value }) }
                            aria-label="Halaman riwayat penjualan" />
                    </div>
                </div>

                { status === 'loading' ? (
                    <div className="py-12 text-center" role="status" aria-live="polite">
                        <CircularProgress size={ 22 } aria-hidden="true" /> <span>Memuat penjualan...</span>
                    </div>
                ) : status === 'error' ? (
                    <div className="py-12 text-center text-gray-600">Riwayat penjualan belum dapat ditampilkan.</div>
                ) : saleList.length ? (
                    <TableContainer component={ Paper } elevation={ 0 }>
                        <Table sx={ { minWidth: 920 } } aria-label="Riwayat penjualan">
                            <TableHead className="bg-gray-100"><TableRow>
                                <TableCell>Kode</TableCell><TableCell>Status</TableCell><TableCell>Pembayaran</TableCell>
                                <TableCell align="right">Total server</TableCell><TableCell>Dibuat</TableCell><TableCell />
                            </TableRow></TableHead>
                            <TableBody>{ saleList.map(sale => (
                                <TableRow key={ sale.code } hover>
                                    <TableCell><strong>{ sale.code }</strong><div className="text-sm text-gray-600">{ sale.createdBy || 'SYSTEM' }</div></TableCell>
                                    <TableCell><StatusChip value={ sale.saleStatus } type="Status penjualan" /></TableCell>
                                    <TableCell><StatusChip value={ sale.paymentStatus } type="Status pembayaran" /><div className="mt-1 text-sm">{ PAYMENT_LABELS[sale.paymentType] || sale.paymentType || '-' }</div></TableCell>
                                    <TableCell align="right" className="tabular-nums">{ formatRupiah(sale.totalAmount) }</TableCell>
                                    <TableCell className="whitespace-nowrap">{ formatDate(sale.createdAt) || '-' }</TableCell>
                                    <TableCell><Button component={ Link }
                                        to={ `/sales/${ encodeURIComponent(sale.code) }` }
                                        state={ { from: returnTo } }>Detail</Button></TableCell>
                                </TableRow>
                            )) }</TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <div className="py-12 px-4 text-center">
                        <div className="font-semibold">Tidak ada penjualan</div>
                        <p className="mt-1 text-gray-600">{ queryState.query || queryState.startDate || queryState.endDate
                            ? 'Ubah atau hapus filter untuk melihat penjualan lain.'
                            : 'Riwayat akan tampil setelah penjualan berhasil dibuat.' }</p>
                    </div>
                ) }
            </section>
        </div>
    );
}
