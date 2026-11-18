import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Alert, Button, CircularProgress, Pagination, Paper, TextField } from '@mui/material';

import api from '@api/stock-transfer.js';
import { formatCashSessionDate } from '@components/cash-session/cash-session-date.js';
import { useBreadcrumbStore } from '@stores/index.js';
import { TRANSFER_LOCATIONS } from '@utils/stock-transfer-utils.js';

const PAGE_SIZE = 10;

export default function StockTransferHistory() {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const page = Math.max(1, Math.floor(Number(searchParams.get('page')) || 1));
    const code = searchParams.get('code') || '';
    const [query, setQuery] = useState(code);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    const feedbackRef = useRef(null);
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);

    useEffect(() => setBreadcrumbs(['Persediaan', 'Riwayat Transfer Stok']), [setBreadcrumbs]);
    useEffect(() => setQuery(code), [code]);

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError('');
        setData(null);
        api.getStockTransfers({
            page,
            size: PAGE_SIZE,
            ...(code ? { code } : {})
        }, { signal: controller.signal }, { useLoader: false }).then(response => {
            if (!controller.signal.aborted) {
                setData(response.data?.data || null);
            }
        }).catch(requestError => {
            if (!controller.signal.aborted) {
                setError(requestError?.message || 'Riwayat transfer gagal dimuat.');
            }
        }).finally(() => {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        });

        return () => controller.abort();
    }, [code, page, retry]);

    useEffect(() => {
        if (error && !loading) {
            feedbackRef.current?.focus();
        }
    }, [error, loading]);

    const navigate = (nextPage, nextCode = code) => {
        const next = new URLSearchParams();

        next.set('page', String(nextPage));
        if (nextCode.trim()) {
            next.set('code', nextCode.trim());
        }
        setSearchParams(next);
    };
    const rows = data?.content || [];

    return (
        <div className="max-w-5xl space-y-4 pb-8">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Riwayat transfer stok</h1>
                    <p className="mt-1 text-slate-600">Catatan tersimpan dari server, terbaru lebih dahulu.</p>
                </div>
                <Button component={ Link } to="/stock-transfers/new" variant="contained">Buat transfer stok</Button>
            </header>
            <Paper
                component="form"
                className="flex flex-wrap items-start gap-3 p-4"
                onSubmit={ event => {
                    event.preventDefault();
                    navigate(1, query);
                } }
            >
                <TextField size="small" label="Referensi transfer" value={ query } onChange={ event => setQuery(event.target.value) } />
                <Button type="submit" variant="outlined">Cari</Button>
                { code && <Button onClick={ () => navigate(1, '') }>Hapus filter</Button> }
            </Paper>
            { loading ? (
                <div role="status"><CircularProgress size={ 20 } /> Memuat riwayat transfer...</div>
            ) : error ? (
                <Alert severity="error" ref={ feedbackRef } tabIndex={ -1 } action={ <Button color="inherit" onClick={ () => setRetry(value => value + 1) }>Coba lagi</Button> }>{ error }</Alert>
            ) : (
                <>
                    <p role="status">{ rows.length ? `${ (page - 1) * PAGE_SIZE + 1 }–${ (page - 1) * PAGE_SIZE + rows.length } dari ${ data.totalElements } transfer` : 'Tidak ada transfer yang ditampilkan.' }</p>
                    { !rows.length && <Alert severity="info">{ code ? 'Tidak ada transfer yang cocok. Ubah atau hapus filter.' : 'Belum ada transfer tersimpan.' }</Alert> }
                    <ul className="space-y-3" aria-label="Riwayat transfer">
                        { rows.map(transfer => (
                            <Paper component="li" key={ transfer.id } className="p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <h2 className="min-w-0 break-all text-lg font-semibold">{ transfer.code }</h2>
                                    <Button component={ Link } to={ `/stock-transfers/${ encodeURIComponent(transfer.code) }` } state={ { from: `${ location.pathname }${ location.search }` } } aria-label={ `Buka detail transfer ${ transfer.code }` }>Buka detail</Button>
                                </div>
                                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <div><dt>Lokasi asal</dt><dd>{ TRANSFER_LOCATIONS[transfer.sourceLocation] || '-' }</dd></div>
                                    <div><dt>Lokasi tujuan</dt><dd>{ TRANSFER_LOCATIONS[transfer.destinationLocation] || '-' }</dd></div>
                                    <div><dt>Jumlah baris</dt><dd>{ transfer.lineCount ?? '-' }</dd></div>
                                    <div className="min-w-0"><dt>Dicatat oleh</dt><dd className="break-words">{ transfer.createdBy || '-' }</dd></div>
                                    <div><dt>Waktu</dt><dd>{ formatCashSessionDate(transfer.createdAt) }</dd></div>
                                    <div className="min-w-0"><dt>Keterangan</dt><dd className="whitespace-pre-wrap break-words">{ transfer.description || 'Tidak ada' }</dd></div>
                                </dl>
                            </Paper>
                        )) }
                    </ul>
                    { data?.totalPages > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                            <span>Halaman { page } dari { data.totalPages }</span>
                            <Pagination page={ page } count={ data.totalPages } onChange={ (_, value) => navigate(value) } />
                        </div>
                    ) }
                </>
            ) }
        </div>
    );
}
