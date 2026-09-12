import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, CircularProgress } from '@mui/material';
import { ArrowLeft } from 'lucide-react';

import StockAdjustmentInfoCard from '@components/stock-adjustment/StockAdjustmentInfoCard.jsx';
import StockAdjustmentItemsTable from '@components/stock-adjustment/StockAdjustmentItemsTable.jsx';
import {
    useBreadcrumbStore,
    useStockAdjustmentStore
} from '@stores/index.js';

export default function StockAdjustmentDetail() {
    const { code } = useParams();
    const decodedCode = code ? decodeURIComponent(code) : '';
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const adjustment = useStockAdjustmentStore(state => state.stockAdjustmentDetails);
    const status = useStockAdjustmentStore(state => state.stockAdjustmentDetailStatus);
    const error = useStockAdjustmentStore(state => state.stockAdjustmentDetailError);
    const load = useStockAdjustmentStore(state => state.getStockAdjustmentDetails);
    const clear = useStockAdjustmentStore(state => state.clearStockAdjustmentDetails);
    const [retry, setRetry] = useState(0);

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
            <Button component={ Link } to="/stock-adjustments" startIcon={ <ArrowLeft /> }>
                Kembali ke daftar
            </Button>

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
                    <StockAdjustmentItemsTable items={ adjustment.items } />
                </>
            ) : (
                <Alert severity="info">Detail penyesuaian tidak tersedia.</Alert>
            ) }
        </div>
    );
}
