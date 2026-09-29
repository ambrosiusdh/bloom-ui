import {
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react';
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle
} from '@mui/material';
import PropTypes from 'prop-types';

import cashSessionApi from '@api/cash-session.js';
import { API_ERROR_CATEGORY } from '@api/index.js';
import BloomMoneyField from '@components/_ui/BloomMoneyField.jsx';
import {
    formatRupiah,
    normalizeMoney,
    validateCashAmount
} from '@components/cash-session/cash-session-money.js';
import { useCashSessionStore } from '@stores/index.js';

const getActualCashFieldError = error => error?.validationErrors
    ?.find(detail => detail.field === 'actualClosingCash')?.message || '';

export default function CloseCashSessionDialog({
    open,
    session,
    onClose,
    onNotice,
    onClosed
}) {
    const isClosing = useCashSessionStore(state => state.isClosing);
    const closeSession = useCashSessionStore(state => state.closeSession);
    const getSessionDetails = useCashSessionStore(state => state.getSessionDetails);
    const clearClosingError = useCashSessionStore(state => state.clearClosingError);

    const [previewStatus, setPreviewStatus] = useState('idle');
    const [preview, setPreview] = useState(null);
    const [previewError, setPreviewError] = useState('');
    const [actualCash, setActualCash] = useState('');
    const [reviewedActualCash, setReviewedActualCash] = useState('');
    const [step, setStep] = useState('entry');
    const [fieldError, setFieldError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [recoveryMessage, setRecoveryMessage] = useState('');
    const [isRecovering, setRecovering] = useState(false);

    const previewRequestIdRef = useRef(0);
    const previewAbortControllerRef = useRef(null);
    const inputRef = useRef(null);
    const reviewBackRef = useRef(null);
    const submitErrorRef = useRef(null);
    const submitInProgressRef = useRef(false);
    const mountedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const loadPreview = useCallback(async () => {
        if (!session?.id) return;

        previewAbortControllerRef.current?.abort();
        const controller = new AbortController();
        previewAbortControllerRef.current = controller;
        const requestId = ++previewRequestIdRef.current;
        setPreviewStatus('loading');
        setPreviewError('');
        try {
            const { data: response } = await cashSessionApi.getExpectedCash(session.id, {
                signal: controller.signal
            });
            if (controller.signal.aborted
                    || !mountedRef.current
                    || requestId !== previewRequestIdRef.current) return;
            setPreview(response.data);
            setPreviewStatus('ready');
        } catch (error) {
            if (controller.signal.aborted
                    || !mountedRef.current
                    || requestId !== previewRequestIdRef.current) return;
            setPreview(null);
            setPreviewStatus('error');
            setPreviewError(error?.message || 'Uang kas yang diharapkan gagal dimuat.');
        } finally {
            if (previewAbortControllerRef.current === controller) {
                previewAbortControllerRef.current = null;
            }
        }
    }, [session?.id]);

    useEffect(() => {
        if (!open) {
            previewRequestIdRef.current += 1;
            previewAbortControllerRef.current?.abort();
            previewAbortControllerRef.current = null;
            return;
        }

        setActualCash('');
        setReviewedActualCash('');
        setStep('entry');
        setFieldError('');
        setSubmitError('');
        setRecoveryMessage('');
        setRecovering(false);
        clearClosingError();
        loadPreview();

        return () => {
            previewRequestIdRef.current += 1;
            previewAbortControllerRef.current?.abort();
            previewAbortControllerRef.current = null;
        };
    }, [clearClosingError, loadPreview, open]);

    useEffect(() => {
        if (open && step === 'entry' && previewStatus === 'ready') {
            inputRef.current?.focus();
        }
    }, [open, previewStatus, step]);

    useEffect(() => {
        if (open && step === 'review') {
            reviewBackRef.current?.focus();
        }
    }, [open, step]);

    useEffect(() => {
        if (submitError) {
            submitErrorRef.current?.focus();
        }
    }, [submitError]);

    const closeDialog = () => {
        if (isClosing || isRecovering) return;
        onClose();
    };

    const changeActualCash = value => {
        setActualCash(value);
        setFieldError('');
        setSubmitError('');
        setRecoveryMessage('');
    };

    const recoverSessionStatus = async () => {
        setSubmitError('');
        setRecoveryMessage('');
        setRecovering(true);
        try {
            const latestSession = await getSessionDetails(session.id);
            if (!mountedRef.current) return;

            if (latestSession?.status === 'CLOSED') {
                onClose();
                onClosed?.(latestSession);
                onNotice({
                    severity: 'warning',
                    message: 'Sesi sudah ditutup. Hasil server terbaru ditampilkan.'
                });
                return;
            }

            setStep('entry');
            setReviewedActualCash('');
            setRecoveryMessage(
                'Sesi masih terbuka. Periksa kembali kas aktual dan pratinjau server terbaru.'
            );
            loadPreview();
        } catch (error) {
            if (!mountedRef.current) return;
            setSubmitError(
                `${ error?.message || 'Status sesi kas gagal diperiksa.'
                } Coba periksa status lagi sebelum mengirim penutupan.`
            );
        } finally {
            if (mountedRef.current) {
                setRecovering(false);
            }
        }
    };

    const reviewClose = event => {
        event.preventDefault();
        if (previewStatus !== 'ready') return;

        const nextFieldError = validateCashAmount(actualCash, 'Kas aktual');
        setFieldError(nextFieldError);
        if (nextFieldError) {
            inputRef.current?.focus();
            return;
        }

        setReviewedActualCash(normalizeMoney(actualCash));
        setSubmitError('');
        setRecoveryMessage('');
        setStep('review');
    };

    const returnToEntry = () => {
        if (isClosing || isRecovering) return;

        setStep('entry');
        setReviewedActualCash('');
        setSubmitError('');
    };

    const submitClose = async event => {
        event.preventDefault();
        if (step !== 'review'
                || submitInProgressRef.current
                || isClosing
                || isRecovering
                || submitError
                || previewStatus !== 'ready') return;

        submitInProgressRef.current = true;
        setSubmitError('');
        try {
            const closedSession = await closeSession(session.id, {
                data: { actualClosingCash: reviewedActualCash }
            });
            if (!closedSession || !mountedRef.current) return;

            onClose();
            onClosed?.(closedSession);
            onNotice({
                severity: 'success',
                message: `Sesi kas #${ closedSession.id } berhasil ditutup.`
            });
        } catch (error) {
            if (!mountedRef.current) return;

            const backendFieldError = getActualCashFieldError(error);
            if (backendFieldError) {
                setStep('entry');
                setReviewedActualCash('');
                setFieldError(backendFieldError);
            } else if (error?.category === API_ERROR_CATEGORY.CONFLICT) {
                onClose();
                onNotice({
                    severity: 'warning',
                    message: 'Sesi sudah ditutup atau berubah di tempat lain. Memuat hasil server terbaru...'
                });
                try {
                    const latestSession = await getSessionDetails(session.id);
                    if (mountedRef.current && latestSession?.status === 'CLOSED') {
                        onClosed?.(latestSession);
                        onNotice({
                            severity: 'warning',
                            message: 'Sesi sudah ditutup di tempat lain. Hasil server terbaru ditampilkan.'
                        });
                    }
                } catch {
                    // The shared store exposes the refresh error and keeps drawer actions locked.
                }
            } else {
                setSubmitError(
                    `${ error?.message || 'Hasil penutupan belum dapat dipastikan.'
                    } Periksa status sebelum mencoba lagi.`
                );
            }
        } finally {
            submitInProgressRef.current = false;
        }
    };

    return (
        <Dialog
            open={ open }
            onClose={ isClosing || isRecovering ? undefined : closeDialog }
            disableEscapeKeyDown={ isClosing || isRecovering }
            aria-labelledby="close-cash-session-title"
            maxWidth="xs"
            fullWidth
        >
            <form onSubmit={ step === 'entry' ? reviewClose : submitClose } noValidate>
                <DialogTitle id="close-cash-session-title">
                    { step === 'entry'
                        ? `Tutup sesi kas #${ session?.id }`
                        : `Konfirmasi tutup sesi #${ session?.id }` }
                </DialogTitle>
                <DialogContent className="space-y-4">
                    <p id="actual-cash-description" className="text-sm text-gray-600">
                        { step === 'entry'
                            ? 'Hitung uang fisik di laci. Selisih resmi ditentukan server saat sesi ditutup.'
                            : 'Periksa kas aktual sekali lagi sebelum mengirim penutupan.' }
                    </p>

                    { previewStatus === 'loading' && (
                        <div className="flex items-center gap-3 py-2" role="status">
                            <CircularProgress size={ 22 } aria-hidden="true" />
                            <span>Memuat uang kas yang diharapkan...</span>
                        </div>
                    ) }

                    { previewStatus === 'error' && (
                        <Alert
                            severity="error"
                            action={ (
                                <Button color="inherit" size="small" onClick={ loadPreview }>
                                    Coba lagi
                                </Button>
                            ) }
                        >
                            { previewError }
                        </Alert>
                    ) }

                    { previewStatus === 'ready' && step === 'entry' && (
                        <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-sm text-gray-600">Uang kas yang diharapkan (server)</p>
                            <p className="text-xl font-bold">
                                { formatRupiah(preview?.expectedClosingCash) }
                            </p>
                        </div>
                    ) }

                    { submitError && (
                        <Alert
                            severity="error"
                            tabIndex={ -1 }
                            ref={ submitErrorRef }
                            action={ (
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={ recoverSessionStatus }
                                    disabled={ isRecovering }
                                >
                                    { isRecovering ? 'Memeriksa...' : 'Periksa status' }
                                </Button>
                            ) }
                        >
                            { submitError }
                        </Alert>
                    ) }

                    { recoveryMessage && (
                        <Alert severity="info" role="status">
                            { recoveryMessage }
                        </Alert>
                    ) }

                    { step === 'entry' ? (
                        <BloomMoneyField
                            id="actual-closing-cash"
                            inputRef={ inputRef }
                            fullWidth
                            required
                            label="Kas aktual di laci"
                            value={ actualCash }
                            onValueChange={ changeActualCash }
                            onBlur={ () => setFieldError(
                                validateCashAmount(actualCash, 'Kas aktual')
                            ) }
                            error={ Boolean(fieldError) }
                            helperText={ fieldError
                                || 'Gunakan format Indonesia, misalnya 2.847.000 atau 2.847.000,50.' }
                            groupSeparator="."
                            decimalSeparator=","
                            currencySymbol="Rp"
                            slotProps={ {
                                htmlInput: {
                                    'aria-describedby': 'actual-cash-description actual-closing-cash-helper-text'
                                }
                            } }
                            disabled={ isClosing || previewStatus !== 'ready' }
                        />
                    ) : (
                        <div
                            className="rounded-lg border border-gray-200 p-4"
                            aria-label="Ringkasan penutupan"
                        >
                            <dl className="grid gap-3 text-sm">
                                <div>
                                    <dt className="text-gray-600">Kas diharapkan (pratinjau server)</dt>
                                    <dd className="text-lg font-bold">
                                        { formatRupiah(preview?.expectedClosingCash) }
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-600">Kas aktual</dt>
                                    <dd className="text-lg font-bold">
                                        { formatRupiah(reviewedActualCash) }
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-600">Selisih resmi</dt>
                                    <dd>Ditentukan server setelah penutupan</dd>
                                </div>
                            </dl>
                            <Alert severity="warning" className="mt-4">
                                Penutupan tidak dapat dibatalkan. Hasil rekonsiliasi akan tersimpan
                                sebagai catatan server.
                            </Alert>
                        </div>
                    ) }
                </DialogContent>
                <DialogActions>
                    { step === 'entry' ? (
                        <>
                            <Button onClick={ closeDialog } disabled={ isClosing }>
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={ isClosing || previewStatus !== 'ready' }
                            >
                                Tinjau penutupan
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                ref={ reviewBackRef }
                                onClick={ returnToEntry }
                                disabled={ isClosing || isRecovering }
                            >
                                Kembali periksa
                            </Button>
                            <Button
                                type="submit"
                                color="error"
                                variant="contained"
                                disabled={ isClosing || isRecovering || Boolean(submitError) }
                                aria-busy={ isClosing }
                            >
                                { isClosing ? 'Menutup...' : 'Tutup sesi kas' }
                            </Button>
                        </>
                    ) }
                </DialogActions>
            </form>
        </Dialog>
    );
}

CloseCashSessionDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    session: PropTypes.shape({
        id: PropTypes.number.isRequired
    }),
    onClose: PropTypes.func.isRequired,
    onNotice: PropTypes.func.isRequired,
    onClosed: PropTypes.func
};
