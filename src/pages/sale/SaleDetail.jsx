import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Alert, Button, CircularProgress, Typography } from '@mui/material';
import { Printer, ArrowLeft } from 'lucide-react';

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import SaleInfoCard from '@components/sale/SaleInfoCard';
import SaleItemsTable from '@components/sale/SaleItemsTable';
import { useSaleStore, useBreadcrumbStore } from '@stores/index.js';
import {
    EMPTY_RECEIPT_PRINT_STATE,
    getReceiptPrintMessage,
    RECEIPT_PRINT_STATUS
} from '@utils/receipt-print.js';

const SaleDetail = () => {
    const { code } = useParams();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const getSaleDetails = useSaleStore(state => state.getSaleDetails);
    const printReceipt = useSaleStore(state => state.printReceipt);
    const receiptPrintStateBySale = useSaleStore(state => state.receiptPrintStateBySale);
    const saleDetails = useSaleStore(state => state.saleDetails);
    const detailStatus = useSaleStore(state => state.saleDetailStatus);
    const detailError = useSaleStore(state => state.saleDetailError);
    const location = useLocation();

    const [retryVersion, setRetryVersion] = useState(0);
    const printFeedbackRef = useRef(null);
    const saleReference = code || '';
    const printState = receiptPrintStateBySale[saleReference] || EMPTY_RECEIPT_PRINT_STATE;
    const printMessage = getReceiptPrintMessage(printState);
    const backTo = typeof location.state?.from === 'string'
        && location.state.from.startsWith('/sales') ? location.state.from : '/sales';

    useEffect(() => {
        const controller = new AbortController();

        const fetchDetails = async () => {
            if (!saleReference) return;

            try {
                setBreadcrumbs([{ to: '/sales', label: 'Riwayat Penjualan' }, saleReference]);
                await getSaleDetails(
                    saleReference,
                    { signal: controller.signal },
                    { useLoader: false }
                );
            } catch {
                // The store owns the normalized error state; aborted requests are ignored there.
            }
        };

        fetchDetails();

        return () => controller.abort();
    }, [saleReference, setBreadcrumbs, getSaleDetails, retryVersion]);

    useEffect(() => {
        if (printState.status === RECEIPT_PRINT_STATUS.SUCCESS
            || printState.status === RECEIPT_PRINT_STATUS.ERROR) {
            printFeedbackRef.current?.focus();
        }
    }, [printState.status]);

    const handlePrint = () => {
        if (!saleReference) return;
        printReceipt(saleReference).catch(() => undefined);
    };

    const isPrinting = printState.status === RECEIPT_PRINT_STATUS.PENDING;
    const isSaleReady = saleDetails?.code === saleReference;
    const printStatusTitle = printState.status === RECEIPT_PRINT_STATUS.PENDING
        ? 'Mengirim permintaan cetak terakhir'
        : printState.status === RECEIPT_PRINT_STATUS.SUCCESS
            ? 'Permintaan cetak terakhir diterima'
            : 'Permintaan cetak terakhir gagal';

    if (detailStatus === 'loading' || detailStatus === 'idle') {
        return (
            <div className="py-16 text-center" role="status" aria-live="polite">
                <CircularProgress size={ 24 } aria-hidden="true" /> <span>Memuat detail penjualan...</span>
            </div>
        );
    }

    if (detailStatus === 'error') {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold">Detail penjualan</h1>
                <Alert severity="error"
                    action={ (
                    <Button color="inherit" onClick={ () => setRetryVersion(value => value + 1) }>Coba lagi</Button>
                ) }>{ detailError?.message || 'Gagal memuat detail penjualan.' }</Alert>
                <Button component={ Link } to={ backTo } startIcon={ <ArrowLeft /> }>Kembali ke daftar</Button>
            </div>
        );
    }

    return (
        <div className="sale-detail space-y-6 pb-8">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
                <div>
                    <Typography component="h1" variant="h4" className="font-bold">
                        Detail penjualan
                    </Typography>
                    <p className="mt-1 text-gray-600 break-all">{ saleReference }</p>
                </div>
                <Button
                    component={ Link }
                    to={ backTo }
                    startIcon={ <ArrowLeft /> }
                    variant="text"
                    color="inherit"
                >
                    Kembali ke daftar
                </Button>
            </header>

            <SaleInfoCard sale={ saleDetails } />

            <SaleItemsTable items={ saleDetails?.saleItems } />

            <section className="card space-y-4 print:hidden" aria-labelledby="sale-reprint-heading">
                <div>
                    <Typography
                        id="sale-reprint-heading"
                        component="h2"
                        variant="h5"
                        className="font-bold"
                    >
                        Pencetakan ulang
                    </Typography>
                    <p className="mt-1 text-gray-600">
                        Pencetakan hanya mengirim referensi penjualan ini ke layanan cetak.
                        Penjualan tidak dibuat atau dikirim ulang.
                    </p>
                </div>

                { printState.status !== RECEIPT_PRINT_STATUS.IDLE && (
                    <Alert
                        id="receipt-print-status"
                        ref={ printFeedbackRef }
                        severity={ printState.status === RECEIPT_PRINT_STATUS.ERROR
                            ? 'error'
                            : printState.status === RECEIPT_PRINT_STATUS.SUCCESS
                                ? 'success'
                                : 'info' }
                        role={ printState.status === RECEIPT_PRINT_STATUS.ERROR
                            ? 'alert'
                            : 'status' }
                        tabIndex={ -1 }
                        action={ printState.status === RECEIPT_PRINT_STATUS.ERROR ? (
                            <Button color="inherit" size="small" onClick={ handlePrint }>
                                Coba lagi
                            </Button>
                        ) : undefined }
                    >
                        <strong>{ printStatusTitle }.</strong>{ ' ' }
                        Penjualan { saleReference } tetap tercatat. { printMessage }
                        { printState.error?.domainCode === API_DOMAIN_ERROR_CODE.SALE_NOT_FOUND && (
                            <> Muat ulang halaman sebelum mencoba lagi.</>
                        ) }
                    </Alert>
                ) }

                <Button
                    variant="contained"
                    startIcon={ <Printer /> }
                    onClick={ handlePrint }
                    disabled={ isPrinting || !isSaleReady }
                    aria-busy={ isPrinting }
                    aria-describedby={ printState.status === RECEIPT_PRINT_STATUS.IDLE
                        ? undefined
                        : 'receipt-print-status' }
                >
                    { isPrinting ? 'Mengirim ke layanan cetak...' : 'Cetak ulang struk' }
                </Button>
            </section>
        </div>
    );
};

export default SaleDetail;
