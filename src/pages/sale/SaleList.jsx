import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    MenuItem,
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
import { formatDate, isValidDateInput } from '@utils/date-utils.js';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const FILTER_KEYS = {
    code: 'Kode penjualan',
    createdBy: 'Dibuat oleh'
};
const PAYMENT_LABELS = {
    CASH: 'Tunai',
    QRIS: 'QRIS'
};
const SALE_STATUS_LABELS = { COMPLETED: 'Selesai' };
const PAYMENT_STATUS_LABELS = { PAID: 'Lunas' };
const CORRECTION_STATUS_LABELS = { NONE: 'Tanpa pembatalan/retur' };
const INDONESIAN_DATE_PATTERN = /^(\d{2})-(\d{2})-(\d{4})$/;

const getStatusLabel = (labels, value) => labels[value] || value || '-';

const parseIndonesianDate = value => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return '';

    const match = INDONESIAN_DATE_PATTERN.exec(trimmedValue);
    if (!match) return null;

    const [, day, month, year] = match;
    const canonicalDate = `${ year }-${ month }-${ day }`;

    return isValidDateInput(canonicalDate) ? canonicalDate : null;
};

const formatIndonesianDateInput = value => {
    if (!isValidDateInput(value)) return '';

    const [year, month, day] = value.split('-');
    return `${ day }-${ month }-${ year }`;
};

