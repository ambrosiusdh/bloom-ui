import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Alert,
    Button,
    CircularProgress,
    Paper,
    TextField,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import { Printer } from 'lucide-react';
import PropTypes from 'prop-types';

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import { API_ERROR_CATEGORY } from '@api/index.js';
import BloomMoneyField from '@components/_ui/BloomMoneyField.jsx';
import {
    formatRupiah,
    getMoneySign
} from '@components/cash-session/cash-session-money.js';
import {
    useAuthStore,
    useCashSessionStore,
    useSaleStore
} from '@stores/index.js';
import { formatQuantity } from '@utils/quantity-utils.js';
import {
    EMPTY_RECEIPT_PRINT_STATE,
    getReceiptPrintMessage,
    RECEIPT_PRINT_STATUS
} from '@utils/receipt-print.js';

import CashierPurchaseConfirmationModal from './CashierPurchaseConfirmationModal.jsx';
import {
    clearSaleCheckoutRecovery,
    createSaleIdempotencyKey,
    createSaleRequest,
    getAdvisoryCashChange,
    getAdvisoryCashShortcuts,
    getAdvisorySaleEstimate,
    getSaleRequestSignature,
    PAYMENT_TYPES,
    persistSaleCheckoutAttempt,
    readSaleCheckoutRecovery,
    validateDiscountAmount,
    validatePaidAmount
} from './sale-checkout.js';

const LOCKED_PHASES = new Set([
    'confirmation',
    'submitting',
    'checking',
    'unknown',
    'quarantined'
]);
const PAYMENT_LABELS = {
    CASH: 'Tunai (CASH)',
    QRIS: 'QRIS'
};

const isAmbiguousFailure = error => error?.category === API_ERROR_CATEGORY.NETWORK
    || error?.status >= 500
    || (error?.status == null && error?.category === API_ERROR_CATEGORY.UNEXPECTED);

const backendFieldTargetsPaidAmount = field => field === 'paidAmount';
const backendFieldTargetsCart = field => field === 'saleItemList'
    || field?.startsWith('saleItemList[');

