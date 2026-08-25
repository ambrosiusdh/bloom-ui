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
    onNotice
}) {
    const isClosing = useCashSessionStore(state => state.isClosing);
    const closeSession = useCashSessionStore(state => state.closeSession);
    const getSessionDetails = useCashSessionStore(state => state.getSessionDetails);
    const clearClosingError = useCashSessionStore(state => state.clearClosingError);

    const [previewStatus, setPreviewStatus] = useState('idle');
    const [preview, setPreview] = useState(null);
    const [previewError, setPreviewError] = useState('');
    const [actualCash, setActualCash] = useState('');
    const [fieldError, setFieldError] = useState('');
    const [submitError, setSubmitError] = useState('');

    const previewRequestIdRef = useRef(0);
    const previewAbortControllerRef = useRef(null);
    const inputRef = useRef(null);
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
        setFieldError('');
        setSubmitError('');
        clearClosingError();
        loadPreview();

        return () => {
            previewRequestIdRef.current += 1;
            previewAbortControllerRef.current?.abort();
            previewAbortControllerRef.current = null;
        };
    }, [clearClosingError, loadPreview, open]);

    useEffect(() => {
        if (open && previewStatus === 'ready') {
            inputRef.current?.focus();
        }
    }, [open, previewStatus]);

    useEffect(() => {
        if (submitError) {
            submitErrorRef.current?.focus();
        }
    }, [submitError]);

    const closeDialog = () => {
        if (isClosing) return;
        onClose();
    };

    const changeActualCash = value => {
        setActualCash(value);
        setFieldError('');
        setSubmitError('');
    };

    const recoverSessionStatus = async () => {
        setSubmitError('');
        try {
            const latestSession = await getSessionDetails(session.id);
            if (!mountedRef.current) return;

            if (latestSession?.status === 'CLOSED') {
                onClose();
                onNotice({
                    severity: 'warning',
                    message: 'Sesi sudah ditutup. Hasil server terbaru ditampilkan.'
                });
                return;
            }

            setSubmitError('Sesi masih terbuka. Nilai kas yang diharapkan sudah dimuat ulang.');
            loadPreview();
        } catch (error) {
            if (!mountedRef.current) return;
            setSubmitError(error?.message || 'Status sesi kas gagal diperiksa.');
        }
    };

    const submitClose = async event => {
        event.preventDefault();
        if (submitInProgressRef.current || isClosing || previewStatus !== 'ready') return;

        const nextFieldError = validateCashAmount(actualCash, 'Uang aktual');
        setFieldError(nextFieldError);
        if (nextFieldError) {
            inputRef.current?.focus();
            return;
        }

        submitInProgressRef.current = true;
        setSubmitError('');
        try {
            const closedSession = await closeSession(session.id, {
                data: { actualClosingCash: normalizeMoney(actualCash) }
            });
            if (!closedSession || !mountedRef.current) return;

            onClose();
            onNotice({
                severity: 'success',
                message: `Sesi kas #${ closedSession.id } berhasil ditutup.`
            });
        } catch (error) {
            if (!mountedRef.current) return;

            const backendFieldError = getActualCashFieldError(error);
            if (backendFieldError) {
                setFieldError(backendFieldError);
                inputRef.current?.focus();
            } else if (error?.category === API_ERROR_CATEGORY.CONFLICT) {
                onClose();
                onNotice({
                    severity: 'warning',
                    message: 'Sesi sudah ditutup atau berubah di tempat lain. Memuat hasil server terbaru...'
                });
                try {
                    const latestSession = await getSessionDetails(session.id);
                    if (mountedRef.current && latestSession?.status === 'CLOSED') {
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
                    `${ error?.message || 'Sesi kas gagal ditutup.'
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
            onClose={ isClosing ? undefined : closeDialog }
            disableEscapeKeyDown={ isClosing }
            aria-labelledby="close-cash-session-title"
            maxWidth="xs"
            fullWidth
        >
            <form onSubmit={ submitClose } noValidate>
                <DialogTitle id="close-cash-session-title">
                    Tutup dan rekonsiliasi sesi
                </DialogTitle>
                <DialogContent className="space-y-4">
                    <p id="actual-cash-description" className="text-sm text-gray-600">
                        Hitung uang fisik di laci. Penutupan tidak dapat dibatalkan atau dikoreksi
                        setelah sesi ditutup.
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

                    { previewStatus === 'ready' && (
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
                                >
                                    Periksa status
                                </Button>
                            ) }
                        >
                            { submitError }
                        </Alert>
                    ) }

                    <BloomMoneyField
                        id="actual-closing-cash"
                        inputRef={ inputRef }
                        fullWidth
                        required
                        label="Uang aktual di laci"
                        value={ actualCash }
                        onValueChange={ changeActualCash }
                        onBlur={ () => setFieldError(validateCashAmount(actualCash, 'Uang aktual')) }
                        error={ Boolean(fieldError) }
                        helperText={ fieldError
                            || 'Masukkan hasil hitung fisik; selisih dihitung oleh server.' }
                        groupSeparator=","
                        decimalSeparator="."
                        currencySymbol="Rp"
                        slotProps={ {
                            htmlInput: {
                                'aria-describedby': 'actual-cash-description actual-closing-cash-helper-text'
                            }
                        } }
                        disabled={ isClosing || previewStatus !== 'ready' }
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={ closeDialog } disabled={ isClosing }>
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        color="error"
                        variant="contained"
                        disabled={ isClosing || previewStatus !== 'ready' }
                        aria-busy={ isClosing }
                    >
                        { isClosing ? 'Menutup...' : 'Konfirmasi tutup sesi' }
                    </Button>
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
    onNotice: PropTypes.func.isRequired
};