const getQueryState = params => {
    const next = new URLSearchParams(params);
    const requestedPage = Number(params.get('page'));
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    if (params.has('page') && params.get('page') !== String(page)) {
        next.set('page', String(page));
    }

    const requestedSize = Number(params.get('size'));
    const size = PAGE_SIZE_OPTIONS.includes(requestedSize) ? requestedSize : 10;
    if (params.has('size') && params.get('size') !== String(size)) {
        next.set('size', String(size));
    }

    const requestedKey = params.get('key');
    const filterKey = Object.hasOwn(FILTER_KEYS, requestedKey) ? requestedKey : 'code';
    if (params.has('key') && requestedKey !== filterKey) {
        next.set('key', filterKey);
    }

    const startDate = isValidDateInput(params.get('startDate'))
        ? params.get('startDate')
        : '';
    const endDate = isValidDateInput(params.get('endDate'))
        ? params.get('endDate')
        : '';
    if (params.has('startDate') && !startDate) {
        next.delete('startDate');
    }
    if (params.has('endDate') && !endDate) {
        next.delete('endDate');
    }
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

const StatusChip = ({ labels, value, type, color = 'default' }) => {
    const label = getStatusLabel(labels, value);

    return (
        <Chip
            size="small"
            color={ color }
            variant="outlined"
            label={ label }
            aria-label={ `${ type }: ${ label }` }
        />
    );
};

StatusChip.propTypes = {
    color: PropTypes.string,
    labels: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    value: PropTypes.string
};

const SaleStatuses = ({ sale }) => (
    <div className="flex flex-wrap gap-2">
        <StatusChip
            labels={ SALE_STATUS_LABELS }
            value={ sale.saleStatus }
            type="Status penjualan"
            color={ sale.saleStatus === 'COMPLETED' ? 'success' : 'default' }
        />
        <StatusChip
            labels={ CORRECTION_STATUS_LABELS }
            value={ sale.correctionStatus }
            type="Status koreksi"
        />
    </div>
);

SaleStatuses.propTypes = { sale: PropTypes.object.isRequired };

const SalePayment = ({ sale }) => (
    <div className="flex flex-col items-start gap-1">
        <strong>{ PAYMENT_LABELS[sale.paymentType] || sale.paymentType || '-' }</strong>
        <StatusChip
            labels={ PAYMENT_STATUS_LABELS }
            value={ sale.paymentStatus }
            type="Status pembayaran"
            color={ sale.paymentStatus === 'PAID' ? 'success' : 'default' }
        />
    </div>
);

SalePayment.propTypes = { sale: PropTypes.object.isRequired };

const SaleCard = ({ sale, returnTo }) => (
    <Paper component="article" elevation={ 0 } className="space-y-4 border p-4">
        <div>
            <h3 className="font-semibold break-all">{ sale.code || '-' }</h3>
            <p className="text-sm text-gray-600">
                Sesi kas { sale.sessionId == null ? '-' : `#${ sale.sessionId }` }
            </p>
        </div>

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
                <dt className="text-gray-600">Status</dt>
                <dd className="mt-1"><SaleStatuses sale={ sale } /></dd>
            </div>
            <div>
                <dt className="text-gray-600">Pembayaran</dt>
                <dd className="mt-1"><SalePayment sale={ sale } /></dd>
            </div>
            <div>
                <dt className="text-gray-600">Total server</dt>
                <dd className="font-semibold tabular-nums">{ formatRupiah(sale.totalAmount) }</dd>
            </div>
            <div>
                <dt className="text-gray-600">Dibuat oleh &amp; pada</dt>
                <dd>{ sale.createdBy || 'SYSTEM' }</dd>
                <dd className="text-gray-600">{ formatDate(sale.createdAt) || '-' }</dd>
            </div>
        </dl>

        <Button
            component={ Link }
            to={ `/sales/${ encodeURIComponent(sale.code) }` }
            state={ { from: returnTo } }
            size="small"
        >
            Buka detail { sale.code }
        </Button>
    </Paper>
);

SaleCard.propTypes = {
    returnTo: PropTypes.string.isRequired,
    sale: PropTypes.object.isRequired
};

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
        startDate: formatIndonesianDateInput(queryState.startDate),
        endDate: formatIndonesianDateInput(queryState.endDate)
    });
    const [filterError, setFilterError] = useState('');
    const returnTo = `${ location.pathname }${ location.search }`;
    const totalElements = Number.isInteger(salePaging.totalElements)
        ? salePaging.totalElements
        : saleList.length;
    const totalPages = Number.isInteger(salePaging.totalPages) ? salePaging.totalPages : 0;
    const isPageOutOfRange = status === 'ready'
        && totalPages > 0
        && queryState.page > totalPages;
    const firstVisibleItem = saleList.length
        ? ((queryState.page - 1) * queryState.size) + 1
        : 0;
    const lastVisibleItem = saleList.length
        ? Math.min(firstVisibleItem + saleList.length - 1, totalElements)
        : 0;
    const hasAppliedFilters = Boolean(
        queryState.query || queryState.startDate || queryState.endDate
    );
    const hasDraftFilters = Boolean(
        draft.query
        || draft.startDate
        || draft.endDate
        || draft.filterKey !== 'code'
    );

    const updateQuery = updates => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                next.set(key, String(value));
            } else {
                next.delete(key);
            }
        });
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
            startDate: formatIndonesianDateInput(queryState.startDate),
            endDate: formatIndonesianDateInput(queryState.endDate)
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

        getSaleList(
            params,
            { signal: controller.signal },
            { useLoader: false }
        ).catch(() => {});

        return () => controller.abort();
    }, [getSaleList, queryState.endDate, queryState.filterKey, queryState.needsSanitization,
        queryState.page, queryState.query, queryState.size, queryState.startDate, retryVersion]);

    useEffect(() => {
        if (!isPageOutOfRange) return;

        setSearchParams(current => {
            const next = new URLSearchParams(current);
            next.set('page', String(totalPages));
            return next;
        }, { replace: true });
    }, [isPageOutOfRange, setSearchParams, totalPages]);

    const updateDraft = updates => {
        setFilterError('');
        setDraft(current => ({
            ...current,
            ...updates
        }));
    };

    const applyFilters = event => {
        event.preventDefault();

        const startDate = parseIndonesianDate(draft.startDate);
        const endDate = parseIndonesianDate(draft.endDate);

        if (startDate === null || endDate === null) {
            setFilterError('Gunakan format tanggal DD-MM-YYYY yang valid.');
            return;
        }

        if (startDate && endDate && startDate > endDate) {
            setFilterError('Tanggal mulai tidak boleh setelah tanggal akhir.');
            return;
        }

        setFilterError('');
        updateQuery({
            key: draft.filterKey,
            q: draft.query.trim(),
            startDate,
            endDate,
            page: 1
        });
    };

    const clearFilters = () => {
        setFilterError('');
        setDraft({
            filterKey: 'code',
            query: '',
            startDate: '',
            endDate: ''
        });
        updateQuery({
            key: '',
            q: '',
            startDate: '',
            endDate: '',
            page: 1
        });
    };

    return (
        <div className="space-y-4">
            <header>
                <h1 className="font-bold text-2xl">Riwayat penjualan</h1>
                <p className="mt-1 text-gray-600">
                    Nilai pembayaran dan status berasal langsung dari server.
                </p>
            </header>

            <form
                className="card space-y-3"
                aria-label="Filter riwayat penjualan"
                onSubmit={ applyFilters }
            >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <TextField
                        select
                        label="Cari berdasarkan"
                        value={ draft.filterKey }
                        onChange={ event => updateDraft({ filterKey: event.target.value }) }
                    >
                        { Object.entries(FILTER_KEYS).map(([value, label]) => (
                            <MenuItem key={ value } value={ value }>{ label }</MenuItem>
                        )) }
                    </TextField>
                    <TextField
                        label={ FILTER_KEYS[draft.filterKey] }
                        value={ draft.query }
                        placeholder={ draft.filterKey === 'code'
                            ? 'Contoh: SALE/IX-2026/0003'
                            : 'Contoh: admin' }
                        onChange={ event => updateDraft({ query: event.target.value }) }
                    />
                    <TextField
                        label="Tanggal mulai"
                        value={ draft.startDate }
                        placeholder="DD-MM-YYYY"
                        error={ Boolean(filterError) }
                        helperText="Hari-bulan-tahun"
                        slotProps={ {
                            htmlInput: {
                                inputMode: 'numeric',
                                'aria-describedby': filterError ? 'sale-date-error' : undefined
                            }
                        } }
                        onChange={ event => updateDraft({ startDate: event.target.value }) }
                    />
                    <TextField
                        label="Tanggal akhir"
                        value={ draft.endDate }
                        placeholder="DD-MM-YYYY"
                        error={ Boolean(filterError) }
                        helperText="Hari-bulan-tahun"
                        slotProps={ {
                            htmlInput: {
                                inputMode: 'numeric',
                                'aria-describedby': filterError ? 'sale-date-error' : undefined
                            }
                        } }
                        onChange={ event => updateDraft({ endDate: event.target.value }) }
                    />
                </div>
                { filterError && (
                    <Alert id="sale-date-error" severity="error">
                        <strong>Rentang tanggal belum benar.</strong> { filterError }
                    </Alert>
                ) }
                <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="contained">Terapkan filter</Button>
                    <Button
                        type="button"
                        onClick={ clearFilters }
                        disabled={ !hasAppliedFilters && !hasDraftFilters }
                    >
                        Hapus filter
                    </Button>
                </div>
            </form>

            <section
                className="rounded-lg bg-white shadow-lg pb-2"
                aria-labelledby="sale-list-heading"
            >
                <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 id="sale-list-heading" className="text-xl font-bold">
                            Daftar penjualan
                        </h2>
                        { status === 'ready' && !isPageOutOfRange && (
                            <p className="mt-1 text-sm text-gray-600" aria-live="polite">
                                { saleList.length
                                    ? `${ firstVisibleItem }–${ lastVisibleItem } dari ${ totalElements } penjualan · Terbaru lebih dulu`
                                    : '0 penjualan' }
                            </p>
                        ) }
                    </div>
                    <div
                        className="flex flex-wrap items-center gap-2"
                        aria-label="Navigasi halaman riwayat penjualan"
                    >
                        <span className="text-sm">Per halaman:</span>
                        <TextField
                            select
                            size="small"
                            value={ queryState.size }
                            className="w-20"
                            aria-label="Data per halaman"
                            onChange={ event => updateQuery({
                                size: event.target.value,
                                page: 1
                            }) }
                        >
                            { PAGE_SIZE_OPTIONS.map(value => (
                                <MenuItem key={ value } value={ value }>{ value }</MenuItem>
                            )) }
                        </TextField>
                        <Button
                            size="small"
                            disabled={ status === 'loading'
                                || queryState.page <= 1
                                || !totalPages }
                            onClick={ () => updateQuery({ page: queryState.page - 1 }) }
                        >
                            Sebelumnya
                        </Button>
                        <span className="min-w-24 text-center text-sm" aria-current="page">
                            Halaman { totalPages
                                ? Math.min(queryState.page, totalPages)
                                : 1 } dari { totalPages || 1 }
                        </span>
                        <Button
                            size="small"
                            disabled={ status === 'loading'
                                || !totalPages
                                || queryState.page >= totalPages }
                            onClick={ () => updateQuery({ page: queryState.page + 1 }) }
                        >
                            Berikutnya
                        </Button>
                    </div>
                </div>

                { error && (
                    <div className="px-4 pb-4">
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
                            <strong>Riwayat penjualan gagal dimuat.</strong>{ ' ' }
                            { error.message || 'Periksa koneksi lalu coba lagi.' }{ ' ' }
                            Filter tetap dipertahankan.
                        </Alert>
                    </div>
                ) }

                { status === 'loading' || status === 'idle' || isPageOutOfRange ? (
                    <div className="py-12 text-center" role="status" aria-live="polite">
                        <CircularProgress size={ 22 } aria-hidden="true" />{ ' ' }
                        <span>
                            { isPageOutOfRange
                                ? 'Menyesuaikan halaman penjualan...'
                                : 'Memuat penjualan...' }
                        </span>
                    </div>
                ) : status === 'error' ? (
                    <div className="py-12 text-center text-gray-600">
                        Riwayat penjualan belum dapat ditampilkan.
                    </div>
                ) : saleList.length ? (
                    <>
                        <div className="space-y-3 p-4 md:hidden">
                            { saleList.map(sale => (
                                <SaleCard
                                    key={ sale.code }
                                    sale={ sale }
                                    returnTo={ returnTo }
                                />
                            )) }
                        </div>
                        <TableContainer
                            component={ Paper }
                            elevation={ 0 }
                            className="hidden md:block"
                        >
                            <Table sx={ { minWidth: 920 } } aria-label="Riwayat penjualan">
                                <TableHead className="bg-gray-100">
                                    <TableRow>
                                        <TableCell>Penjualan</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Pembayaran</TableCell>
                                        <TableCell align="right">Total server</TableCell>
                                        <TableCell>Dibuat oleh &amp; pada</TableCell>
                                        <TableCell><span className="sr-only">Detail</span></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    { saleList.map(sale => (
                                        <TableRow key={ sale.code } hover>
                                            <TableCell>
                                                <strong>{ sale.code || '-' }</strong>
                                                <div className="text-sm text-gray-600">
                                                    Sesi kas { sale.sessionId == null
                                                        ? '-'
                                                        : `#${ sale.sessionId }` }
                                                </div>
                                            </TableCell>
                                            <TableCell><SaleStatuses sale={ sale } /></TableCell>
                                            <TableCell><SalePayment sale={ sale } /></TableCell>
                                            <TableCell align="right" className="tabular-nums">
                                                { formatRupiah(sale.totalAmount) }
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <span>{ sale.createdBy || 'SYSTEM' }</span>
                                                <div className="text-sm text-gray-600">
                                                    { formatDate(sale.createdAt) || '-' }
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    component={ Link }
                                                    to={ `/sales/${ encodeURIComponent(sale.code) }` }
                                                    state={ { from: returnTo } }
                                                    aria-label={ `Buka detail ${ sale.code }` }
                                                >
                                                    Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) }
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                ) : (
                    <div className="py-12 px-4 text-center">
                        <div className="font-semibold">Tidak ada penjualan</div>
                        <p className="mt-1 text-gray-600">
                            { hasAppliedFilters
                                ? 'Tidak ada hasil untuk filter ini. Hapus filter atau coba nilai lain.'
                                : 'Riwayat akan tampil setelah penjualan berhasil dibuat.' }
                        </p>
                        { hasAppliedFilters && (
                            <Button className="mt-3" variant="outlined" onClick={ clearFilters }>
                                Hapus filter
                            </Button>
                        ) }
                    </div>
                ) }
            </section>
        </div>
    );
}
