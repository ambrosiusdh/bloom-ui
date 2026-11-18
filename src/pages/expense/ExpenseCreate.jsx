import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { enqueueSnackbar } from 'notistack';

import { EXPENSE_TIMEOUT_MS } from '@api/expense.js';
import BloomMoneyField from '@components/_ui/BloomMoneyField.jsx';
import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import ExpenseRecord from '@components/expense/ExpenseRecord.jsx';
import useAuthStore from '@stores/modules/auth.js';
import useBreadcrumbStore from '@stores/modules/breadcrumb.js';
import useCashSessionStore from '@stores/modules/cash-session.js';
import useExpenseStore, { canUseExpense, hasExpenseSession, isExpenseLocked } from '@stores/modules/expense.js';
import { EXPENSE_CATEGORIES, expenseRequest, hasExpectedExpenseSession, validateExpense } from '@utils/expense-utils.js';

const messages = {
    pending: 'Permintaan dikunci. Sesi yang sama sedang diperiksa sebelum pengeluaran disimpan.',
    uncertain: 'Hasil pengeluaran belum pasti. Pulihkan pengeluaran yang sama; jangan membuat pengeluaran baru.',
    keyConflict: 'Identitas pengeluaran ditolak server. Minta administrator memeriksa transaksi ini sebelum mencatat lagi.',
    unboundSession: 'Pemulihan lama belum menyimpan sesi kas yang dikonfirmasi. Minta administrator mencocokkan pengeluaran dengan catatan server sebelum melanjutkan. Jangan membuat pengeluaran baru.',
    sessionConflict: 'Sesi kas sudah berubah atau ditutup. Tidak ada pengeluaran yang dikonfirmasi. Input tetap tersimpan untuk ditinjau kembali.',
    sessionError: 'Sesi kas gagal diperiksa. Pengeluaran belum dikirim dan input tetap tersimpan.',
    rejected: 'Server menolak permintaan. Tidak ada pengeluaran yang dikonfirmasi; periksa nominal, kategori, alasan / catatan, dan izin akun.',
    storageUnavailable: 'Pemulihan tidak dapat disimpan di tab ini. Permintaan belum dikirim. Izinkan penyimpanan browser sebelum mencoba lagi.'
};

