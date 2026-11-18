import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Button, Alert, CircularProgress, TextField } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import PropTypes from 'prop-types';

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import BloomConfirmationModal from '@components/_ui/BloomConfirmationModal.jsx';
import GoodsReceiptInfoCard from '@components/goods-receipt/GoodsReceiptInfoCard.jsx';
import GoodsReceiptItemsTable from '@components/goods-receipt/GoodsReceiptItemsTable.jsx';
import SupplierPayment from '@components/goods-receipt/SupplierPayment.jsx';
import SupplierPaymentHistory from '@components/goods-receipt/SupplierPaymentHistory.jsx';
import { useAuthStore, useGoodsReceiptStore, useBreadcrumbStore } from '@stores/index.js';
import useSupplierPaymentStore from '@stores/modules/supplier-payment.js';
import { isValidGoodsReceiptReference } from '@utils/goods-receipt-utils.js';

const CANCELLATION_REJECTIONS = {
    [API_DOMAIN_ERROR_CODE.GOODS_RECEIPT_HAS_PAYMENTS]:
        'Penerimaan ini sudah memiliki riwayat pembayaran. Muat ulang detail untuk memeriksa statusnya.',
    [API_DOMAIN_ERROR_CODE.GOODS_RECEIPT_INSUFFICIENT_STOCK]:
        'Stok di lokasi penerimaan semula tidak cukup untuk membalikkan jumlah yang diterima. Periksa saldo stok di lokasi tersebut.',
    400: 'Periksa alasan pembatalan dan nomor penerimaan, lalu coba lagi.',
    401: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    403: 'Anda tidak memiliki izin untuk membatalkan penerimaan ini.',
    404: 'Penerimaan ini tidak ditemukan. Muat ulang detail untuk memeriksa datanya.',
    409: 'Penerimaan tidak dapat dibatalkan dalam kondisi saat ini. Muat ulang detail untuk memeriksa statusnya.',
    422: 'Periksa alasan pembatalan, lalu coba lagi.'
};