export default function CashierCheckout({
    itemList,
    disabled = false,
    disabledMessage = '',
    onLockChange,
    onSaleCompleted
}) {
    const createSale = useSaleStore(state => state.createSale);
    const getCheckoutStatus = useSaleStore(state => state.getCheckoutStatus);
    const printReceipt = useSaleStore(state => state.printReceipt);
    const receiptPrintStateBySale = useSaleStore(state => state.receiptPrintStateBySale);
    const getCurrentSession = useCashSessionStore(state => state.getCurrentSession);
    const ownerAccountId = useAuthStore(state => state.authStatus === 'authenticated'
        ? state.currentUser?.accountId || null
        : null);

    const initialRecoveryRef = useRef(null);
    if (initialRecoveryRef.current === null) {
        initialRecoveryRef.current = readSaleCheckoutRecovery(ownerAccountId);
    }
    const initialRecovery = initialRecoveryRef.current;
    const recoveredAttempt = initialRecovery.status === 'available'
        ? initialRecovery.attempt
        : null;
    const recoveredRequest = recoveredAttempt?.request;

    const [paymentType, setPaymentType] = useState(
        recoveredRequest?.paymentType || PAYMENT_TYPES.CASH
    );
    const [paidAmount, setPaidAmount] = useState(recoveredRequest?.paidAmount || '');
    const [paidAmountError, setPaidAmountError] = useState('');
    const [discountAmount, setDiscountAmount] = useState(
        recoveredRequest?.discountAmount || '0'
    );
    const [discountAmountError, setDiscountAmountError] = useState('');
    const [discountDescription, setDiscountDescription] = useState(
        recoveredRequest?.description || ''
    );
    const [phase, setPhase] = useState(() => {
        if (initialRecovery.status === 'available') return 'unknown';
        if (['foreign', 'quarantined'].includes(initialRecovery.status)) return 'quarantined';
        return 'idle';
    });
    const [confirmationRequest, setConfirmationRequest] = useState(null);
    const [attempt, setAttempt] = useState(recoveredAttempt);
    const [failureMessage, setFailureMessage] = useState('');
    const [unknownMessage, setUnknownMessage] = useState(recoveredAttempt
        ? 'Permintaan tersimpan dari percobaan sebelumnya. Periksa hasilnya sebelum mengirim ulang.'
        : '');
    const [cartError, setCartError] = useState('');
    const [result, setResult] = useState(null);

    const attemptRef = useRef(recoveredAttempt);
    const inFlightRef = useRef(false);
    const mountedRef = useRef(true);
    const ownerAccountIdRef = useRef(ownerAccountId);
    const paidAmountRef = useRef(null);
    const discountAmountRef = useRef(null);
    const feedbackRef = useRef(null);
    const successRef = useRef(null);
    const printFeedbackRef = useRef(null);
    const reviewButtonRef = useRef(null);
    const focusReviewButtonRef = useRef(false);

    const checkoutLocked = LOCKED_PHASES.has(phase);
    const currentRequest = createSaleRequest(
        itemList,
        paymentType,
        paidAmount,
        discountAmount,
        discountDescription
    );
    const currentSignature = getSaleRequestSignature(currentRequest);
    const estimate = getAdvisorySaleEstimate(itemList, discountAmount);
    const hasDiscount = getMoneySign(discountAmount) > 0;
    const advisoryCashChange = getAdvisoryCashChange(paidAmount, estimate.totalAmount);
    const cashShortcuts = estimate.hasInvalidLine
        ? []
        : getAdvisoryCashShortcuts(estimate.totalAmount).map((value, index) => ({
            label: index === 0 ? 'Uang pas' : formatRupiah(value),
            value
        }));
    const isPreparationPhase = ['idle', 'failed'].includes(phase);
    const ownsAttempt = !!ownerAccountId && attempt?.ownerAccountId === ownerAccountId;
    const canRetrySameRequest = ownsAttempt && (phase === 'unknown'
        || (attempt?.signature === currentSignature && !disabled));
    const printState = result?.code
        ? receiptPrintStateBySale[result.code] || EMPTY_RECEIPT_PRINT_STATE
        : EMPTY_RECEIPT_PRINT_STATE;
    const printMessage = getReceiptPrintMessage(printState);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            onLockChange(false);
        };
    }, [onLockChange]);

    useEffect(() => {
        const previousOwnerAccountId = ownerAccountIdRef.current;
        ownerAccountIdRef.current = ownerAccountId;
        if (previousOwnerAccountId === ownerAccountId) return;

        const recovery = readSaleCheckoutRecovery(ownerAccountId);
        setConfirmationRequest(null);
        setResult(null);
        setFailureMessage('');
        setCartError('');

        if (recovery.status === 'available') {
            const nextAttempt = recovery.attempt;
            attemptRef.current = nextAttempt;
            setAttempt(nextAttempt);
            setPaymentType(nextAttempt.request.paymentType);
            setPaidAmount(nextAttempt.request.paidAmount);
            setDiscountAmount(nextAttempt.request.discountAmount);
            setDiscountDescription(nextAttempt.request.description);
            setUnknownMessage(
                'Permintaan tersimpan dari percobaan sebelumnya. Periksa hasilnya sebelum mengirim ulang.'
            );
            setPhase('unknown');
            return;
        }

        attemptRef.current = null;
        setAttempt(null);
        setUnknownMessage('');
        setPhase(['foreign', 'quarantined'].includes(recovery.status)
            ? 'quarantined'
            : 'idle');
    }, [ownerAccountId]);

    useEffect(() => {
        onLockChange(checkoutLocked);
    }, [checkoutLocked, onLockChange]);

    useEffect(() => {
        if (discountAmountError) {
            discountAmountRef.current?.focus();
        } else if (paidAmountError) {
            paidAmountRef.current?.focus();
        } else if (phase === 'failed' || phase === 'unknown' || phase === 'quarantined') {
            feedbackRef.current?.focus();
        } else if (phase === 'success') {
            successRef.current?.focus();
        }
    }, [discountAmountError, paidAmountError, phase]);

    useEffect(() => {
        if (phase === 'idle' && focusReviewButtonRef.current) {
            focusReviewButtonRef.current = false;
            reviewButtonRef.current?.focus();
        }
    }, [phase]);

    useEffect(() => {
        if (printState.status === RECEIPT_PRINT_STATUS.SUCCESS
            || printState.status === RECEIPT_PRINT_STATUS.ERROR) {
            printFeedbackRef.current?.focus();
        }
    }, [printState.status]);

    useEffect(() => {
        if (phase === 'success' && result?.code) {
            printReceipt(result.code).catch(() => undefined);
        }
    }, [phase, printReceipt, result?.code]);

    const resetKnownFailure = () => {
        setFailureMessage('');
        setCartError('');
        if (phase === 'failed') setPhase('idle');
    };

    const resetAttemptWhenRequestChanges = nextRequest => {
        if (attemptRef.current?.signature !== getSaleRequestSignature(nextRequest)) {
            attemptRef.current = null;
            setAttempt(null);
        }
        setResult(null);
    };

    const changePaymentType = (_event, nextPaymentType) => {
        if (!nextPaymentType) return;

        setPaymentType(nextPaymentType);
        setPaidAmountError('');
        resetKnownFailure();
        resetAttemptWhenRequestChanges(createSaleRequest(
            itemList,
            nextPaymentType,
            paidAmount,
            discountAmount,
            discountDescription
        ));
    };

    const changePaidAmount = value => {
        setPaidAmount(value);
        setPaidAmountError('');
        resetKnownFailure();
        resetAttemptWhenRequestChanges(createSaleRequest(
            itemList,
            paymentType,
            value,
            discountAmount,
            discountDescription
        ));
    };

    const changeDiscountAmount = value => {
        const nextDiscountAmount = value || '0';
        const nextDescription = getMoneySign(nextDiscountAmount) > 0
            ? discountDescription
            : '';

        setDiscountAmount(nextDiscountAmount);
        setDiscountDescription(nextDescription);
        setDiscountAmountError('');
        resetKnownFailure();
        resetAttemptWhenRequestChanges(createSaleRequest(
            itemList,
            paymentType,
            paidAmount,
            nextDiscountAmount,
            nextDescription
        ));
    };

    const changeDiscountDescription = event => {
        const value = event.target.value;
        setDiscountDescription(value);
        resetKnownFailure();
        resetAttemptWhenRequestChanges(createSaleRequest(
            itemList,
            paymentType,
            paidAmount,
            discountAmount,
            value
        ));
    };

    const completeSale = (sale, completedAttempt) => {
        if (!mountedRef.current
            || completedAttempt?.ownerAccountId !== ownerAccountIdRef.current) {
            return;
        }

        clearSaleCheckoutRecovery(completedAttempt.ownerAccountId, completedAttempt.key);
        attemptRef.current = null;
        setAttempt(null);
        setConfirmationRequest(null);
        setPaidAmount('');
        setPaidAmountError('');
        setDiscountAmount('0');
        setDiscountAmountError('');
        setDiscountDescription('');
        setFailureMessage('');
        setUnknownMessage('');
        setCartError('');
        setResult(sale);
        setPhase('success');
        onSaleCompleted(sale);
    };

    const markUnknown = (message, currentAttempt) => {
        if (!mountedRef.current
            || currentAttempt?.ownerAccountId !== ownerAccountIdRef.current) {
            return;
        }

        setConfirmationRequest(null);
        setUnknownMessage(message);
        setPhase('unknown');
    };

    const lookupOutcome = async currentAttempt => {
        if (!mountedRef.current
            || currentAttempt?.ownerAccountId !== ownerAccountIdRef.current) {
            return;
        }

        setPhase('checking');
        setUnknownMessage('');

        try {
            const response = await getCheckoutStatus(currentAttempt.key);
            if (currentAttempt.ownerAccountId !== ownerAccountIdRef.current) return;

            const checkoutStatus = response?.data;
            if (checkoutStatus?.status === 'COMPLETED' && checkoutStatus.sale?.code) {
                completeSale(checkoutStatus.sale, currentAttempt);
                return;
            }

            markUnknown(
                'Server belum menemukan hasil transaksi ini. Ini bukan bukti gagal; jangan membuat pembayaran baru.',
                currentAttempt
            );
        } catch {
            markUnknown(
                'Status transaksi belum dapat diperiksa. Periksa lagi dengan permintaan dan kunci yang sama.',
                currentAttempt
            );
        }
    };

    const handleKnownFailure = async (error, currentAttempt) => {
        if (!mountedRef.current
            || currentAttempt?.ownerAccountId !== ownerAccountIdRef.current) {
            return;
        }

        clearSaleCheckoutRecovery(currentAttempt.ownerAccountId, currentAttempt.key);
        setConfirmationRequest(null);
        setUnknownMessage('');
        setPaidAmountError('');
        setCartError('');
        setPhase('failed');

        if (error?.category === API_ERROR_CATEGORY.VALIDATION) {
            let nextPaidError = '';
            let nextCartError = '';
            error.validationErrors?.forEach(detail => {
                if (!nextPaidError && backendFieldTargetsPaidAmount(detail.field)) {
                    nextPaidError = detail.message || 'Jumlah pembayaran ditolak server.';
                }
                if (!nextCartError && backendFieldTargetsCart(detail.field)) {
                    nextCartError = detail.message || 'Isi keranjang ditolak server.';
                }
            });
            setPaidAmountError(nextPaidError);
            setCartError(nextCartError);
            setFailureMessage(nextPaidError || nextCartError
                ? 'Server menolak data checkout. Perbaiki bagian yang ditandai lalu buat percobaan baru.'
                : 'Server menolak data checkout. Periksa pembayaran dan keranjang lalu coba lagi.');
            return;
        }

        if (error?.domainCode === API_DOMAIN_ERROR_CODE.SALE_PAID_LESS_THAN_TOTAL) {
            setPaidAmountError('Uang tunai lebih kecil daripada total yang dihitung server.');
            setFailureMessage('Pembayaran ditolak server. Masukkan nominal tunai yang sesuai lalu konfirmasi lagi.');
            return;
        }

        if (error?.domainCode === API_DOMAIN_ERROR_CODE.SALE_QRIS_PAYMENT_MISMATCH) {
            setPaidAmountError('Nominal QRIS tidak sama dengan total yang dihitung server.');
            setFailureMessage('Pembayaran QRIS ditolak server. Periksa nominal terkonfirmasi lalu coba lagi.');
            return;
        }

        if (error?.domainCode === API_DOMAIN_ERROR_CODE.SALE_INSUFFICIENT_STOCK) {
            setCartError('Stok STORE tidak lagi cukup untuk salah satu barang.');
            setFailureMessage('Stok berubah saat checkout. Sesuaikan keranjang atau coba lagi setelah stok tersedia.');
            return;
        }

        if (error?.domainCode === API_DOMAIN_ERROR_CODE.CASH_SESSION_CONFLICT) {
            setFailureMessage('Sesi kas tidak lagi terbuka. Status sesi sedang dimuat ulang; buka sesi sebelum mencoba lagi.');
            getCurrentSession().catch(() => undefined);
            return;
        }

        if (error?.domainCode === API_DOMAIN_ERROR_CODE.CHECKOUT_IDEMPOTENCY_CONFLICT) {
            attemptRef.current = null;
            setAttempt(null);
            setFailureMessage('Kunci transaksi bertabrakan dengan permintaan lain. Data tidak dikirim ulang; tinjau untuk membuat percobaan baru.');
            return;
        }

        if (error?.category === API_ERROR_CATEGORY.CONFLICT) {
            setFailureMessage('Checkout bertabrakan dengan perubahan stok atau sesi. Periksa keranjang dan sesi kas lalu coba lagi.');
            getCurrentSession().catch(() => undefined);
            return;
        }

        setFailureMessage(error?.message || 'Checkout ditolak server. Periksa masukan lalu coba lagi.');
    };

    const submitAttempt = async currentAttempt => {
        if (inFlightRef.current
            || currentAttempt?.ownerAccountId !== ownerAccountIdRef.current) {
            return;
        }

        try {
            persistSaleCheckoutAttempt(currentAttempt.ownerAccountId, currentAttempt);
        } catch {
            attemptRef.current = null;
            setAttempt(null);
            setConfirmationRequest(null);
            setFailureMessage(
                'Pemulihan transaksi tidak dapat disimpan di tab ini. Penjualan belum dikirim; coba lagi setelah penyimpanan browser tersedia.'
            );
            setPhase('failed');
            return;
        }

        inFlightRef.current = true;
        setPhase('submitting');
        setFailureMessage('');
        setUnknownMessage('');

        try {
            const response = await createSale(currentAttempt.request, currentAttempt.key);
            if (response?.data?.code) {
                completeSale(response.data, currentAttempt);
            } else {
                await lookupOutcome(currentAttempt);
            }
        } catch (error) {
            if (isAmbiguousFailure(error)) {
                await lookupOutcome(currentAttempt);
            } else {
                await handleKnownFailure(error, currentAttempt);
            }
        } finally {
            inFlightRef.current = false;
        }
    };

    const reviewCheckout = event => {
        event.preventDefault();
        if (checkoutLocked || disabled || !itemList.length) return;

        if (!ownerAccountId) {
            setFailureMessage(
                'Identitas akun belum terverifikasi. Muat ulang sesi akun sebelum meninjau pembayaran.'
            );
            setPhase('failed');
            return;
        }

        const nextPaidAmountError = validatePaidAmount(paidAmount);
        const nextDiscountAmountError = validateDiscountAmount(discountAmount);
        setPaidAmountError(nextPaidAmountError);
        setDiscountAmountError(nextDiscountAmountError);
        setCartError('');
        setFailureMessage('');
        setResult(null);
        if (nextPaidAmountError || nextDiscountAmountError) return;

        setConfirmationRequest(currentRequest);
        setPhase('confirmation');
    };

    const confirmCheckout = () => {
        if (!confirmationRequest || inFlightRef.current || !ownerAccountId) return;
        const signature = getSaleRequestSignature(confirmationRequest);
        let currentAttempt = attemptRef.current;
        if (!currentAttempt || currentAttempt.signature !== signature) {
            currentAttempt = {
                ownerAccountId,
                key: createSaleIdempotencyKey(),
                request: confirmationRequest,
                signature,
                displayLines: itemList.map(item => ({
                    sku: item.sku,
                    name: item.name,
                    quantity: item.quantity,
                    baseUnitOfMeasure: item.baseUnitOfMeasure
                }))
            };
            attemptRef.current = currentAttempt;
            setAttempt(currentAttempt);
        }
        submitAttempt(currentAttempt);
    };

    const cancelConfirmation = () => {
        focusReviewButtonRef.current = true;
        setConfirmationRequest(null);
        setPhase('idle');
    };

    const retrySameRequest = () => {
        if (canRetrySameRequest && attemptRef.current) {
            submitAttempt(attemptRef.current);
        }
    };

    const recheckOutcome = async () => {
        if (inFlightRef.current || !attemptRef.current) return;
        inFlightRef.current = true;
        try {
            await lookupOutcome(attemptRef.current);
        } finally {
            inFlightRef.current = false;
        }
    };

    const startNextSale = () => {
        setResult(null);
        setPhase('idle');
        onSaleCompleted(null);
    };

    if (!itemList.length && !['success', 'unknown', 'quarantined'].includes(phase)) return null;

    return (
        <Paper
            component="section"
            elevation={ 0 }
            className="cashier-checkout mt-2 border-t p-0 pt-4"
            aria-labelledby="cashier-checkout-title"
        >
            <h2
                id="cashier-checkout-title"
                className={ isPreparationPhase ? 'sr-only' : 'text-base font-bold' }
            >
                { confirmationRequest
                    ? 'Tinjau pembayaran'
                    : ['unknown', 'quarantined'].includes(phase)
                        || (['submitting', 'checking'].includes(phase) && !confirmationRequest)
                        ? 'Pemulihan transaksi'
                        : 'Siapkan pembayaran' }
            </h2>
            { !isPreparationPhase && (
                <p className="mt-1 text-sm text-gray-600">
                    { confirmationRequest
                        ? 'Permintaan belum menjadi penjualan sampai server mengembalikan hasil.'
                        : 'Keranjang dan permintaan dipertahankan sampai server memberikan hasil pasti.' }
                </p>
            ) }

            { confirmationRequest && ['confirmation', 'submitting', 'checking'].includes(phase) && (
                <CashierPurchaseConfirmationModal
                    estimate={ estimate }
                    itemList={ itemList }
                    onCancel={ cancelConfirmation }
                    onConfirm={ confirmCheckout }
                    phase={ phase }
                    request={ confirmationRequest }
                />
            ) }

            { isPreparationPhase && (
                <div
                    className="cashier-checkout__total-hero"
                    aria-label="Perkiraan bayar dari harga yang tampil"
                >
                    <span>Perkiraan bayar</span>
                    <strong className="tabular-nums">
                        { estimate.hasInvalidLine ? 'Belum tersedia' : formatRupiah(estimate.totalAmount) }
                    </strong>
                    <small>Dari harga yang tampil. Total akhir ditetapkan server.</small>
                </div>
            ) }

            { (phase === 'unknown'
                || (!confirmationRequest && ['submitting', 'checking'].includes(phase))) && (
                <Alert
                    severity={ phase === 'unknown' ? 'warning' : 'info' }
                    className="mt-4"
                    role={ phase === 'unknown' ? 'alert' : 'status' }
                    aria-label={ phase === 'unknown'
                        ? 'Pemulihan checkout'
                        : 'Status pemulihan checkout' }
                    aria-busy={ phase !== 'unknown' }
                    tabIndex={ -1 }
                    ref={ feedbackRef }
                >
                    <div className="font-semibold">
                        { phase === 'unknown'
                            ? 'Hasil transaksi belum diketahui.'
                            : phase === 'checking'
                                ? 'Memeriksa hasil di server.'
                                : 'Mengirim ulang permintaan yang sama.' }
                    </div>
                    <div>
                        { phase === 'unknown'
                            ? unknownMessage
                            : (
                                <span className="inline-flex items-center gap-2">
                                    <CircularProgress size={ 18 } />
                                    Keranjang tetap dikunci. Jangan membuat transaksi baru.
                                </span>
                            ) }
                    </div>
                    <div className="mt-3 rounded border border-amber-300 bg-white p-3 text-sm text-slate-800">
                        <div className="font-semibold">
                            Permintaan tersimpan · { PAYMENT_LABELS[attempt?.request?.paymentType] }
                        </div>
                        <div className="mt-1">
                            { attempt?.request?.paymentType === PAYMENT_TYPES.CASH
                                ? 'Uang tunai diterima'
                                : 'Nominal QRIS terkonfirmasi' }:{ ' ' }
                            <strong>{ formatRupiah(attempt?.request?.paidAmount) }</strong>
                        </div>
                        <div className="mt-2 space-y-1" aria-label="Barang dalam permintaan tersimpan">
                            { (attempt?.displayLines || []).map(line => (
                                <div key={ line.sku }>
                                    { line.name }: { formatQuantity(
                                        line.quantity,
                                        line.baseUnitOfMeasure
                                    ) } dari STORE
                                </div>
                            )) }
                        </div>
                    </div>
                    <div className="mt-2 font-semibold">
                        Jangan buat transaksi pengganti. Pemeriksaan dan pengiriman ulang memakai
                        permintaan serta kunci idempotensi yang sama.
                    </div>
                    { phase === 'unknown' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button color="inherit" size="small" onClick={ recheckOutcome }>
                            Periksa status lagi
                        </Button>
                        <Button
                            color="inherit"
                            size="small"
                            onClick={ retrySameRequest }
                            disabled={ !canRetrySameRequest }
                        >
                            Kirim ulang permintaan yang sama
                        </Button>
                    </div>
                    ) }
                </Alert>
            ) }

            { phase === 'quarantined' && (
                <Alert
                    severity="warning"
                    className="mt-4"
                    role="alert"
                    aria-label="Pemulihan checkout akun lain"
                    tabIndex={ -1 }
                    ref={ feedbackRef }
                >
                    <div className="font-semibold">Pemulihan checkout dikunci untuk akun ini.</div>
                    <div>
                        Tab ini menyimpan percobaan milik akun lain atau data pemulihan lama yang
                        tidak memiliki identitas akun yang dapat dibuktikan. Rincian tidak ditampilkan
                        dan permintaan tidak dapat diperiksa, dikirim ulang, atau dihapus oleh akun ini.
                    </div>
                </Alert>
            ) }

            { phase === 'failed' && failureMessage && (
                <Alert
                    severity="error"
                    className="mt-4"
                    tabIndex={ -1 }
                    ref={ feedbackRef }
                    action={ canRetrySameRequest && !paidAmountError && !cartError ? (
                        <Button color="inherit" size="small" onClick={ retrySameRequest }>
                            Coba lagi dengan kunci yang sama
                        </Button>
                    ) : undefined }
                >
                    { failureMessage }
                </Alert>
            ) }

            { phase === 'success' && result && (
                <>
                    <Alert
                        severity="success"
                        className="mt-4"
                        role="status"
                        aria-label="Status penjualan"
                        tabIndex={ -1 }
                        ref={ successRef }
                    >
                        <div className="font-semibold">Penjualan { result.code } berhasil.</div>
                        <div>Total server: { formatRupiah(result.totalAmount) }.</div>
                        <div>Pembayaran: { formatRupiah(result.paidAmount) } via { PAYMENT_LABELS[result.paymentType] }.</div>
                        <div>Kembalian server: { formatRupiah(result.changeAmount) }.</div>
                    </Alert>

                    { printState.status !== RECEIPT_PRINT_STATUS.IDLE && (
                        <Alert
                            id="cashier-receipt-print-status"
                            severity={ printState.status === RECEIPT_PRINT_STATUS.ERROR
                                ? 'error'
                                : printState.status === RECEIPT_PRINT_STATUS.SUCCESS
                                    ? 'success'
                                    : 'info' }
                            className="mt-3"
                            role={ printState.status === RECEIPT_PRINT_STATUS.ERROR ? 'alert' : 'status' }
                            aria-label="Status pencetakan struk"
                            aria-busy={ printState.status === RECEIPT_PRINT_STATUS.PENDING }
                            tabIndex={ -1 }
                            ref={ printFeedbackRef }
                        >
                            <div className="font-semibold">Pencetakan struk { result.code }</div>
                            <div>{ printMessage } Penjualan tetap berhasil dan tidak dikirim ulang.</div>
                            { printState.error?.domainCode === API_DOMAIN_ERROR_CODE.SALE_NOT_FOUND && (
                                <div>Buka detail penjualan untuk memeriksa transaksi.</div>
                            ) }
                            <Button
                                color="inherit"
                                size="small"
                                className="mt-2"
                                startIcon={ <Printer size={ 16 } /> }
                                onClick={ () => printReceipt(result.code).catch(() => undefined) }
                                disabled={ printState.status === RECEIPT_PRINT_STATUS.PENDING }
                            >
                                { printState.status === RECEIPT_PRINT_STATUS.PENDING
                                    ? 'Mencetak...'
                                    : printState.status === RECEIPT_PRINT_STATUS.ERROR
                                        ? 'Coba cetak lagi'
                                        : 'Cetak ulang struk' }
                            </Button>
                        </Alert>
                    ) }

                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                            component={ Link }
                            to={ `/sales/${ encodeURIComponent(result.code) }` }
                            variant="outlined"
                            size="small"
                        >
                            Lihat detail penjualan
                        </Button>
                        <Button variant="contained" size="small" onClick={ startNextSale }>
                            Siapkan transaksi berikutnya
                        </Button>
                    </div>
                </>
            ) }

            { cartError && <Alert severity="warning" className="mt-4">{ cartError }</Alert> }
            { disabledMessage && <Alert severity="info" className="mt-4">{ disabledMessage }</Alert> }

            { ['idle', 'failed'].includes(phase) && (
            <form className="cashier-checkout__form mt-4 space-y-4" onSubmit={ reviewCheckout } noValidate>
                <div>
                    <div id="cashier-payment-type-label" className="mb-2 text-sm font-medium">
                        Metode pembayaran
                    </div>
                    <ToggleButtonGroup
                        exclusive
                        fullWidth
                        size="small"
                        value={ paymentType }
                        onChange={ changePaymentType }
                        disabled={ disabled || checkoutLocked }
                        aria-labelledby="cashier-payment-type-label"
                    >
                        <ToggleButton value={ PAYMENT_TYPES.CASH }>Tunai</ToggleButton>
                        <ToggleButton value={ PAYMENT_TYPES.QRIS }>QRIS</ToggleButton>
                    </ToggleButtonGroup>
                    <p className="mt-2 text-xs text-slate-600">
                        { paymentType === PAYMENT_TYPES.CASH
                            ? 'Masukkan uang yang benar-benar diterima.'
                            : 'Masukkan nominal yang sudah terkonfirmasi di perangkat QRIS.' }
                    </p>
                </div>

                <BloomMoneyField
                    fullWidth
                    required
                    size="small"
                    label={ paymentType === PAYMENT_TYPES.CASH
                        ? 'Uang tunai diterima'
                        : 'Nominal QRIS terkonfirmasi' }
                    value={ paidAmount }
                    onValueChange={ changePaidAmount }
                    onBlur={ () => setPaidAmountError(validatePaidAmount(paidAmount)) }
                    error={ Boolean(paidAmountError) }
                    helperText={ paidAmountError || (paymentType === PAYMENT_TYPES.CASH
                        ? 'Kembalian resmi dihitung server dari nominal tunai ini.'
                        : 'Masukkan nominal yang sudah terkonfirmasi di perangkat QRIS.') }
                    inputRef={ paidAmountRef }
                    groupSeparator=","
                    decimalSeparator="."
                    currencySymbol="Rp"
                    disabled={ disabled || checkoutLocked }
                />

                { paymentType === PAYMENT_TYPES.CASH && cashShortcuts.length > 0 && (
                    <div
                        className="cashier-checkout__shortcuts"
                        role="group"
                        aria-label="Pilihan cepat uang tunai"
                    >
                        { cashShortcuts.map(shortcut => (
                            <Button
                                key={ shortcut.value }
                                type="button"
                                size="small"
                                variant="outlined"
                                disabled={ disabled || checkoutLocked }
                                onClick={ () => changePaidAmount(shortcut.value) }
                            >
                                { shortcut.label }
                            </Button>
                        )) }
                    </div>
                ) }

                { paymentType === PAYMENT_TYPES.CASH && advisoryCashChange !== null && (
                    <div
                        className="cashier-checkout__change"
                        role="status"
                        aria-live="polite"
                    >
                        <span>Perkiraan kembalian</span>
                        <strong className="tabular-nums">
                            { formatRupiah(advisoryCashChange) }
                        </strong>
                        <small>Server menetapkan kembalian resmi.</small>
                    </div>
                ) }

                <BloomMoneyField
                    fullWidth
                    size="small"
                    label="Diskon penjualan"
                    value={ discountAmount }
                    onValueChange={ changeDiscountAmount }
                    onBlur={ () => setDiscountAmountError(validateDiscountAmount(discountAmount)) }
                    error={ Boolean(discountAmountError) }
                    helperText={ discountAmountError || 'Opsional. Server memvalidasi diskon dan total akhir.' }
                    inputRef={ discountAmountRef }
                    groupSeparator=","
                    decimalSeparator="."
                    currencySymbol="Rp"
                    disabled={ disabled || checkoutLocked }
                />

                { hasDiscount && (
                    <TextField
                        fullWidth
                        multiline
                        minRows={ 2 }
                        size="small"
                        label="Alasan diskon"
                        value={ discountDescription }
                        onChange={ changeDiscountDescription }
                        helperText="Opsional. Catatan ini disimpan bersama penjualan."
                        disabled={ disabled || checkoutLocked }
                    />
                ) }

                { phase === 'failed' && (
                    <div className="rounded border bg-slate-50 p-3 text-sm text-slate-700">
                        <div className="font-semibold">Keranjang tetap tersimpan</div>
                        { itemList.map(item => (
                            <div key={ item.sku }>
                                { item.name }: { formatQuantity(item.quantity, item.baseUnitOfMeasure) } dari STORE
                            </div>
                        )) }
                    </div>
                ) }

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    className="cashier-primary-action"
                    disabled={ disabled || checkoutLocked || !itemList.length }
                    ref={ reviewButtonRef }
                >
                    Tinjau pembayaran
                </Button>
            </form>
            ) }
        </Paper>
    );
}

CashierCheckout.propTypes = {
    itemList: PropTypes.array.isRequired,
    disabled: PropTypes.bool,
    disabledMessage: PropTypes.string,
    onLockChange: PropTypes.func.isRequired,
    onSaleCompleted: PropTypes.func.isRequired
};
