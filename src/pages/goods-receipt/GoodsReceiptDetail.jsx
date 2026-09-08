import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Button, Alert, CircularProgress } from '@mui/material';
import { ArrowLeft } from 'lucide-react';

import GoodsReceiptInfoCard from '@components/goods-receipt/GoodsReceiptInfoCard.jsx';
import GoodsReceiptItemsTable from '@components/goods-receipt/GoodsReceiptItemsTable.jsx';
import { useGoodsReceiptStore, useBreadcrumbStore } from '@stores/index.js';

const GoodsReceiptDetail = () => {
    const { code } = useParams();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const getGoodsReceiptDetails = useGoodsReceiptStore(state => state.getGoodsReceiptDetails);
    const goodsReceiptDetails = useGoodsReceiptStore(state => state.goodsReceiptDetails);
    const detailStatus = useGoodsReceiptStore(state => state.goodsReceiptDetailStatus);
    const detailError = useGoodsReceiptStore(state => state.goodsReceiptDetailError);
    const location = useLocation();
    const [retryVersion, setRetryVersion] = useState(0);
    const receiptReference = code || '';
    const backTo = typeof location.state?.from === 'string'
        && location.state.from.startsWith('/goods-receipts')
        ? location.state.from
        : '/goods-receipts';

    useEffect(() => {
        const controller = new AbortController();

        const fetchDetails = async () => {
            if (!receiptReference) return;

            try {
                setBreadcrumbs([
                    { to: '/goods-receipts', label: 'Penerimaan Barang' },
                    receiptReference
                ]);
                await getGoodsReceiptDetails(
                    receiptReference,
                    { signal: controller.signal },
                    { useLoader: false }
                );
            } catch {
                // The store owns the request error. Aborted requests are ignored there.
            }
        };

        fetchDetails();

        return () => controller.abort();
    }, [receiptReference, setBreadcrumbs, getGoodsReceiptDetails, retryVersion]);

    if (detailStatus === 'loading' || detailStatus === 'idle') {
        return (
            <div className="py-16 text-center" role="status" aria-live="polite">
                <CircularProgress size={ 24 } aria-hidden="true" /> <span>Memuat detail penerimaan barang...</span>
            </div>
        );
    }

    if (detailStatus === 'error') {
        return (
            <div className="space-y-4">
                <Alert
                    severity="error"
                    action={ (
                    <Button color="inherit" onClick={ () => setRetryVersion(value => value + 1) }>Coba lagi</Button>
                    ) }
                >{ detailError?.message || 'Gagal memuat detail penerimaan barang.' }</Alert>
                <Button
                    component={ Link }
                    to={ backTo }
                    startIcon={ <ArrowLeft /> }
                >
                    Kembali ke daftar
                </Button>
            </div>
        );
    }

    return (
        <div className="goods-receipt-detail space-y-6 pb-8">
            <div className="flex justify-between items-center print:hidden">
                <Button
                    component={ Link }
                    to={ backTo }
                    startIcon={ <ArrowLeft /> }
                    variant="text"
                    color="inherit"
                >
                    Kembali
                </Button>
            </div>

            <GoodsReceiptInfoCard receipt={ goodsReceiptDetails } />

            <GoodsReceiptItemsTable goodsReceiptItems={ goodsReceiptDetails?.items || [] } />
        </div>
    );
};

export default GoodsReceiptDetail;
