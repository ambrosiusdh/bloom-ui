import { useEffect, useState } from 'react';
import {
    Link,
    useLocation,
    useSearchParams
} from 'react-router-dom';
import {
    Alert,
    Button,
    CircularProgress,
    Collapse,
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
import { SlidersHorizontalIcon } from 'lucide-react';

import {
    useBreadcrumbStore,
    useStockAdjustmentStore
} from '@stores/index.js';
import { formatDate, isValidDateInput } from '@utils/date-utils.js';

const PAGE_SIZES = [5, 10, 25, 50];

const queryState = params => {
    const next = new URLSearchParams(params);
    const rawPage = Number(params.get('page'));
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const rawSize = Number(params.get('size'));
    const size = PAGE_SIZES.includes(rawSize) ? rawSize : 10;
    const query = params.get('q') || '';
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

    if (params.has('page') && params.get('page') !== String(page)) {
        next.set('page', String(page));
    }
    if (params.has('size') && params.get('size') !== String(size)) {
        next.set('size', String(size));
    }

    return {
        page,
        size,
        query,
        startDate: startDate && (!endDate || startDate <= endDate) ? startDate : '',
        endDate: endDate && (!startDate || startDate <= endDate) ? endDate : '',
        canonical: next.toString(),
        needsSanitization: next.toString() !== params.toString()
    };
};

const toInstant = (date, endOfDay = false) => date
    ? new Date(`${ date }T${ endOfDay ? '23:59:59.999' : '00:00:00.000' }`).toISOString()
    : undefined;

const getItemSummary = adjustment => {
    const items = Array.isArray(adjustment.items) ? adjustment.items : [];

    if (!items.length) {
        return {
            count: 'Rincian tersedia di detail',
            locations: ''
        };
    }

    const locations = Array.from(new Set(items.map(item => item.stockLocation)
        .filter(Boolean)))
        .map(location => location === 'STORE'
            ? 'Toko'
            : location === 'WAREHOUSE'
                ? 'Gudang'
                : location)
        .join(' dan ');

    return {
        count: `${ items.length } barang`,
        locations
    };
};

export default function StockAdjustmentList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const adjustments = useStockAdjustmentStore(state => state.stockAdjustmentList);
    const paging = useStockAdjustmentStore(state => state.stockAdjustmentPaging);
    const status = useStockAdjustmentStore(state => state.stockAdjustmentListStatus);
    const error = useStockAdjustmentStore(state => state.stockAdjustmentListError);
    const load = useStockAdjustmentStore(state => state.getStockAdjustmentList);
    const location = useLocation();
    const [params, setParams] = useSearchParams();
    const state = queryState(params);
    const [draftQuery, setDraftQuery] = useState(state.query);
    const [draftStartDate, setDraftStartDate] = useState(state.startDate);
    const [draftEndDate, setDraftEndDate] = useState(state.endDate);
    const [showMoreFilters, setShowMoreFilters] = useState(
        Boolean(state.startDate || state.endDate)
    );
    const [filterError, setFilterError] = useState('');
    const [retry, setRetry] = useState(0);
    const totalPages = Number(paging.totalPages) || 0;
    const totalElements = Number.isFinite(Number(paging.totalElements))
        ? Number(paging.totalElements)
        : adjustments.length;
    const firstVisibleItem = totalElements ? (state.page - 1) * state.size + 1 : 0;
    const lastVisibleItem = totalElements
        ? Math.min(firstVisibleItem + adjustments.length - 1, totalElements)
        : 0;
    const outOfRange = status === 'ready' && totalPages > 0 && state.page > totalPages;
    const returnTo = `${ location.pathname }${ location.search }`;
    const hasAppliedFilters = Boolean(state.query || state.startDate || state.endDate);
    const hasDraftFilters = Boolean(draftQuery || draftStartDate || draftEndDate);

    useEffect(() => {
        setBreadcrumbs(['Persediaan', 'Penyesuaian Stok']);
    }, [setBreadcrumbs]);

    useEffect(() => {
        setDraftQuery(state.query);
        setDraftStartDate(state.startDate);
        setDraftEndDate(state.endDate);
        setShowMoreFilters(previous => previous || Boolean(state.startDate || state.endDate));
    }, [state.endDate, state.query, state.startDate]);

    useEffect(() => {
        if (state.needsSanitization) {
            setParams(state.canonical, { replace: true });
        }
    }, [setParams, state.canonical, state.needsSanitization]);

    useEffect(() => {
        if (state.needsSanitization) {
            return undefined;
        }
        const controller = new AbortController();
        load({
            page: state.page,
            size: state.size,
            ...(state.query ? { stockAdjustmentCode: state.query } : {}),
            ...(state.startDate ? { startDate: toInstant(state.startDate) } : {}),
            ...(state.endDate ? { endDate: toInstant(state.endDate, true) } : {})
        }, { signal: controller.signal }, { useLoader: false }).catch(() => {});
        return () => controller.abort();
    }, [load, retry, state.endDate, state.needsSanitization, state.page, state.query,
        state.size, state.startDate]);

    useEffect(() => {
        if (!outOfRange) {
            return;
        }
        setParams(current => {
            const next = new URLSearchParams(current);
            next.set('page', String(totalPages));
            return next;
        }, { replace: true });
    }, [outOfRange, setParams, totalPages]);

    const updateQuery = updates => {
        const next = new URLSearchParams(params);
        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                next.set(key, String(value));
            } else {
                next.delete(key);
            }
        });
        setParams(next);
    };

    const applyFilters = event => {
        event.preventDefault();

        if (draftStartDate && draftEndDate && draftStartDate > draftEndDate) {
            setFilterError('Tanggal mulai tidak boleh setelah tanggal akhir.');
            return;
        }

        setFilterError('');
        updateQuery({
            q: draftQuery.trim(),
            startDate: draftStartDate,
            endDate: draftEndDate,
            page: 1
        });
    };

    const clearFilters = () => {
        setDraftQuery('');
        setDraftStartDate('');
        setDraftEndDate('');
        setFilterError('');
        updateQuery({
            q: '',
            startDate: '',
            endDate: '',
            page: 1
        });
    };

    return (
        <div className="space-y-4">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Riwayat penyesuaian stok</h2>
                    <p className="mt-1 text-slate-600">Setiap nilai stok berasal dari transaksi server.</p>
                </div>
                <Button component={ Link } to="/stock-adjustments/new" variant="contained">
                    Buat penyesuaian
                </Button>
            </header>

            <Paper
                component="form"
                className="space-y-3 p-4"
                aria-label="Filter riwayat penyesuaian stok"
                onSubmit={ applyFilters }
            >
                <div className="grid gap-3 md:grid-cols-[minmax(15rem,1fr)_auto_auto] md:items-start">
                    <TextField
                        fullWidth
                        size="small"
                        type="search"
                        label="Nomor referensi"
                        placeholder="Contoh: SA/IX-2026/0003"
                        value={ draftQuery }
                        onChange={ event => setDraftQuery(event.target.value) }
                    />
                    <Button
                        type="button"
                        variant="outlined"
                        startIcon={ <SlidersHorizontalIcon size={ 18 } aria-hidden="true" /> }
                        aria-expanded={ showMoreFilters }
                        aria-controls="stock-adjustment-more-filters"
                        onClick={ () => setShowMoreFilters(value => !value) }
                    >
                        Filter lainnya
                    </Button>
                    <Button type="submit" variant="contained">Terapkan</Button>
                </div>

                <Collapse in={ showMoreFilters }>
                    <div
                        id="stock-adjustment-more-filters"
                        className="grid gap-3 border-t pt-3 md:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto] md:items-start"
                    >
                        <TextField
                            size="small"
                            type="date"
                            label="Dari tanggal"
                            value={ draftStartDate }
                            error={ !!filterError }
                            slotProps={ {
                                inputLabel: { shrink: true },
                                htmlInput: {
                                    'aria-describedby': filterError
                                        ? 'stock-adjustment-filter-error'
                                        : undefined
                                }
                            } }
                            onChange={ event => {
                                setDraftStartDate(event.target.value);
                                setFilterError('');
                            } }
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="Sampai tanggal"
                            value={ draftEndDate }
                            error={ !!filterError }
                            slotProps={ {
                                inputLabel: { shrink: true },
                                htmlInput: {
                                    'aria-describedby': filterError
                                        ? 'stock-adjustment-filter-error'
                                        : undefined
                                }
                            } }
                            onChange={ event => {
                                setDraftEndDate(event.target.value);
                                setFilterError('');
                            } }
                        />
                        <Button
                            type="button"
                            disabled={ !hasAppliedFilters && !hasDraftFilters }
                            onClick={ clearFilters }
                        >
                            Hapus filter
                        </Button>
                    </div>
                </Collapse>

                { filterError && (
                    <Alert id="stock-adjustment-filter-error" severity="error">
                        <strong>Rentang tanggal belum benar.</strong> { filterError }
                    </Alert>
                ) }
            </Paper>

            { error && (
                <Alert
                    severity="error"
                    action={ (
                    <Button color="inherit" onClick={ () => setRetry(value => value + 1) }>Coba lagi</Button>
                ) }>
                    { error.message || 'Riwayat penyesuaian gagal dimuat.' }
                </Alert>
            ) }

            <section className="rounded-lg bg-white shadow-lg" aria-label="Daftar penyesuaian stok">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Daftar penyesuaian</h2>
                        { status === 'ready' && !outOfRange && (
                            <p className="mt-1 text-sm text-slate-600" aria-live="polite">
                                { adjustments.length
                                    ? `${ firstVisibleItem }–${ lastVisibleItem } dari ${ totalElements } penyesuaian · Urutan dari server`
                                    : '0 penyesuaian' }
                            </p>
                        ) }
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <TextField
                            select
                            SelectProps={ { native: true } }
                            size="small"
                            label="Data per halaman"
                            value={ state.size }
                            onChange={ event => updateQuery({ size: event.target.value, page: 1 }) }>
                            { PAGE_SIZES.map(size => <option key={ size } value={ size }>{ size }</option>) }
                        </TextField>
                        <Pagination page={ totalPages ? Math.min(state.page, totalPages) : state.page }
                            count={ totalPages || 1 }
                            disabled={ status === 'loading' || !totalPages }
                            onChange={ (_, page) => updateQuery({ page }) }
                            aria-label="Halaman penyesuaian stok" />
                    </div>
                </div>

                { status === 'loading' || status === 'idle' || outOfRange ? (
                    <div className="py-12 text-center" role="status">
                        <CircularProgress size={ 22 } /> Memuat penyesuaian stok...
                    </div>
                ) : status === 'error' ? (
                    <p className="p-8 text-center text-slate-600">Data belum dapat ditampilkan.</p>
                ) : adjustments.length ? (
                    <TableContainer component={ Paper } elevation={ 0 } className="!overflow-x-hidden">
                        <Table className="!block lg:!table lg:!table-fixed" aria-label="Daftar penyesuaian stok">
                            <caption className="sr-only">
                                Referensi, alasan, ringkasan barang dan lokasi, pembuat, waktu, dan tindakan detail.
                            </caption>
                            <TableHead className="hidden bg-gray-100 lg:!table-header-group">
                                <TableRow>
                                    <TableCell className="lg:!w-[22%]">Referensi</TableCell>
                                    <TableCell className="lg:!w-[30%]">Alasan</TableCell>
                                    <TableCell className="lg:!w-[20%]">Ringkasan</TableCell>
                                    <TableCell className="lg:!w-[20%]">Dicatat</TableCell>
                                    <TableCell className="lg:!w-[6rem]"><span className="sr-only">Detail</span></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody className="!block lg:!table-row-group">
                                { adjustments.map((adjustment, index) => {
                                    const summary = getItemSummary(adjustment);
                                    const isLastRow = index === adjustments.length - 1;
                                    const rowBorderClass = isLastRow ? '' : 'border-b border-gray-200';

                                    return (
                                        <TableRow
                                            key={ adjustment.stockAdjustmentCode }
                                            hover
                                            className={ `!grid grid-cols-1 gap-x-5 gap-y-4 px-4 py-4 sm:grid-cols-2 lg:!table-row lg:p-0 ${ rowBorderClass } lg:border-b-0` }
                                        >
                                            <TableCell className="!block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4">
                                                <span className="block text-xs font-medium text-slate-600 lg:hidden">Referensi</span>
                                                <strong className="mt-1 block break-all lg:mt-0">
                                                    { adjustment.stockAdjustmentCode }
                                                </strong>
                                            </TableCell>
                                            <TableCell className="!block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4">
                                                <span className="block text-xs font-medium text-slate-600 lg:hidden">Alasan</span>
                                                <span className="mt-1 block break-words lg:mt-0">
                                                    { adjustment.reason || '-' }
                                                </span>
                                                <span className="mt-1 block text-sm text-slate-600">
                                                    Alasan tersimpan bersama transaksi
                                                </span>
                                            </TableCell>
                                            <TableCell className="!block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4">
                                                <span className="block text-xs font-medium text-slate-600 lg:hidden">Ringkasan</span>
                                                <strong className="mt-1 block font-medium lg:mt-0">{ summary.count }</strong>
                                                { summary.locations && (
                                                    <span className="mt-1 block text-sm text-slate-600">
                                                        { summary.locations }
                                                    </span>
                                                ) }
                                            </TableCell>
                                            <TableCell className="!block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4">
                                                <span className="block text-xs font-medium text-slate-600 lg:hidden">Dicatat</span>
                                                <strong className="mt-1 block break-words font-medium lg:mt-0">
                                                    { adjustment.createdBy || 'SYSTEM' }
                                                </strong>
                                                <span className="mt-1 block text-sm text-slate-600">
                                                    { formatDate(adjustment.createdAt) || '-' }
                                                </span>
                                            </TableCell>
                                            <TableCell className="!block !border-b-0 !p-0 sm:col-span-2 lg:!table-cell lg:!border-b lg:!p-4">
                                                <span className="block text-xs font-medium text-slate-600 lg:hidden">Detail</span>
                                                <Button
                                                    className="mt-1 min-h-11 lg:mt-0"
                                                    component={ Link }
                                                    to={ `/stock-adjustments/${ encodeURIComponent(adjustment.stockAdjustmentCode) }` }
                                                    state={ { from: returnTo } }
                                                    aria-label={ `Buka detail ${ adjustment.stockAdjustmentCode }` }
                                                >
                                                    Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) }
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <div className="p-10 text-center">
                        <strong>
                            { hasAppliedFilters
                                ? 'Tidak ada hasil untuk filter ini'
                                : 'Belum ada penyesuaian stok' }
                        </strong>
                        <p className="mt-1 text-slate-600">
                            { hasAppliedFilters
                                ? 'Ubah nomor referensi, rentang tanggal, atau hapus filter untuk menampilkan riwayat lain.'
                                : 'Riwayat akan tampil setelah penyesuaian berhasil dibukukan.' }
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
