import {
    useEffect,
    useRef,
    useState
} from 'react';
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper
} from '@mui/material';
import { BanknoteIcon } from 'lucide-react';

import { API_ERROR_CATEGORY } from '@api/index.js';
import BloomMoneyField from '@components/_ui/BloomMoneyField.jsx';
import { useCashSessionStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';

const MONEY_PATTERN = /^\d+(?:\.\d+)?$/;

const normalizeMoney = value => value.trim();

const validateOpeningCash = value => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return 'Modal awal wajib diisi.';
    }
    if (!MONEY_PATTERN.test(trimmedValue)) {
        return 'Masukkan nominal uang yang valid.';
    }

    const [integerPart, fractionalPart = ''] = normalizeMoney(trimmedValue).split('.');
    if (integerPart.length > 15) {
        return 'Maksimal 15 angka sebelum tanda desimal.';
    }
    if (fractionalPart.length > 4) {
        return 'Maksimal 4 angka di belakang tanda desimal.';
    }
    return '';
};

const formatRupiah = value => {
    const [rawInteger = '0', rawFraction = ''] = String(value ?? '0')
        .replace(',', '.')
        .split('.');
    const integer = rawInteger.replace(/^0+(?=\d)/, '') || '0';
    const fraction = rawFraction.replace(/0+$/, '');
    const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `Rp ${ groupedInteger }${ fraction ? `,${ fraction }` : '' }`;
};

const getOpeningFieldError = error => error?.validationErrors
    ?.find(detail => detail.field === 'openingCash')?.message || '';

