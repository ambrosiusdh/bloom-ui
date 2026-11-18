import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip
} from '@mui/material';
import {
    Eye,
    Plus,
    RotateCcw,
    Search
} from 'lucide-react';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { GENERIC_ERR_MESSAGE } from '@constants/general.js';
import { useBreadcrumbStore, useSupplierStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const SUPPLIER_QUERY_MAX_LENGTH = 255;

const getPage = searchParams => Math.max(Number(searchParams.get('page')) || 1, 1);

const getPageSize = searchParams => {
    const requestedSize = Number(searchParams.get('size'));
    return PAGE_SIZE_OPTIONS.includes(requestedSize) ? requestedSize : PAGE_SIZE_OPTIONS[0];
};

const getActive = searchParams => searchParams.get('active') !== 'false';
const getErrorMessage = error => error?.message || GENERIC_ERR_MESSAGE;
const valueOrFallback = (value, fallback) => value || fallback;
const money = value => value == null ? '-' : formatRupiah(value);

function SupplierStatus({ active }) {
    const label = active ? 'Aktif' : 'Tidak aktif';

    return (
        <Chip
            color={ active ? 'success' : 'default' }
            label={ label }
            size="small"
            aria-label={ `Status pemasok: ${ label }` }
        />
    );
}

SupplierStatus.propTypes = {
    active: PropTypes.bool.isRequired
};

function SupplierOutstandingBalance({ supplier }) {
    const balanceEntry = useSupplierStore(state => state.supplierListBalances[supplier.code]);
    const getSupplierListBalance = useSupplierStore(state => state.getSupplierListBalance);
    const [retryVersion, setRetryVersion] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        getSupplierListBalance(
            supplier.code,
            { signal: controller.signal },
            { useLoader: false }
        ).catch(() => {});

        return () => controller.abort();
    }, [getSupplierListBalance, retryVersion, supplier.code]);

    const isCurrentBalance = balanceEntry?.data?.supplierCode === supplier.code;

    if (!balanceEntry || balanceEntry.status === 'loading'
        || (balanceEntry.status === 'ready' && !isCurrentBalance)) {
        return (
            <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <CircularProgress size={ 16 } aria-hidden="true" />
                Memuat saldo...
            </span>
        );
    }

    if (balanceEntry.status === 'error' || !isCurrentBalance) {
        return (
            <div className="space-y-1">
                <span className="block text-sm text-gray-600">Saldo belum tersedia.</span>
                <Button
                    type="button"
                    size="small"
                    onClick={ () => setRetryVersion(value => value + 1) }
                    aria-label={ `Coba lagi saldo utang ${ supplier.name }` }
                >
                    Coba lagi
                </Button>
            </div>
        );
    }

    return (
        <div>
            <strong className="block whitespace-nowrap font-semibold tabular-nums">
                { money(balanceEntry.data.outstandingAmount) }
            </strong>
            <span className="mt-1 block text-xs text-gray-600">Nilai server</span>
        </div>
    );
}

SupplierOutstandingBalance.propTypes = {
    supplier: PropTypes.shape({
        code: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
    }).isRequired
};

