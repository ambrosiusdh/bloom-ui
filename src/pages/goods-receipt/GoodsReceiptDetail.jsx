import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Button, Alert, CircularProgress } from '@mui/material';
import { ArrowLeft } from 'lucide-react';

import GoodsReceiptInfoCard from '@components/goods-receipt/GoodsReceiptInfoCard.jsx';
import GoodsReceiptItemsTable from '@components/goods-receipt/GoodsReceiptItemsTable.jsx';
import SupplierPayment from '@components/goods-receipt/SupplierPayment.jsx';
import { useGoodsReceiptStore, useBreadcrumbStore } from '@stores/index.js';
import useSupplierPaymentStore from '@stores/modules/supplier-payment.js';
import { isValidGoodsReceiptReference } from '@utils/goods-receipt-utils.js';

const GoodsReceiptDetail = () => {
    const { code } = useParams();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const getGoodsReceiptDetails = useGoodsReceiptStore(state => state.getGoodsReceiptDetails);
    const goodsReceiptDetails = useGoodsReceiptStore(state => state.goodsReceiptDetails);
    const detailStatus = useGoodsReceiptStore(state => state.goodsReceiptDetailStatus);
    const detailError = useGoodsReceiptStore(state => state.goodsReceiptDetailError);
    const clearGoodsReceiptDetails = useGoodsReceiptStore(state => state.clearGoodsReceiptDetails);
    const location = useLocation();
    const [retryVersion, setRetryVersion] = useState(0);
    const receiptReference = code || '';
    const isValidReference = isValidGoodsReceiptReference(receiptReference);
    const isCurrentReceipt = goodsReceiptDetails?.code === receiptReference;
    const backTo = typeof location.state?.from === 'string'
        && (location.state.from.startsWith('/goods-receipts')
            || location.state.from.startsWith('/payables'))
        ? location.state.from
        : '/goods-receipts';

    useEffect(() => {
        if (!isValidReference) {
            clearGoodsReceiptDetails();
            return undefined;
        }

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
                // A detail read started during posting may have returned the earlier balance.
                if (!controller.signal.aborted && useSupplierPaymentStore.getState().result?.receiptCode === receiptReference) {
                    await useSupplierPaymentStore.getState().refresh();
                }
            } catch {
                // The store owns the request error. Aborted requests are ignored there.
            }
        };

        fetchDetails();

        return () => {
            controller.abort();
            clearGoodsReceiptDetails();
        };
    }, [clearGoodsReceiptDetails, isValidReference, receiptReference,
        setBreadcrumbs, getGoodsReceiptDetails, retryVersion]);

    if (!isValidReference) {
        return (
            <div className="space-y-4">
                <Alert severity="error">Nomor penerimaan barang tidak valid.</Alert>
                <Button component={ Link } to={ backTo } startIcon={ <ArrowLeft /> }>Kembali ke daftar</Button>
            </div>
        );
    }

    if (detailStatus === 'loading' || detailStatus === 'idle'
        || (detailStatus === 'ready' && !isCurrentReceipt)) {
        return (
            <div className="py-16 text-center" role="status" aria-live="polite">
                <CircularProgress size={ 24 } aria-hidden="true" /> <span>Memuat detail penerimaan barang...</span>
            </div>
        );
    }

    if (detailStatus === 'error' || !isCurrentReceipt) {
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

            <SupplierPayment key={ receiptReference } receipt={ goodsReceiptDetails } />

            <GoodsReceiptItemsTable goodsReceiptItems={ goodsReceiptDetails?.items || [] } />
        </div>
    );
};

export default GoodsReceiptDetail;
