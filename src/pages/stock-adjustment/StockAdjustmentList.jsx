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

import {
    useBreadcrumbStore,
    useStockAdjustmentStore
} from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';

const PAGE_SIZES = [5, 10, 25, 50];

const queryState = params => {
    const next = new URLSearchParams(params);
    const rawPage = Number(params.get('page'));
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const rawSize = Number(params.get('size'));
    const size = PAGE_SIZES.includes(rawSize) ? rawSize : 10;
    const query = params.get('q') || '';

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
        canonical: next.toString(),
        needsSanitization: next.toString() !== params.toString()
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
    const [retry, setRetry] = useState(0);
    const totalPages = Number(paging.totalPages) || 0;
    const outOfRange = status === 'ready' && totalPages > 0 && state.page > totalPages;
    const returnTo = `${ location.pathname }${ location.search }`;

    useEffect(() => {
        setBreadcrumbs(['Persediaan', 'Penyesuaian Stok']);
    }, [setBreadcrumbs]);

    useEffect(() => {
        setDraftQuery(state.query);
    }, [state.query]);

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
            ...(state.query ? { stockAdjustmentCode: state.query } : {})
        }, { signal: controller.signal }, { useLoader: false }).catch(() => {});
        return () => controller.abort();
    }, [load, retry, state.needsSanitization, state.page, state.query, state.size]);

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
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start"
                onSubmit={ event => {
                    event.preventDefault();
                    updateQuery({ q: draftQuery.trim(), page: 1 });
                } }>
                <TextField
                    fullWidth
                    size="small"
                    label="Cari nomor referensi"
                    value={ draftQuery }
                    onChange={ event => setDraftQuery(event.target.value) }
                />
                <Button type="submit" variant="contained">Terapkan</Button>
                <Button
                    type="button"
                    disabled={ !state.query && !draftQuery }
                    onClick={ () => {
                        setDraftQuery('');
                        updateQuery({ q: '', page: 1 });
                    } }>Hapus filter</Button>
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
                    <h3 className="text-xl font-bold">Daftar penyesuaian</h3>
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
                    <TableContainer component={ Paper } elevation={ 0 }>
                        <Table sx={ { minWidth: 720 } }>
                            <TableHead className="bg-gray-100">
                                <TableRow>
                                    <TableCell>Nomor referensi</TableCell>
                                    <TableCell>Alasan</TableCell>
                                    <TableCell>Dibuat oleh</TableCell>
                                    <TableCell>Waktu</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                { adjustments.map(adjustment => (
                                    <TableRow key={ adjustment.stockAdjustmentCode } hover>
                                        <TableCell><strong>{ adjustment.stockAdjustmentCode }</strong></TableCell>
                                        <TableCell>{ adjustment.reason || '-' }</TableCell>
                                        <TableCell>{ adjustment.createdBy || 'SYSTEM' }</TableCell>
                                        <TableCell>{ formatDate(adjustment.createdAt) || '-' }</TableCell>
                                        <TableCell><Button component={ Link }
                                            to={ `/stock-adjustments/${ encodeURIComponent(adjustment.stockAdjustmentCode) }` }
                                            state={ { from: returnTo } }>
                                            Detail
                                        </Button></TableCell>
                                    </TableRow>
                                )) }
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <div className="p-10 text-center">
                        <strong>Belum ada penyesuaian stok</strong>
                        <p className="mt-1 text-slate-600">Buat penyesuaian saat stok fisik perlu dicatat ulang.</p>
                    </div>
                ) }
            </section>
        </div>
    );
}