export default function ExpenseCreate() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const state = useExpenseStore();
    const auth = useAuthStore();
    const cash = useCashSessionStore();
    const [confirmation, setConfirmation] = useState(null);
    const [submittedRequest, setSubmittedRequest] = useState(null);
    const [errors, setErrors] = useState({});
    const amountRef = useRef(null);
    const categoryRef = useRef(null);
    const descriptionRef = useRef(null);
    const feedbackRef = useRef(null);
    const nextFocus = useRef(false);
    const ownerAccountId = auth.authStatus === 'authenticated' ? auth.currentUser?.accountId : null;
    const { draft, attempt, result, pending } = state;
    const unboundSession = !!attempt && !hasExpectedExpenseSession(attempt.request);
    const outcome = unboundSession ? 'unboundSession' : state.outcome;
    const accessible = canUseExpense(state);
    const locked = isExpenseLocked(state);
    const sessionReady = hasExpenseSession();
    const lockedRequest = attempt?.request || submittedRequest;
    const checkSession = async () => {
        try {
            const currentSession = await cash.getCurrentSession({ timeout: EXPENSE_TIMEOUT_MS });

            if (currentSession?.status === 'OPEN') {
                enqueueSnackbar(`Sesi kas #${ currentSession.id } masih terbuka.`, {
                    variant: 'success'
                });
                return;
            }

            if (currentSession) {
                enqueueSnackbar(`Sesi kas #${ currentSession.id } sudah ditutup.`, {
                    variant: 'warning'
                });
                return;
            }

            enqueueSnackbar('Belum ada sesi kas terbuka.', {
                variant: 'warning'
            });
        } catch {
            enqueueSnackbar('Pemeriksaan sesi kas gagal. Coba lagi.', {
                variant: 'error'
            });
        }
    };
    useEffect(() => setBreadcrumbs([
        {
            to: '/expenses',
            label: 'Pengeluaran'
        },
        'Catat pengeluaran'
    ]), [setBreadcrumbs]);
    useEffect(() => { state.select(); }, [ownerAccountId, locked, state.select]);
    useEffect(() => {
        setConfirmation(null);
        setSubmittedRequest(null);
    }, [ownerAccountId]);
    useEffect(() => {
        if (accessible && !attempt && !result) cash.getCurrentSession({ timeout: EXPENSE_TIMEOUT_MS }).catch(() => {});
    }, [accessible, attempt, result, cash.getCurrentSession]);
    useEffect(() => {
        if (!pending && outcome !== 'editing') feedbackRef.current?.focus();
        if (outcome === 'editing' && nextFocus.current) {
            amountRef.current?.focus();
            nextFocus.current = false;
        }
    }, [pending, outcome]);
    useEffect(() => {
        if (!pending) {
            setSubmittedRequest(null);
        }
    }, [pending]);

    if (!ownerAccountId) return <Typography role="status">Memverifikasi akun...</Typography>;
    if (!accessible) return <Alert severity="warning">Pengeluaran sebelumnya dikunci untuk identitas akun asal. Pemulihan lama tanpa identitas akun tetap harus direkonsiliasi manual oleh administrator.</Alert>;
    const review = event => {
        event.preventDefault();
        if (locked || !sessionReady) return;
        const validation = validateExpense(draft);
        setErrors(validation);
        const field = Object.keys(validation).find(key => validation[key]);
        if (field) {
            ({ amount: amountRef, category: categoryRef, description: descriptionRef })[field].current?.focus();
            return;
        }
        setConfirmation({
            ownerAccountId,
            request: expenseRequest(draft, cash.currentSession.id)
        });
    };
    const edit = (field, value) => {
        state.edit({ ...draft, [field]: value });
        setErrors(previous => ({ ...previous, [field]: '' }));
    };
    const outcomeSeverity = ['keyConflict', 'sessionConflict', 'sessionError', 'rejected', 'storageUnavailable']
        .includes(outcome)
        ? 'error'
        : 'warning';

    return (
        <Stack spacing={ 3 } sx={ { maxWidth: 960, mx: 'auto', width: '100%' } }>
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Typography component="h1" variant="h4">Catat pengeluaran</Typography>
                    <Typography sx={ { mt: 1, color: 'text.secondary' } }>
                        Catat biaya yang benar-benar dikeluarkan dari satu sesi kas aktif.
                    </Typography>
                </div>
                <Button component={ Link } to="/expenses" sx={ { minHeight: 44 } }>
                    Kembali ke riwayat
                </Button>
            </header>

            { result ? (
                <Stack spacing={ 2 }>
                    <Alert
                        severity={ result.voided ? 'warning' : 'success' }
                        role="status"
                        tabIndex={ -1 }
                        ref={ feedbackRef }
                    >
                        <strong>
                            { result.voided
                                ? 'Pengeluaran yang dipulihkan sudah dibatalkan.'
                                : 'Pengeluaran tercatat.' }
                        </strong>{ ' ' }
                        Hasil di bawah berasal dari catatan server untuk sesi kas #{ result.cashSessionId }.
                    </Alert>
                    <Card component="section" aria-label="Hasil pengeluaran dari server">
                        <CardContent>
                            <ExpenseRecord record={ result }/>
                        </CardContent>
                    </Card>
                    <div className="flex flex-wrap gap-2">
                        <Button component={ Link } to="/expenses" sx={ { minHeight: 44 } }>
                            Lihat di riwayat
                        </Button>
                        <Button
                            variant="contained"
                            disabled={ pending }
                            sx={ { minHeight: 44 } }
                            onClick={ () => {
                                nextFocus.current = true;
                                state.next();
                            } }
                        >
                            Catat pengeluaran berikutnya
                        </Button>
                    </div>
                </Stack>
            ) : (
                <>
                    { messages[outcome] && (
                        <Alert
                            severity={ pending ? 'info' : outcomeSeverity }
                            role={ pending ? 'status' : 'alert' }
                            tabIndex={ -1 }
                            ref={ feedbackRef }
                        >
                            { messages[outcome] }
                        </Alert>
                    ) }

                    { lockedRequest && (
                        <Card variant="outlined" component="section" aria-labelledby="expense-locked-request-title">
                            <CardContent>
                                <Typography component="h2" variant="h6" id="expense-locked-request-title">
                                    { pending ? 'Permintaan sedang diproses' : 'Permintaan pemulihan yang dikunci' }
                                </Typography>
                                <Typography sx={ { mt: 1, color: 'text.secondary' } }>
                                    Nominal, kategori, catatan, sesi, kunci idempotensi, dan akun asal tidak dapat diganti.
                                </Typography>
                                <dl className="mt-4 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-xs font-medium text-gray-600">Nominal</dt>
                                        <dd className="mt-1 font-semibold">{ formatRupiah(lockedRequest.amount) }</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-600">Kategori</dt>
                                        <dd className="mt-1">{ EXPENSE_CATEGORIES[lockedRequest.category] || lockedRequest.category }</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-600">Sesi yang dikonfirmasi</dt>
                                        <dd className="mt-1">#{ lockedRequest.expectedCashSessionId }</dd>
                                    </div>
                                    { attempt && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-600">Referensi pemulihan</dt>
                                            <dd className="mt-1 break-all">{ attempt.key }</dd>
                                        </div>
                                    ) }
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs font-medium text-gray-600">Alasan / catatan</dt>
                                        <dd className="mt-1">{ lockedRequest.description || 'Tanpa catatan' }</dd>
                                    </div>
                                </dl>
                                { attempt && !unboundSession && outcome !== 'keyConflict' && (
                                    <Button
                                        variant="contained"
                                        disabled={ pending }
                                        sx={ { mt: 2, minHeight: 44 } }
                                        onClick={ () => state.submit() }
                                    >
                                        Pulihkan pengeluaran yang sama
                                    </Button>
                                ) }
                            </CardContent>
                        </Card>
                    ) }

                    <Card component="section" aria-labelledby="expense-form-title">
                        <CardContent>
                            <Stack
                                component="form"
                                spacing={ 3 }
                                onSubmit={ review }
                                noValidate
                                aria-busy={ pending }
                            >
                                <div>
                                    <Typography component="h2" variant="h6" id="expense-form-title">
                                        Rincian pengeluaran
                                    </Typography>
                                    <Typography sx={ { mt: 0.5, color: 'text.secondary' } }>
                                        Server mengikat catatan ke sesi yang dikonfirmasi dan mengelola dampak kasnya.
                                    </Typography>
                                </div>
                                <Alert severity={ sessionReady ? 'info' : 'warning' } role="status">
                                    <Stack spacing={ 1 }>
                                        <span>
                                            { cash.currentStatus === 'loading' ? 'Memeriksa sesi kas...'
                                                : cash.currentStatus === 'error' ? 'Sesi kas gagal diperiksa.'
                                                    : sessionReady
                                                        ? `Sesi kas #${ cash.currentSession.id } terbuka dan akan menjadi sesi pengeluaran ini.`
                                                        : 'Pengeluaran baru memerlukan sesi kas terbuka.' }
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                disabled={ pending || cash.currentStatus === 'loading' }
                                                onClick={ checkSession }
                                            >
                                                Periksa sesi kas
                                            </Button>
                                            { !sessionReady && (
                                                <Button component={ Link } to="/cashier">Buka kasir</Button>
                                            ) }
                                        </div>
                                    </Stack>
                                </Alert>
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    <BloomMoneyField
                                        label="Nominal pengeluaran"
                                        value={ draft.amount }
                                        onValueChange={ value => edit('amount', value) }
                                        groupSeparator="."
                                        decimalSeparator=","
                                        inputRef={ amountRef }
                                        fullWidth
                                        required
                                        disabled={ locked || !!confirmation }
                                        error={ !!errors.amount }
                                        helperText={ errors.amount || 'Gunakan koma untuk desimal, maksimal 4 angka.' }
                                    />
                                    <TextField
                                        select
                                        label="Kategori"
                                        value={ draft.category }
                                        onChange={ event => edit('category', event.target.value) }
                                        inputRef={ categoryRef }
                                        fullWidth
                                        required
                                        disabled={ locked || !!confirmation }
                                        error={ !!errors.category }
                                        helperText={ errors.category || 'Lainnya mewajibkan alasan / catatan.' }
                                    >
                                        { Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => (
                                            <MenuItem key={ value } value={ value }>{ label }</MenuItem>
                                        )) }
                                    </TextField>
                                </div>
                                <TextField
                                    label="Alasan / catatan"
                                    value={ draft.description }
                                    onChange={ event => edit('description', event.target.value) }
                                    inputRef={ descriptionRef }
                                    multiline
                                    minRows={ 3 }
                                    required={ draft.category === 'OTHER' }
                                    disabled={ locked || !!confirmation }
                                    error={ !!errors.description }
                                    helperText={ errors.description
                                        || `${ draft.description.length }/255 karakter · Wajib untuk Lainnya; opsional untuk kategori lain.` }
                                    slotProps={ {
                                        htmlInput: { maxLength: 255 }
                                    } }
                                />
                                <div className="flex flex-wrap justify-end gap-2">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={ locked || !sessionReady || !!confirmation }
                                        sx={ { minHeight: 44 } }
                                    >
                                        Tinjau pengeluaran
                                    </Button>
                                </div>
                            </Stack>
                        </CardContent>
                    </Card>
                </>
            ) }

            <Dialog
                open={ !!confirmation }
                onClose={ () => setConfirmation(null) }
                fullWidth
                maxWidth="sm"
                aria-labelledby="expense-confirm-title"
                aria-describedby="expense-confirm-body"
            >
                <DialogTitle id="expense-confirm-title">Konfirmasi pengeluaran</DialogTitle>
                <DialogContent id="expense-confirm-body" sx={ { overflowWrap: 'anywhere' } }>
                    <Typography sx={ { color: 'text.secondary' } }>
                        Pastikan uang sudah dikeluarkan dari laci yang benar.
                    </Typography>
                    <div className="my-4 rounded-lg bg-gray-50 p-4">
                        <span className="text-sm text-gray-600">Nominal</span>
                        <Typography variant="h5" sx={ { mt: 0.5 } }>
                            { formatRupiah(confirmation?.request.amount) }
                        </Typography>
                    </div>
                    <dl className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs font-medium text-gray-600">Kategori</dt>
                            <dd className="mt-1">{ EXPENSE_CATEGORIES[confirmation?.request.category] }</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-gray-600">Sesi yang dikonfirmasi</dt>
                            <dd className="mt-1">#{ confirmation?.request.expectedCashSessionId }</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-xs font-medium text-gray-600">Alasan / catatan</dt>
                            <dd className="mt-1">{ confirmation?.request.description || 'Tanpa catatan' }</dd>
                        </div>
                    </dl>
                    <Alert severity="warning" sx={ { mt: 3 } }>
                        Sesi tidak akan diganti otomatis. Server hanya mencatat jika sesi ini tetap terbuka;
                        jika berubah, input tetap disimpan untuk ditinjau lagi.
                    </Alert>
                </DialogContent>
                <DialogActions sx={ {
                    flexWrap: 'wrap',
                    gap: 1
                } }>
                    <Button autoFocus onClick={ () => setConfirmation(null) }>Kembali</Button>
                    <Button
                        variant="contained"
                        disabled={ locked || !sessionReady }
                        onClick={ () => {
                            const intent = confirmation;
                            setSubmittedRequest(intent.request);
                            setConfirmation(null);
                            state.submit(intent);
                        } }
                    >
                        Catat pengeluaran
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