const ReceiptDetail = ({ receiptReference }) => {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const isAuthenticated = useAuthStore(state => state.authStatus === 'authenticated');
    const getGoodsReceiptDetails = useGoodsReceiptStore(state => state.getGoodsReceiptDetails);
    const cancelGoodsReceipt = useGoodsReceiptStore(state => state.cancelGoodsReceipt);
    const goodsReceiptDetails = useGoodsReceiptStore(state => state.goodsReceiptDetails);
    const detailStatus = useGoodsReceiptStore(state => state.goodsReceiptDetailStatus);
    const detailError = useGoodsReceiptStore(state => state.goodsReceiptDetailError);
    const clearGoodsReceiptDetails = useGoodsReceiptStore(state => state.clearGoodsReceiptDetails);
    const paymentResult = useSupplierPaymentStore(state => state.result);
    const paymentRefreshStatus = useSupplierPaymentStore(state => state.refreshStatus);
    const paymentInProgress = useSupplierPaymentStore(state => state.code === receiptReference
        && Boolean(state.pending || state.checkingCashSession || state.attempt));
    const location = useLocation();
    const [retryVersion, setRetryVersion] = useState(0);
    const [showCancellation, setShowCancellation] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    const [reasonInvalid, setReasonInvalid] = useState(false);
    const [rejection, setRejection] = useState('');
    const [cancellationStatus, setCancellationStatus] = useState('idle');
    const submittingRef = useRef(false);
    const reasonRef = useRef(null);
    const cancellationNoticeRef = useRef(null);
    const isValidReference = isValidGoodsReceiptReference(receiptReference);
    const isCurrentReceipt = goodsReceiptDetails?.code === receiptReference;
    const isCancelled = goodsReceiptDetails?.status === 'CANCELLED';
    const cancellationPending = cancellationStatus === 'pending';
    const cancellationUnchecked = ['unknown', 'checking'].includes(cancellationStatus);
    const canCancel = isAuthenticated && goodsReceiptDetails?.canCancel === true
        && goodsReceiptDetails.status === 'POSTED' && !cancellationUnchecked;
    const backTo = typeof location.state?.from === 'string'
        && (location.state.from.startsWith('/goods-receipts')
            || location.state.from.startsWith('/payables'))
        ? location.state.from
        : '/goods-receipts';
    const payableContext = backTo.startsWith('/payables');
    const detailTitle = payableContext ? 'Detail utang penerimaan' : 'Detail penerimaan';
    const paymentHistoryRefreshKey = paymentResult?.receiptCode === receiptReference
        && paymentRefreshStatus === 'ready'
        ? paymentResult.id
        : null;

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
                    {
                        to: payableContext ? '/payables' : '/goods-receipts',
                        label: payableContext ? 'Utang Pemasok' : 'Penerimaan Barang'
                    },
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
                if (!controller.signal.aborted) {
                    setCancellationStatus(status => status === 'checking' ? 'checked' : status);
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
        setBreadcrumbs, getGoodsReceiptDetails, payableContext, retryVersion]);

    useEffect(() => {
        cancellationNoticeRef.current?.focus();
    }, [cancellationStatus]);

    const closeCancellation = () => {
        if (submittingRef.current) return;

        setShowCancellation(false);
        setReasonInvalid(false);
        setRejection('');
    };

    const submitCancellation = async () => {
        if (submittingRef.current || !canCancel || paymentInProgress) return;

        const reason = cancellationReason.trim();
        if (!reason) {
            setReasonInvalid(true);
            reasonRef.current?.focus();
            return;
        }

        submittingRef.current = true;
        setRejection('');
        setCancellationStatus('pending');

        try {
            await cancelGoodsReceipt(receiptReference, reason);
            setShowCancellation(false);
            setCancellationStatus('saved');
        } catch (error) {
            const message = CANCELLATION_REJECTIONS[error?.domainCode]
                || CANCELLATION_REJECTIONS[error?.status];

            if (message) {
                setRejection(message);
                setCancellationStatus('idle');
            } else {
                setShowCancellation(false);
                setCancellationStatus('unknown');
            }
        } finally {
            submittingRef.current = false;
        }
    };

    const checkCancellation = () => {
        setCancellationStatus('checking');
        setRetryVersion(value => value + 1);
    };

    if (!isValidReference) {
        return (
            <div className="space-y-4 pb-8">
                <h1 className="text-2xl font-bold">{ detailTitle }</h1>
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
            <div className="space-y-4 pb-8">
                <h1 className="text-2xl font-bold">{ detailTitle }</h1>
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
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{ detailTitle }</h1>
                    <p className="mt-1 break-all text-gray-600">{ receiptReference }</p>
                </div>
                <Button
                    component={ Link }
                    to={ backTo }
                    startIcon={ <ArrowLeft /> }
                    className="self-start print:hidden"
                >
                    Kembali ke daftar
                </Button>
            </header>

            { cancellationStatus === 'unknown' && (
                <Alert
                    severity="warning"
                    ref={ cancellationNoticeRef }
                    tabIndex={ -1 }
                    action={
                        <Button color="inherit" onClick={ checkCancellation }>Muat ulang detail</Button>
                    }
                >
                    Hasil pembatalan belum dapat dipastikan. Muat ulang detail dan periksa status yang
                    tercatat sebelum mencoba pembatalan lagi.
                </Alert>
            ) }

            { ['saved', 'checked'].includes(cancellationStatus) && (
                <Alert
                    severity={ isCancelled ? 'success' : 'info' }
                    ref={ cancellationNoticeRef }
                    tabIndex={ -1 }
                    role="status"
                >
                    { isCancelled
                        ? 'Pembatalan penerimaan tercatat.'
                        : 'Status penerimaan telah dimuat ulang. Periksa status yang tercatat di bawah ini.' }
                </Alert>
            ) }

            <GoodsReceiptInfoCard receipt={ goodsReceiptDetails } />

            { canCancel && (
                <Button
                    type="button"
                    variant="outlined"
                    color="error"
                    className="print:hidden"
                    disabled={ paymentInProgress || cancellationPending }
                    onClick={ () => setShowCancellation(true) }
                >
                    Batalkan penerimaan
                </Button>
            ) }

            { showCancellation && (
                <BloomConfirmationModal
                    title="Batalkan penerimaan ini?"
                    confirmButtonText={ cancellationPending ? 'Membatalkan...' : 'Batalkan penerimaan' }
                    confirmButtonColor="error"
                    onConfirm={ submitCancellation }
                    onCancel={ closeCancellation }
                    isPending={ cancellationPending }
                    focusCancel
                >
                    <div className="space-y-3">
                        <p>Nomor penerimaan <strong className="break-all">{ receiptReference }</strong></p>
                        <p>
                            Pembatalan mengurangi stok sesuai jumlah yang diterima di masing-masing lokasi awal
                            dan mengeluarkan penerimaan ini dari saldo utang pemasok. Riwayat penerimaan tetap tersimpan.
                        </p>
                        <TextField
                            id="receipt-cancellation-reason"
                            inputRef={ reasonRef }
                            label="Alasan pembatalan"
                            required
                            fullWidth
                            multiline
                            minRows={ 2 }
                            disabled={ cancellationPending }
                            value={ cancellationReason }
                            error={ reasonInvalid }
                            helperText={ reasonInvalid ? 'Masukkan alasan pembatalan.' : undefined }
                            onChange={ event => {
                                setCancellationReason(event.target.value);
                                setReasonInvalid(false);
                            } }
                        />
                        { rejection && (
                            <Alert
                                severity="error"
                                action={
                                    <Button
                                        color="inherit"
                                        onClick={ () => {
                                            closeCancellation();
                                            setRetryVersion(value => value + 1);
                                        } }
                                    >
                                        Muat ulang detail
                                    </Button>
                                }
                            >
                                Pembatalan ditolak. { rejection }
                            </Alert>
                        ) }
                        { cancellationPending && <p role="status">Menyimpan pembatalan penerimaan...</p> }
                    </div>
                </BloomConfirmationModal>
            ) }

            { isCancelled && (
                <Button
                    component={ Link }
                    variant="outlined"
                    to={ `/stock-movements?${ new URLSearchParams({
                        sourceType: 'GOODS_RECEIPT_CANCELLATION',
                        reference: receiptReference
                    }) }` }
                >
                    Lihat pergerakan stok pembatalan
                </Button>
            ) }

            <GoodsReceiptItemsTable goodsReceiptItems={ goodsReceiptDetails?.items || [] } />

            <SupplierPaymentHistory
                receiptCode={ receiptReference }
                refreshKey={ paymentHistoryRefreshKey }
            />

            { !isCancelled && !cancellationUnchecked && (
                <section className="space-y-3 print:hidden" aria-labelledby="goods-receipt-payment-heading">
                    <div>
                        <h2 id="goods-receipt-payment-heading" className="text-xl font-bold">
                            Pembayaran pemasok
                        </h2>
                        <p className="mt-1 text-gray-600">
                            Pembayaran adalah tugas terpisah setelah isi penerimaan selesai diperiksa.
                        </p>
                    </div>
                    <SupplierPayment receipt={ goodsReceiptDetails } />
                </section>
            ) }
        </div>
    );
};

ReceiptDetail.propTypes = {
    receiptReference: PropTypes.string.isRequired
};

export default function GoodsReceiptDetail() {
    const { code = '' } = useParams();

    return <ReceiptDetail key={ code } receiptReference={ code } />;
}