export default function SupplierList() {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const suppliers = useSupplierStore(state => state.supplierList);
    const paging = useSupplierStore(state => state.supplierPaging);
    const status = useSupplierStore(state => state.listStatus);
    const error = useSupplierStore(state => state.listError);
    const getSupplierList = useSupplierStore(state => state.getSupplierList);
    const clearSupplierListBalances = useSupplierStore(state => state.clearSupplierListBalances);
    const [retryVersion, setRetryVersion] = useState(0);

    const page = getPage(searchParams);
    const size = getPageSize(searchParams);
    const query = searchParams.get('query')?.trim() || '';
    const queryIsTooLong = query.length > SUPPLIER_QUERY_MAX_LENGTH;
    const active = getActive(searchParams);
    const [queryInput, setQueryInput] = useState(query);
    const returnTo = `${ location.pathname }${ location.search }`;
    const totalElements = Number.isFinite(Number(paging.totalElements))
        ? Number(paging.totalElements)
        : suppliers.length;
    const totalPages = Math.max(Number(paging.totalPages) || 0, 0);
    const rangeStart = suppliers.length ? ((page - 1) * size) + 1 : 0;
    const rangeEnd = suppliers.length ? rangeStart + suppliers.length - 1 : 0;
    const hasFilters = Boolean(query) || !active;

    const updateQuery = updates => {
        const nextSearchParams = new URLSearchParams(searchParams);

        Object.entries(updates).forEach(([key, value]) => {
            if (value === '' || value === undefined || value === null) {
                nextSearchParams.delete(key);
            } else {
                nextSearchParams.set(key, String(value));
            }
        });
        setSearchParams(nextSearchParams);
    };

    useEffect(() => {
        setBreadcrumbs(['Pemasok']);
    }, [setBreadcrumbs]);

    useEffect(() => {
        setQueryInput(query);
    }, [query]);

    useEffect(() => {
        if (queryIsTooLong) return undefined;

        const controller = new AbortController();
        getSupplierList({
            signal: controller.signal,
            params: {
                page,
                size,
                active,
                ...(query ? { query } : {})
            }
        }).catch(() => {});

        return () => controller.abort();
    }, [active, getSupplierList, page, query, queryIsTooLong, retryVersion, size]);

    useEffect(() => () => clearSupplierListBalances(), [clearSupplierListBalances]);

    const handleSearch = event => {
        event.preventDefault();
        const nextQuery = queryInput.trim();

        if (nextQuery.length > SUPPLIER_QUERY_MAX_LENGTH) return;
        updateQuery({
            query: nextQuery,
            page: 1
        });
    };

    const handleResetFilters = () => {
        setQueryInput('');
        setSearchParams({});
    };

    const isInitialLoading = status === 'loading' && suppliers.length === 0;
    const hasResults = status !== 'error' && suppliers.length > 0;

    return (
        <div className="space-y-5 pb-8">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Pemasok</h2>
                    <p className="text-gray-600">
                        Cari pemasok aktif maupun tidak aktif tanpa menghapus riwayat.
                    </p>
                </div>
                <Button
                    component={ Link }
                    to="/suppliers/maintenance/new"
                    state={ { from: returnTo } }
                    variant="contained"
                    startIcon={ <Plus aria-hidden="true" /> }
                >
                    Buat pemasok
                </Button>
            </header>

            <Paper component="section" className="p-4" aria-label="Filter pemasok">
                <form
                    className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-start"
                    onSubmit={ handleSearch }
                >
                    <TextField
                        label="Cari pemasok"
                        value={ queryInput }
                        onChange={ event => setQueryInput(event.target.value) }
                        inputProps={ { maxLength: SUPPLIER_QUERY_MAX_LENGTH } }
                        error={ queryInput.trim().length > SUPPLIER_QUERY_MAX_LENGTH }
                        helperText={ queryInput.trim().length > SUPPLIER_QUERY_MAX_LENGTH
                            ? `Pencarian maksimal ${ SUPPLIER_QUERY_MAX_LENGTH } karakter.`
                            : 'Nama, kode, telepon, atau alamat' }
                        fullWidth
                    />
                    <TextField
                        select
                        label="Status pemasok"
                        value={ String(active) }
                        onChange={ event => updateQuery({
                            active: event.target.value === 'false' ? false : null,
                            page: 1
                        }) }
                        fullWidth
                    >
                        <MenuItem value="true">Aktif</MenuItem>
                        <MenuItem value="false">Tidak aktif</MenuItem>
                    </TextField>
                    <div className="flex flex-wrap gap-2 lg:pt-2">
                        <Button type="submit" variant="contained" startIcon={ <Search aria-hidden="true" /> }>
                            Cari
                        </Button>
                        <Button
                            type="button"
                            disabled={ !hasFilters }
                            startIcon={ <RotateCcw aria-hidden="true" /> }
                            onClick={ handleResetFilters }
                        >
                            Reset filter
                        </Button>
                    </div>
                </form>
            </Paper>

            { queryIsTooLong && (
                <Alert severity="warning">
                    Pencarian maksimal { SUPPLIER_QUERY_MAX_LENGTH } karakter. Perpendek atau reset filter untuk melanjutkan.
                </Alert>
            ) }

            { !queryIsTooLong && status === 'loading' && (
                <div role="status" aria-live="polite" className="flex items-center gap-2 text-gray-700">
                    <CircularProgress size={ 20 } aria-hidden="true" />
                    <span>Memuat pemasok...</span>
                </div>
            ) }

            { !queryIsTooLong && status === 'error' && (
                <Alert
                    severity="error"
                    action={ <Button color="inherit" onClick={ () => setRetryVersion(value => value + 1) }>Coba lagi</Button> }
                >
                    { getErrorMessage(error) }
                </Alert>
            ) }

            { !queryIsTooLong && !isInitialLoading && status !== 'error' && suppliers.length === 0 && (
                <Paper className="p-8 text-center" role="status">
                    <h3 className="font-semibold">Tidak ada pemasok</h3>
                    <p className="mt-1 text-gray-600">
                        { hasFilters
                            ? 'Tidak ada pemasok yang cocok. Ubah atau reset filter untuk melihat catatan lain.'
                            : 'Belum ada pemasok aktif.' }
                    </p>
                    { hasFilters ? (
                        <Button className="mt-3" onClick={ handleResetFilters }>Reset filter</Button>
                    ) : (
                        <Button
                            component={ Link }
                            to="/suppliers/maintenance/new"
                            state={ { from: returnTo } }
                            className="mt-3"
                        >
                            Buat pemasok pertama
                        </Button>
                    ) }
                </Paper>
            ) }

            { !queryIsTooLong && hasResults && (
                <Paper component="section" aria-labelledby="supplier-list-title" className="overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div aria-live="polite">
                            <h3 id="supplier-list-title" className="font-semibold">Daftar pemasok</h3>
                            <p className="text-sm text-gray-600">
                                { totalElements } pemasok ditemukan · { rangeStart }–{ rangeEnd } dari { totalElements }
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <TextField
                                select
                                label="Per halaman"
                                value={ size }
                                onChange={ event => updateQuery({
                                    size: event.target.value,
                                    page: 1
                                }) }
                                size="small"
                                className="w-36"
                            >
                                { PAGE_SIZE_OPTIONS.map(option => (
                                    <MenuItem key={ option } value={ option }>{ option }</MenuItem>
                                )) }
                            </TextField>
                            <Button
                                type="button"
                                disabled={ status === 'loading' || page <= 1 }
                                onClick={ () => updateQuery({ page: page - 1 }) }
                            >
                                Sebelumnya
                            </Button>
                            <span className="text-sm text-gray-600 whitespace-nowrap">
                                Halaman { page } dari { totalPages }
                            </span>
                            <Button
                                type="button"
                                disabled={ status === 'loading' || page >= totalPages }
                                onClick={ () => updateQuery({ page: page + 1 }) }
                            >
                                Berikutnya
                            </Button>
                        </div>
                    </div>

                    <TableContainer component="div" className="!overflow-x-hidden">
                        <Table
                            className="!block lg:!table lg:!table-fixed"
                            aria-label={ `Daftar pemasok ${ active ? 'aktif' : 'tidak aktif' }` }
                            aria-busy={ status === 'loading' }
                        >
                            <caption className="sr-only">
                                Identitas, kontak, status, saldo utang dari server, pembaruan, dan tindakan detail pemasok.
                            </caption>
                            <TableHead className="hidden bg-gray-100 lg:!table-header-group">
                                <TableRow>
                                    <TableCell className="lg:!w-[24%]">Pemasok</TableCell>
                                    <TableCell className="lg:!w-[25%]">Kontak</TableCell>
                                    <TableCell className="lg:!w-[12%]">Status</TableCell>
                                    <TableCell className="lg:!w-[15%]">Saldo utang</TableCell>
                                    <TableCell className="lg:!w-[18%]">Diperbarui oleh &amp; pada</TableCell>
                                    <TableCell className="lg:!w-[4rem]" align="right">
                                        <span className="sr-only">Detail</span>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody className="!block lg:!table-row-group">
                                { suppliers.map((supplier, index) => {
                                    const isLastRow = index === suppliers.length - 1;
                                    const rowBorderClass = isLastRow ? '' : 'border-b border-gray-200';
                                    const tableCellClass = isLastRow ? '!border-b-0' : '';

                                    return (
                                        <TableRow
                                            key={ supplier.code }
                                            className={ `!grid grid-cols-1 gap-x-5 gap-y-4 px-4 py-4 sm:grid-cols-2 lg:!table-row lg:p-0 ${ rowBorderClass } ${ supplier.active ? '' : 'bg-gray-50' } lg:border-b-0` }
                                        >
                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 sm:col-span-2 lg:!table-cell lg:!border-b lg:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 lg:hidden">Pemasok</span>
                                                <strong className="mt-1 block break-words font-semibold lg:mt-0">
                                                    { supplier.name }
                                                </strong>
                                                <span className="mt-1 block break-all text-sm text-gray-600">
                                                    { supplier.code }
                                                </span>
                                            </TableCell>

                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 lg:hidden">Kontak</span>
                                                <span className="mt-1 block break-words lg:mt-0">
                                                    { valueOrFallback(supplier.contactNumber, 'Telepon belum diisi') }
                                                </span>
                                                <span className="mt-1 block break-words text-sm text-gray-600">
                                                    { valueOrFallback(supplier.address, 'Alamat belum diisi') }
                                                </span>
                                            </TableCell>

                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                                <span className="mb-1 block text-xs font-medium text-gray-600 lg:hidden">Status</span>
                                                <SupplierStatus active={ supplier.active } />
                                            </TableCell>

                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 lg:hidden">Saldo utang</span>
                                                <div className="mt-1 lg:mt-0">
                                                    <SupplierOutstandingBalance supplier={ supplier } />
                                                </div>
                                            </TableCell>

                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 lg:hidden">
                                                    Diperbarui oleh &amp; pada
                                                </span>
                                                <strong className="mt-1 block break-words font-medium lg:mt-0">
                                                    { valueOrFallback(supplier.updatedBy, 'Pelaku tidak tersedia') }
                                                </strong>
                                                <span className="mt-1 block text-sm text-gray-600">
                                                    { formatDate(supplier.updatedAt) || 'Waktu tidak tersedia' }
                                                </span>
                                            </TableCell>

                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 sm:col-span-2 lg:!table-cell lg:!border-b lg:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 lg:hidden">Detail</span>
                                                <div className="mt-1 flex lg:mt-0 lg:justify-end">
                                                    <Tooltip title="Lihat detail" arrow>
                                                        <IconButton
                                                            component={ Link }
                                                            to={ `/suppliers/${ encodeURIComponent(supplier.code) }` }
                                                            state={ { from: returnTo } }
                                                            aria-label={ `Buka detail ${ supplier.name }` }
                                                            sx={ {
                                                                width: 44,
                                                                height: 44
                                                            } }
                                                        >
                                                            <Eye size={ 19 } aria-hidden="true" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) }
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            ) }
        </div>
    );
}
