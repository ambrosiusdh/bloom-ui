import { useEffect, useState } from 'react';
import {
    Link,
    useLocation,
    useParams
} from 'react-router-dom';
import { Alert, Button, CircularProgress } from '@mui/material';
import { ArrowLeft } from 'lucide-react';

import StockAdjustmentInfoCard from '@components/stock-adjustment/StockAdjustmentInfoCard.jsx';
import StockAdjustmentLines from '@components/stock-adjustment/StockAdjustmentLines.jsx';
import {
    useBreadcrumbStore,
    useStockAdjustmentStore
} from '@stores/index.js';

export default function StockAdjustmentDetail() {
    const { code } = useParams();
    const location = useLocation();
    const decodedCode = code ? decodeURIComponent(code) : '';
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const adjustment = useStockAdjustmentStore(state => state.stockAdjustmentDetails);
    const status = useStockAdjustmentStore(state => state.stockAdjustmentDetailStatus);
    const error = useStockAdjustmentStore(state => state.stockAdjustmentDetailError);
    const load = useStockAdjustmentStore(state => state.getStockAdjustmentDetails);
    const clear = useStockAdjustmentStore(state => state.clearStockAdjustmentDetails);
    const [retry, setRetry] = useState(0);
    const backTo = typeof location.state?.from === 'string'
        && location.state.from.startsWith('/stock-adjustments')
        ? location.state.from
        : '/stock-adjustments';

    useEffect(() => {
        setBreadcrumbs([
            { to: '/stock-adjustments', label: 'Penyesuaian Stok' },
            decodedCode
        ]);
    }, [decodedCode, setBreadcrumbs]);

    useEffect(() => {
        if (!decodedCode) {
            return undefined;
        }
        const controller = new AbortController();
        load(decodedCode, { signal: controller.signal }, { useLoader: false }).catch(() => {});
        return () => {
            controller.abort();
            clear();
        };
    }, [clear, decodedCode, load, retry]);

    return (
        <div className="space-y-6 pb-8">
            <Button component={ Link } to={ backTo } startIcon={ <ArrowLeft /> }>
                Kembali ke daftar
            </Button>

            <header>
                <h1 className="break-all text-2xl font-bold">
                    { decodedCode || 'Detail penyesuaian stok' }
                </h1>
                <p className="mt-1 text-slate-600">
                    Hasil penyesuaian yang sudah dibukukan oleh server.
                </p>
            </header>

            { status === 'loading' || status === 'idle' ? (
                <div role="status" className="py-12 text-center">
                    <CircularProgress size={ 22 } /> Memuat detail penyesuaian...
                </div>
            ) : status === 'error' ? (
                <Alert
                    severity="error"
                    action={ (
                    <Button color="inherit" onClick={ () => setRetry(value => value + 1) }>Coba lagi</Button>
                ) }>
                    { error?.message || 'Detail penyesuaian gagal dimuat.' }
                </Alert>
            ) : adjustment ? (
                <>
                    <StockAdjustmentInfoCard adjustment={ adjustment } />
                    <StockAdjustmentLines items={ adjustment.items } />
                    <Button component={ Link } to="/stock-adjustments/new" variant="contained">
                        Buat penyesuaian baru
                    </Button>
                </>
            ) : (
                <Alert severity="info">Detail penyesuaian tidak tersedia.</Alert>
            ) }
        </div>
    );
}
