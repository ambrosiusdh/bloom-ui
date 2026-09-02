import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Button, Alert, CircularProgress } from '@mui/material';
import { Printer, ArrowLeft } from 'lucide-react';

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import SaleInfoCard from '@components/sale/SaleInfoCard';
import SaleItemsTable from '@components/sale/SaleItemsTable';
import { useSaleStore, useBreadcrumbStore } from '@stores/index.js';


const PRINT_STATUS = Object.freeze({
    IDLE: 'idle',
    PENDING: 'pending',
    SUCCESS: 'success',
    ERROR: 'error'
});

const getPrintErrorMessage = error => {
    if (error?.domainCode === API_DOMAIN_ERROR_CODE.PRINTER_NOT_FOUND) {
        return 'Printer yang dikonfigurasi pada server tidak ditemukan. Periksa printer lalu coba lagi.';
    }

    if (error?.domainCode === API_DOMAIN_ERROR_CODE.SALE_NOT_FOUND) {
        return 'Penjualan tidak ditemukan oleh server. Muat ulang detail penjualan sebelum mencoba lagi.';
    }

    if (error?.category === 'network') {
        return 'Status pencetakan tidak dapat dipastikan karena koneksi ke server terputus. Periksa printer sebelum mencoba lagi.';
    }

    return 'Struk gagal dicetak. Penjualan tidak diubah. Periksa printer lalu coba lagi.';
};

const SaleDetail = () => {
    const { code } = useParams();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const getSaleDetails = useSaleStore(state => state.getSaleDetails);
    const printReceipt = useSaleStore(state => state.printReceipt);
    const saleDetails = useSaleStore(state => state.saleDetails);
    const detailStatus = useSaleStore(state => state.saleDetailStatus);
    const detailError = useSaleStore(state => state.saleDetailError);
    const location = useLocation();

    const [retryVersion, setRetryVersion] = useState(0);
    const [printState, setPrintState] = useState({
        status: PRINT_STATUS.IDLE,
        message: ''
    });
    const printInFlightRef = useRef(false);
    const printAttemptRef = useRef(0);
    const printFeedbackRef = useRef(null);
    const saleReference = code || '';
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
        if (printState.status === PRINT_STATUS.SUCCESS || printState.status === PRINT_STATUS.ERROR) {
            printFeedbackRef.current?.focus();
        }
    }, [printState.status]);

    useEffect(() => {
        printAttemptRef.current += 1;
        printInFlightRef.current = false;
        setPrintState({
            status: PRINT_STATUS.IDLE,
            message: ''
        });

        return () => {
            printAttemptRef.current += 1;
            printInFlightRef.current = false;
        };
    }, [saleReference]);

    const handlePrint = async () => {
        if (!saleReference || printInFlightRef.current) return;

        const attempt = ++printAttemptRef.current;
        printInFlightRef.current = true;
        setPrintState({
            status: PRINT_STATUS.PENDING,
            message: 'Permintaan cetak sedang diproses oleh server.'
        });

        try {
            await printReceipt(saleReference);
            if (attempt !== printAttemptRef.current) return;

            setPrintState({
                status: PRINT_STATUS.SUCCESS,
                message: 'Struk berhasil dicetak.'
            });
        } catch (printError) {
            if (attempt !== printAttemptRef.current) return;

            setPrintState({
                status: PRINT_STATUS.ERROR,
                message: getPrintErrorMessage(printError)
            });
        } finally {
            if (attempt === printAttemptRef.current) {
                printInFlightRef.current = false;
            }
        }
    };

    const isPrinting = printState.status === PRINT_STATUS.PENDING;
    const isSaleReady = saleDetails?.code === saleReference;

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
                <Button
                    variant="contained"
                    startIcon={ <Printer /> }
                    onClick={ handlePrint }
                    disabled={ isPrinting || !isSaleReady }
                    aria-busy={ isPrinting }
                    aria-describedby={ printState.status === PRINT_STATUS.IDLE ? undefined : 'receipt-print-status' }
                >
                    { isPrinting ? 'Mencetak...' : 'Cetak ulang struk' }
                </Button>
            </div>

            { printState.status !== PRINT_STATUS.IDLE && (
                <Alert
                    id="receipt-print-status"
                    ref={ printFeedbackRef }
                    severity={ printState.status === PRINT_STATUS.ERROR ? 'error' : printState.status === PRINT_STATUS.SUCCESS ? 'success' : 'info' }
                    role={ printState.status === PRINT_STATUS.ERROR ? 'alert' : 'status' }
                    tabIndex={ -1 }
                    action={ printState.status === PRINT_STATUS.ERROR ? (
                        <Button color="inherit" size="small" onClick={ handlePrint }>
                            Coba lagi
                        </Button>
                    ) : undefined }
                >
                    <strong>Penjualan { saleReference }.</strong> { printState.message }
                </Alert>
            ) }

            <SaleInfoCard sale={ saleDetails } />

            <SaleItemsTable items={ saleDetails?.saleItems } />
        </div>
    );
};

export default SaleDetail;