export default function CurrentCashSession() {
    const currentSession = useCashSessionStore(state => state.currentSession);
    const currentStatus = useCashSessionStore(state => state.currentStatus);
    const currentError = useCashSessionStore(state => state.currentError);
    const isOpening = useCashSessionStore(state => state.isOpening);
    const getCurrentSession = useCashSessionStore(state => state.getCurrentSession);
    const openSession = useCashSessionStore(state => state.openSession);
    const clearOpeningError = useCashSessionStore(state => state.clearOpeningError);

    const [isDialogOpen, setDialogOpen] = useState(false);
    const [openingCash, setOpeningCash] = useState('');
    const [fieldError, setFieldError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [notice, setNotice] = useState(null);

    const statusFeedbackRef = useRef(null);
    const submitErrorRef = useRef(null);
    const inputRef = useRef(null);
    const submitInProgressRef = useRef(false);
    const mountedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        getCurrentSession().catch(() => undefined);
    }, [getCurrentSession]);

    useEffect(() => {
        if (currentStatus === 'error' || notice) {
            statusFeedbackRef.current?.focus();
        }
    }, [currentStatus, notice]);

    useEffect(() => {
        if (submitError) {
            submitErrorRef.current?.focus();
        }
    }, [submitError]);

    const refreshStatus = () => {
        setNotice(null);
        getCurrentSession().catch(() => undefined);
    };

    const showOpeningDialog = () => {
        setDialogOpen(true);
        setFieldError('');
        setSubmitError('');
        setNotice(null);
        clearOpeningError();
    };

    const closeOpeningDialog = () => {
        if (isOpening) return;
        setDialogOpen(false);
        setFieldError('');
        setSubmitError('');
        clearOpeningError();
    };

    const changeOpeningCash = value => {
        setOpeningCash(value);
        setFieldError('');
        setSubmitError('');
    };

    const submitOpening = async event => {
        event.preventDefault();
        if (submitInProgressRef.current || isOpening) return;

        const nextFieldError = validateOpeningCash(openingCash);
        setFieldError(nextFieldError);
        if (nextFieldError) {
            inputRef.current?.focus();
            return;
        }

        submitInProgressRef.current = true;
        setSubmitError('');
        try {
            const session = await openSession({
                data: { openingCash: normalizeMoney(openingCash) }
            });
            if (!session || !mountedRef.current) return;

            setDialogOpen(false);
            setOpeningCash('');
            setNotice({
                severity: 'success',
                message: `Sesi kas #${ session.id } berhasil dibuka.`
            });
        } catch (error) {
            if (!mountedRef.current) return;

            const backendFieldError = getOpeningFieldError(error);
            if (backendFieldError) {
                setFieldError(backendFieldError);
                inputRef.current?.focus();
            } else if (error?.category === API_ERROR_CATEGORY.CONFLICT) {
                setDialogOpen(false);
                setNotice({
                    severity: 'warning',
                    message: 'Sesi kas sudah dibuka di tempat lain. Status terbaru sedang dimuat.'
                });
                getCurrentSession().catch(() => undefined);
            } else {
                setSubmitError(
                    `${ error?.message || 'Sesi kas gagal dibuka.' } Periksa status sebelum mencoba lagi.`
                );
            }
        } finally {
            submitInProgressRef.current = false;
        }
    };

    const checkStatusAfterFailure = () => {
        setDialogOpen(false);
        setSubmitError('');
        setNotice({
            severity: 'info',
            message: 'Memeriksa apakah sesi kas berhasil dibuka...'
        });
        getCurrentSession().then(session => {
            if (!mountedRef.current) return;
            setNotice(session ? {
                severity: 'info',
                message: 'Status sesi terbaru sudah dimuat.'
            } : null);
        }).catch(() => undefined);
    };

    const isInitialLoading = currentStatus === 'idle'
        || (currentStatus === 'loading' && !currentSession);
    const hasVerifiedOpenSession = currentStatus === 'ready'
        && currentSession?.status === 'OPEN';
    const hasStaleSession = currentStatus !== 'ready' && currentSession;

    if (isInitialLoading) {
        return (
            <Paper
                className="cash-session-status flex items-center gap-3 p-4"
                role="status"
                aria-live="polite"
            >
                <CircularProgress size={ 22 } aria-hidden="true" />
                <span>Memuat status sesi kas...</span>
            </Paper>
        );
    }

    return (
        <section aria-labelledby="cash-session-title" className="space-y-3">
            { currentStatus === 'error' && (
                <Alert
                    severity="error"
                    action={ (
                        <Button color="inherit" size="small" onClick={ refreshStatus }>
                            Coba lagi
                        </Button>
                    ) }
                    tabIndex={ -1 }
                    ref={ statusFeedbackRef }
                >
                    { currentError?.message || 'Status sesi kas gagal dimuat.' }
                    { currentSession && ' Data sesi yang tampil mungkin sudah berubah.' }
                </Alert>
            ) }

            { notice && currentStatus !== 'error' && (
                <Alert
                    severity={ notice.severity }
                    role="status"
                    aria-live="polite"
                    tabIndex={ -1 }
                    ref={ statusFeedbackRef }
                >
                    { notice.message }
                </Alert>
            ) }

            <Paper className="cash-session-status p-4 md:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <BanknoteIcon className="mt-1 shrink-0" aria-hidden="true" />
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 id="cash-session-title" className="text-lg font-bold">
                                    Sesi kas saat ini
                                </h2>
                                { hasVerifiedOpenSession && (
                                    <Chip size="small" color="success" label="Terbuka" />
                                ) }
                                { hasStaleSession && (
                                    <Chip size="small" color="warning" label="Belum terverifikasi" />
                                ) }
                            </div>

                            { currentSession ? (
                                <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                                    <div>
                                        <dt className="text-gray-500">Modal awal</dt>
                                        <dd className="font-semibold">
                                            { formatRupiah(currentSession.openingCash) }
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Dibuka oleh</dt>
                                        <dd>{ currentSession.openedBy || '-' }</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Waktu buka</dt>
                                        <dd>{ formatDate(currentSession.openedAt, 'dd MMMM yyyy, HH:mm') }</dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="mt-1 text-sm text-gray-600">
                                    Belum ada sesi kas yang terbuka. Masukkan modal awal untuk mulai.
                                </p>
                            ) }
                        </div>
                    </div>

                    { currentStatus === 'ready' && !currentSession && (
                        <Button variant="contained" onClick={ showOpeningDialog }>
                            Buka sesi kas
                        </Button>
                    ) }
                    { currentStatus === 'loading' && currentSession && (
                        <span role="status" className="text-sm text-gray-600">
                            Memperbarui status...
                        </span>
                    ) }
                </div>
            </Paper>

            <Dialog
                open={ isDialogOpen }
                onClose={ isOpening ? undefined : closeOpeningDialog }
                disableEscapeKeyDown={ isOpening }
                aria-labelledby="open-cash-session-title"
                maxWidth="xs"
                fullWidth
            >
                <form onSubmit={ submitOpening } noValidate>
                    <DialogTitle id="open-cash-session-title">
                        Buka sesi kas
                    </DialogTitle>
                    <DialogContent className="space-y-4">
                        <p id="opening-cash-description" className="text-sm text-gray-600">
                            Catat uang tunai yang benar-benar ada di laci sebelum transaksi dimulai.
                        </p>

                        { submitError && (
                            <Alert
                                severity="error"
                                tabIndex={ -1 }
                                ref={ submitErrorRef }
                                action={ (
                                    <Button
                                        color="inherit"
                                        size="small"
                                        onClick={ checkStatusAfterFailure }
                                    >
                                        Periksa status
                                    </Button>
                                ) }
                            >
                                { submitError }
                            </Alert>
                        ) }

                        <BloomMoneyField
                            id="opening-cash"
                            inputRef={ inputRef }
                            autoFocus
                            fullWidth
                            required
                            label="Modal awal"
                            value={ openingCash }
                            onValueChange={ changeOpeningCash }
                            onBlur={ () => setFieldError(validateOpeningCash(openingCash)) }
                            error={ Boolean(fieldError) }
                            helperText={ fieldError
                                || 'Pemisah ribuan ditambahkan otomatis. Contoh: 500,000 atau 500,000.50.' }
                            groupSeparator=","
                            decimalSeparator="."
                            currencySymbol="Rp"
                            slotProps={ {
                                htmlInput: {
                                    'aria-describedby': 'opening-cash-description opening-cash-helper-text'
                                }
                            } }
                            disabled={ isOpening }
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={ closeOpeningDialog } disabled={ isOpening }>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={ isOpening }
                            aria-busy={ isOpening }
                        >
                            { isOpening ? 'Membuka...' : 'Buka sesi' }
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </section>
    );
}
