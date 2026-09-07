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
import { Search } from 'lucide-react';
import PropTypes from 'prop-types';

import { GENERIC_ERR_MESSAGE } from '@constants/general.js';
import { useBreadcrumbStore, useSupplierStore } from '@stores/index.js';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const SUPPLIER_QUERY_MAX_LENGTH = 255;

const getPage = searchParams => Math.max(Number(searchParams.get('page')) || 1, 1);

const getPageSize = searchParams => {
    const requestedSize = Number(searchParams.get('size'));
    return PAGE_SIZE_OPTIONS.includes(requestedSize) ? requestedSize : PAGE_SIZE_OPTIONS[0];
};

const getActive = searchParams => searchParams.get('active') !== 'false';
const getErrorMessage = error => error?.message || GENERIC_ERR_MESSAGE;
const valueOrDash = value => value || '-';

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

function SupplierCard({ supplier, returnTo }) {
    return (
        <Paper component="article" className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-semibold break-words">{ supplier.name }</h3>
                    <p className="text-sm text-gray-600 break-all">{ supplier.code }</p>
                </div>
                <SupplierStatus active={ supplier.active } />
            </div>
            <dl className="grid gap-2 text-sm">
                <div>
                    <dt className="text-gray-600">Kontak</dt>
                    <dd className="break-words">{ valueOrDash(supplier.contactNumber) }</dd>
                </div>
                <div>
                    <dt className="text-gray-600">Alamat</dt>
                    <dd className="break-words">{ valueOrDash(supplier.address) }</dd>
                </div>
            </dl>
            <Button
                component={ Link }
                to={ `/suppliers/${ encodeURIComponent(supplier.code) }` }
                state={ { from: returnTo } }
                size="small"
            >
                Lihat detail { supplier.name }
            </Button>
        </Paper>
    );
}

SupplierCard.propTypes = {
    supplier: PropTypes.shape({
        code: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        contactNumber: PropTypes.string,
        address: PropTypes.string,
        active: PropTypes.bool.isRequired
    }).isRequired,
    returnTo: PropTypes.string.isRequired
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
    const [retryVersion, setRetryVersion] = useState(0);

    const page = getPage(searchParams);
    const size = getPageSize(searchParams);
    const query = searchParams.get('query')?.trim() || '';
    const queryIsTooLong = query.length > SUPPLIER_QUERY_MAX_LENGTH;
    const active = getActive(searchParams);
    const [queryInput, setQueryInput] = useState(query);
    const returnTo = `${ location.pathname }${ location.search }`;

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

    const handleSearch = event => {
        event.preventDefault();
        const nextQuery = queryInput.trim();
        if (nextQuery.length > SUPPLIER_QUERY_MAX_LENGTH) return;
        updateQuery({ query: nextQuery, page: 1 });
    };

    const handleClearSearch = () => {
        setQueryInput('');
        updateQuery({ query: null, page: 1 });
    };

    const isInitialLoading = status === 'loading' && suppliers.length === 0;
    const hasResults = status !== 'error' && suppliers.length > 0;

    return (
        <div className="space-y-5 pb-8">
            <header>
                <h2 className="text-2xl font-bold">Pemasok</h2>
                <p className="text-gray-600">Cari dan periksa data pemasok berdasarkan catatan server.</p>
            </header>

            <Paper component="section" className="p-4" aria-label="Pencarian pemasok">
                <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-start" onSubmit={ handleSearch }>
                    <TextField
                        label="Cari pemasok"
                        value={ queryInput }
                        onChange={ event => setQueryInput(event.target.value) }
                        inputProps={ { maxLength: SUPPLIER_QUERY_MAX_LENGTH } }
                        error={ queryInput.trim().length > SUPPLIER_QUERY_MAX_LENGTH }
                        helperText={ queryInput.trim().length > SUPPLIER_QUERY_MAX_LENGTH
                            ? `Pencarian maksimal ${ SUPPLIER_QUERY_MAX_LENGTH } karakter.`
                            : 'Kode, nama, kontak, atau alamat' }
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
                    <div className="flex flex-wrap gap-2 md:pt-2">
                        <Button type="submit" variant="contained" startIcon={ <Search aria-hidden="true" /> }>
                            Cari
                        </Button>
                        { query && <Button type="button" onClick={ handleClearSearch }>Hapus pencarian</Button> }
                    </div>
                </form>
            </Paper>

            { queryIsTooLong && (
                <Alert severity="warning">
                    Pencarian maksimal { SUPPLIER_QUERY_MAX_LENGTH } karakter. Perpendek atau hapus pencarian untuk melanjutkan.
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
                    <p className="text-gray-600 mt-1">
                        { query ? 'Tidak ada pemasok yang cocok dengan pencarian ini.' : `Belum ada pemasok ${ active ? 'aktif' : 'tidak aktif' }.` }
                    </p>
                </Paper>
            ) }

            { !queryIsTooLong && hasResults && (
                <>
                    <div className="grid gap-3 md:hidden" aria-busy={ status === 'loading' }>
                        { suppliers.map(supplier => (
                            <SupplierCard key={ supplier.code } supplier={ supplier } returnTo={ returnTo } />
                        )) }
                    </div>

                    <TableContainer component={ Paper } className="hidden md:block" aria-busy={ status === 'loading' }>
                        <Table>
                            <caption className="sr-only">Daftar pemasok { active ? 'aktif' : 'tidak aktif' }</caption>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Kode</TableCell>
                                    <TableCell>Nama</TableCell>
                                    <TableCell>Kontak</TableCell>
                                    <TableCell>Alamat</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Aksi</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                { suppliers.map(supplier => (
                                    <TableRow key={ supplier.code }>
                                        <TableCell className="break-all">{ supplier.code }</TableCell>
                                        <TableCell className="font-medium">{ supplier.name }</TableCell>
                                        <TableCell>{ valueOrDash(supplier.contactNumber) }</TableCell>
                                        <TableCell>{ valueOrDash(supplier.address) }</TableCell>
                                        <TableCell><SupplierStatus active={ supplier.active } /></TableCell>
                                        <TableCell align="right">
                                            <Button
                                                component={ Link }
                                                to={ `/suppliers/${ encodeURIComponent(supplier.code) }` }
                                                state={ { from: returnTo } }
                                                size="small"
                                            >
                                                Detail
                                                <span className="sr-only"> { supplier.name }</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) }
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            ) }

            { !queryIsTooLong && status !== 'error' && paging.totalPages > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <TextField
                        select
                        label="Baris per halaman"
                        value={ size }
                        onChange={ event => updateQuery({ size: event.target.value, page: 1 }) }
                        size="small"
                        className="w-44"
                    >
                        { PAGE_SIZE_OPTIONS.map(option => <MenuItem key={ option } value={ option }>{ option }</MenuItem>) }
                    </TextField>
                    <Pagination
                        count={ paging.totalPages }
                        page={ page }
                        onChange={ (_event, nextPage) => updateQuery({ page: nextPage }) }
                        getItemAriaLabel={ (type, itemPage) => type === 'page' ? `Ke halaman ${ itemPage }` : `${ type } halaman` }
                        color="primary"
                    />
                </div>
            ) }
        </div>
    );
}
