import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Alert, Button, CircularProgress, Paper } from '@mui/material';

import api from '@api/stock-transfer.js';
import { formatCashSessionDate } from '@components/cash-session/cash-session-date.js';
import StockTransferFacts from '@components/stock-transfer/StockTransferFacts.jsx';
import { useBreadcrumbStore } from '@stores/index.js';
import { formatQuantity } from '@utils/quantity-utils.js';
import { TRANSFER_LOCATIONS } from '@utils/stock-transfer-utils.js';

export default function StockTransferDetail() {
    const { code } = useParams();
    const location = useLocation();
    const [transfer, setTransfer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    const errorRef = useRef(null);
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const from = location.state?.from;
    const backTo = typeof from === 'string' && (from === '/stock-transfers' || from.startsWith('/stock-transfers?'))
        ? from : '/stock-transfers';

    useEffect(() => setBreadcrumbs([
        {
            to: '/stock-transfers',
            label: 'Riwayat Transfer Stok'
        },
        code
    ]), [code, setBreadcrumbs]);

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError('');
        setTransfer(null);
        api.getStockTransferDetails(code, { signal: controller.signal }, { useLoader: false }).then(response => {
            if (!controller.signal.aborted) {
                setTransfer(response.data?.data || null);
            }
        }).catch(requestError => {
            if (!controller.signal.aborted) {
                setError(requestError?.message || 'Detail transfer gagal dimuat.');
            }
        }).finally(() => {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        });

        return () => controller.abort();
    }, [code, retry]);

    useEffect(() => {
        if (error && !loading) {
            errorRef.current?.focus();
        }
    }, [error, loading]);

    return (
        <div className="max-w-5xl space-y-4 pb-8">
            <Button component={ Link } to={ backTo }>Kembali ke riwayat transfer</Button>
            <h1 className="break-all text-2xl font-bold">Transfer { code }</h1>
            { loading ? (
                <div role="status"><CircularProgress size={ 20 } /> Memuat detail transfer...</div>
            ) : error ? (
                <Alert severity="error" ref={ errorRef } tabIndex={ -1 } action={ <Button color="inherit" onClick={ () => setRetry(value => value + 1) }>Coba lagi</Button> }>{ error }</Alert>
            ) : transfer ? (
                <>
                    <Paper component="section" aria-label="Detail transfer tersimpan" className="p-4 md:p-5">
                        <StockTransferFacts transfer={ transfer } />
                    </Paper>
                    <Paper component="section" aria-label="Pergerakan transfer" className="space-y-3 p-4 md:p-5">
                        <h2 className="text-lg font-semibold">Pergerakan terkait</h2>
                        { !transfer.movements?.length ? (
                            <Alert severity="info">Pergerakan terkait tidak tersedia pada respons ini. Catatan transfer tetap ditampilkan.</Alert>
                        ) : (
                            <ul className="space-y-3">
                                { transfer.movements.map(movement => (
                                    <li key={ movement.id } className="rounded-lg border p-3">
                                        <strong className="block break-words">{ movement.item?.name || movement.item?.sku || '-' } · { movement.item?.sku || '-' }</strong>
                                        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                                            <div><dt>Arah</dt><dd>{ movement.movementType === 'OUT' ? 'Keluar (OUT)' : movement.movementType === 'IN' ? 'Masuk (IN)' : movement.movementType }</dd></div>
                                            <div><dt>Lokasi</dt><dd>{ TRANSFER_LOCATIONS[movement.location] || movement.location }</dd></div>
                                            <div><dt>Jumlah</dt><dd>{ formatQuantity(movement.quantity, movement.item?.baseUnitOfMeasure) }</dd></div>
                                            <div><dt>Saldo sebelum → sesudah</dt><dd>{ formatQuantity(movement.qtyBefore, movement.item?.baseUnitOfMeasure) } → { formatQuantity(movement.qtyAfter, movement.item?.baseUnitOfMeasure) }</dd></div>
                                            <div className="min-w-0"><dt>Referensi</dt><dd className="break-all">{ movement.referenceNo || '-' }</dd></div>
                                            <div className="min-w-0"><dt>Dicatat oleh / waktu</dt><dd className="break-words">{ movement.createdBy || '-' } · { formatCashSessionDate(movement.createdAt) }</dd></div>
                                        </dl>
                                    </li>
                                )) }
                            </ul>
                        ) }
                        <Button component={ Link } to="/stock-movements">Buka pergerakan stok</Button>
                    </Paper>
                </>
            ) : <Alert severity="info">Detail transfer tidak tersedia.</Alert> }
        </div>
    );
}
