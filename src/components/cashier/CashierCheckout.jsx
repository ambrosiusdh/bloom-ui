import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    CircularProgress,
    MenuItem,
    Paper,
    TextField
} from '@mui/material';
import PropTypes from 'prop-types';

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import { API_ERROR_CATEGORY } from '@api/index.js';
import BloomConfirmationModal from '@components/_ui/BloomConfirmationModal.jsx';
import BloomMoneyField from '@components/_ui/BloomMoneyField.jsx';
import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { useCashSessionStore, useSaleStore } from '@stores/index.js';
import { formatQuantity } from '@utils/quantity-utils.js';

import {
    createSaleIdempotencyKey,
    createSaleRequest,
    getSaleRequestSignature,
    PAYMENT_TYPES,
    validatePaidAmount
} from './sale-checkout.js';

const LOCKED_PHASES = new Set(['confirmation', 'submitting', 'checking', 'unknown']);
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
    const getCurrentSession = useCashSessionStore(state => state.getCurrentSession);

    const [paymentType, setPaymentType] = useState(PAYMENT_TYPES.CASH);
    const [paidAmount, setPaidAmount] = useState('');
    const [paidAmountError, setPaidAmountError] = useState('');
    const [phase, setPhase] = useState('idle');
    const [confirmationRequest, setConfirmationRequest] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [failureMessage, setFailureMessage] = useState('');
    const [unknownMessage, setUnknownMessage] = useState('');
    const [cartError, setCartError] = useState('');
    const [result, setResult] = useState(null);

    const attemptRef = useRef(null);
    const inFlightRef = useRef(false);
    const mountedRef = useRef(true);
    const paidAmountRef = useRef(null);
    const feedbackRef = useRef(null);
    const successRef = useRef(null);

    const checkoutLocked = LOCKED_PHASES.has(phase);
    const currentRequest = createSaleRequest(itemList, paymentType, paidAmount);
    const currentSignature = getSaleRequestSignature(currentRequest);
    const canRetrySameRequest = attempt?.signature === currentSignature && !disabled;

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            onLockChange(false);
        };
    }, [onLockChange]);

    useEffect(() => {
        onLockChange(checkoutLocked);
    }, [checkoutLocked, onLockChange]);

    useEffect(() => {
        if (paidAmountError) {
            paidAmountRef.current?.focus();
        } else if (phase === 'failed' || phase === 'unknown') {
            feedbackRef.current?.focus();
        } else if (phase === 'success') {
            successRef.current?.focus();
        }
    }, [paidAmountError, phase]);

    const resetKnownFailure = () => {
        setFailureMessage('');
        setCartError('');
        if (phase === 'failed') setPhase('idle');
    };

    const changePaymentType = event => {
        setPaymentType(event.target.value);
        setPaidAmountError('');
        resetKnownFailure();
        attemptRef.current = null;
        setAttempt(null);
        setResult(null);
    };

    const changePaidAmount = value => {
        setPaidAmount(value);
        setPaidAmountError('');
        resetKnownFailure();
        if (attemptRef.current?.signature !== getSaleRequestSignature(
            createSaleRequest(itemList, paymentType, value)
        )) {
            attemptRef.current = null;
            setAttempt(null);
        }
        setResult(null);
    };

    const completeSale = sale => {
        if (!mountedRef.current) return;
        attemptRef.current = null;
        setAttempt(null);
        setConfirmationRequest(null);
        setPaidAmount('');
        setPaidAmountError('');
        setFailureMessage('');
        setUnknownMessage('');
        setCartError('');
        setResult(sale);
        setPhase('success');
        onSaleCompleted(sale);
    };

    const markUnknown = message => {
        if (!mountedRef.current) return;
        setConfirmationRequest(null);
        setUnknownMessage(message);
        setPhase('unknown');
    };

    const lookupOutcome = async currentAttempt => {
        if (!mountedRef.current) return;
        setPhase('checking');
        setUnknownMessage('');

        try {
            const response = await getCheckoutStatus(currentAttempt.key);
            const checkoutStatus = response?.data;
            if (checkoutStatus?.status === 'COMPLETED' && checkoutStatus.sale?.code) {
                completeSale(checkoutStatus.sale);
                return;
            }

            markUnknown(
                'Server belum menemukan hasil transaksi ini. Ini bukan bukti gagal; jangan membuat pembayaran baru.'
            );
        } catch {
            markUnknown(
                'Status transaksi belum dapat diperiksa. Simpan transaksi ini dan periksa lagi dengan kunci yang sama.'
            );
        }
    };

    const handleKnownFailure = async error => {
        if (!mountedRef.current) return;
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
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setPhase('submitting');
        setFailureMessage('');
        setUnknownMessage('');

        try {
            const response = await createSale(currentAttempt.request, currentAttempt.key);
            if (response?.data?.code) {
                completeSale(response.data);
            } else {
                await lookupOutcome(currentAttempt);
            }
        } catch (error) {
            if (isAmbiguousFailure(error)) {
                await lookupOutcome(currentAttempt);
            } else {
                await handleKnownFailure(error);
            }
        } finally {
            inFlightRef.current = false;
        }
    };

    const reviewCheckout = event => {
        event.preventDefault();
        if (checkoutLocked || disabled || !itemList.length) return;

        const nextPaidAmountError = validatePaidAmount(paidAmount);
        setPaidAmountError(nextPaidAmountError);
        setCartError('');
        setFailureMessage('');
        setResult(null);
        if (nextPaidAmountError) return;

        setConfirmationRequest(currentRequest);
        setPhase('confirmation');
    };

    const confirmCheckout = () => {
        if (!confirmationRequest || inFlightRef.current) return;
        const signature = getSaleRequestSignature(confirmationRequest);
        let currentAttempt = attemptRef.current;
        if (!currentAttempt || currentAttempt.signature !== signature) {
            currentAttempt = {
                key: createSaleIdempotencyKey(),
                request: confirmationRequest,
                signature
            };
            attemptRef.current = currentAttempt;
            setAttempt(currentAttempt);
        }
        submitAttempt(currentAttempt);
    };

    const cancelConfirmation = () => {
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

    if (!itemList.length && phase !== 'success') return null;

    return (
        <Paper
            component="section"
            className="mt-4 p-4 md:p-5"
            aria-labelledby="cashier-checkout-title"
        >
            { confirmationRequest && (
                <BloomConfirmationModal
                    title="Konfirmasi pembayaran"
                    confirmButtonText={ phase === 'checking'
                        ? 'Memeriksa hasil...'
                        : phase === 'submitting'
                            ? 'Memproses...'
                            : 'Konfirmasi jual' }
                    onCancel={ cancelConfirmation }
                    onConfirm={ confirmCheckout }
                    isPending={ phase === 'submitting' || phase === 'checking' }
                    focusCancel
                >
                    <div className="space-y-3">
                        <p>
                            Kirim <strong>{ confirmationRequest.saleItemList.length } baris barang</strong>
                            { ' ' }dengan pembayaran <strong>{ PAYMENT_LABELS[confirmationRequest.paymentType] }</strong>
                            { ' ' }sebesar <strong>{ formatRupiah(confirmationRequest.paidAmount) }</strong>?
                        </p>
                        <p className="text-sm text-slate-600">
                            Server akan memeriksa sesi dan stok, lalu menghitung total serta kembalian.
                        </p>
                    </div>
                </BloomConfirmationModal>
            ) }

            <h2 id="cashier-checkout-title" className="text-lg font-bold">Pembayaran</h2>
            <p className="mt-1 text-sm text-gray-600">
                Masukkan pembayaran pelanggan. Total dan kembalian hanya ditentukan server setelah konfirmasi.
            </p>

            { phase === 'submitting' && (
                <Alert severity="info" className="mt-4" role="status">
                    <span className="inline-flex items-center gap-2">
                        <CircularProgress size={ 18 } /> Mengirim transaksi satu kali...
                    </span>
                </Alert>
            ) }

            { phase === 'checking' && (
                <Alert severity="info" className="mt-4" role="status">
                    <span className="inline-flex items-center gap-2">
                        <CircularProgress size={ 18 } /> Memeriksa hasil transaksi dengan kunci yang sama...
                    </span>
                </Alert>
            ) }

            { phase === 'unknown' && (
                <Alert
                    severity="warning"
                    className="mt-4"
                    tabIndex={ -1 }
                    ref={ feedbackRef }
                >
                    <div className="font-semibold">Hasil transaksi belum diketahui.</div>
                    <div>{ unknownMessage }</div>
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
                <Alert
                    severity="success"
                    className="mt-4"
                    role="status"
                    tabIndex={ -1 }
                    ref={ successRef }
                >
                    <div className="font-semibold">Penjualan { result.code } berhasil.</div>
                    <div>Total server: { formatRupiah(result.totalAmount) }.</div>
                    <div>Pembayaran: { formatRupiah(result.paidAmount) } via { PAYMENT_LABELS[result.paymentType] }.</div>
                    <div>Kembalian server: { formatRupiah(result.changeAmount) }.</div>
                    <Button color="inherit" size="small" className="mt-2" onClick={ startNextSale }>
                        Siapkan transaksi berikutnya
                    </Button>
                </Alert>
            ) }

            { cartError && <Alert severity="warning" className="mt-4">{ cartError }</Alert> }
            { disabledMessage && <Alert severity="info" className="mt-4">{ disabledMessage }</Alert> }

            { phase !== 'success' && (
            <form className="mt-4 space-y-4" onSubmit={ reviewCheckout } noValidate>
                <TextField
                    select
                    fullWidth
                    size="small"
                    label="Metode pembayaran"
                    value={ paymentType }
                    onChange={ changePaymentType }
                    disabled={ disabled || checkoutLocked }
                >
                    <MenuItem value={ PAYMENT_TYPES.CASH }>{ PAYMENT_LABELS.CASH }</MenuItem>
                    <MenuItem value={ PAYMENT_TYPES.QRIS }>{ PAYMENT_LABELS.QRIS }</MenuItem>
                </TextField>

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
                        ? 'Kembalian dihitung server dari nominal tunai ini.'
                        : 'Masukkan nominal yang sudah terkonfirmasi di perangkat QRIS.') }
                    inputRef={ paidAmountRef }
                    groupSeparator=","
                    decimalSeparator="."
                    currencySymbol="Rp"
                    disabled={ disabled || checkoutLocked }
                />

                <div className="rounded border bg-slate-50 p-3 text-sm text-slate-700">
                    <div className="font-semibold">Intent keranjang</div>
                    { itemList.map(item => (
                        <div key={ item.sku }>
                            { item.name }: { formatQuantity(item.quantity, item.baseUnitOfMeasure) } dari STORE
                        </div>
                    )) }
                </div>

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={ disabled || checkoutLocked || !itemList.length }
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
