import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Alert } from '@mui/material';
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

    const [error, setError] = useState(null);
    const printFeedbackRef = useRef(null);
    const saleReference = code || '';
    const printState = receiptPrintStateBySale[saleReference] || EMPTY_RECEIPT_PRINT_STATE;
    const printMessage = getReceiptPrintMessage(printState);

    useEffect(() => {
        const controller = new AbortController();

        const fetchDetails = async () => {
            if (!saleReference) return;

            setError(null);
            try {
                setBreadcrumbs([{ to: '/sales', label: 'Riwayat Penjualan' }, saleReference]);
                await getSaleDetails(
                    saleReference,
                    { signal: controller.signal },
                    { useLoader: true }
                );
            } catch (err) {
                if (controller.signal.aborted) return;
                setError(err.message || 'Gagal memuat detail penjualan');
            }
        };

        fetchDetails();

        return () => controller.abort();
    }, [saleReference, setBreadcrumbs, getSaleDetails]);

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

    if (error) {
        return (
            <div className="p-4">
                <Alert severity="error">{ error }</Alert>
                <Button
                    component={ Link }
                    to="/sales"
                    startIcon={ <ArrowLeft /> }
                    className="mt-4"
                >
                    Kembali ke Daftar
                </Button>
            </div>
        );
    }

    return (
        <div className="sale-detail space-y-6 pb-8">
            <div className="flex justify-between items-center print:hidden">
                <Button
                    component={ Link }
                    to="/sales"
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
                    aria-describedby={ printState.status === RECEIPT_PRINT_STATUS.IDLE ? undefined : 'receipt-print-status' }
                >
                    { isPrinting ? 'Mencetak...' : 'Cetak ulang struk' }
                </Button>
            </div>

            { printState.status !== RECEIPT_PRINT_STATUS.IDLE && (
                <Alert
                    id="receipt-print-status"
                    ref={ printFeedbackRef }
                    severity={ printState.status === RECEIPT_PRINT_STATUS.ERROR ? 'error' : printState.status === RECEIPT_PRINT_STATUS.SUCCESS ? 'success' : 'info' }
                    role={ printState.status === RECEIPT_PRINT_STATUS.ERROR ? 'alert' : 'status' }
                    tabIndex={ -1 }
                    action={ printState.status === RECEIPT_PRINT_STATUS.ERROR ? (
                        <Button color="inherit" size="small" onClick={ handlePrint }>
                            Coba lagi
                        </Button>
                    ) : undefined }
                >
                    <strong>Penjualan { saleReference }.</strong> { printMessage }
                    { printState.error?.domainCode === API_DOMAIN_ERROR_CODE.SALE_NOT_FOUND && (
                        <> Muat ulang halaman sebelum mencoba lagi.</>
                    ) }
                </Alert>
            ) }

            <SaleInfoCard sale={ saleDetails } />

            <SaleItemsTable items={ saleDetails?.saleItems } />
        </div>
    );
};

export default SaleDetail;
