import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';

import { EXPENSE_TIMEOUT_MS } from '@api/expense.js';
import BloomMoneyField from '@components/_ui/BloomMoneyField.jsx';
import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import ExpenseRecord from '@components/expense/ExpenseRecord.jsx';
import useAuthStore from '@stores/modules/auth.js';
import useCashSessionStore from '@stores/modules/cash-session.js';
import useExpenseStore, { canUseExpense, hasExpenseSession, isExpenseLocked } from '@stores/modules/expense.js';
import { EXPENSE_CATEGORIES, expenseRequest, hasExpectedExpenseSession, validateExpense } from '@utils/expense-utils.js';

const messages = {
    pending: 'Memeriksa sesi dan menyimpan pengeluaran. Tunggu hasilnya sebelum mencatat lagi.',
    uncertain: 'Hasil pengeluaran belum pasti. Pulihkan pengeluaran yang sama; jangan membuat pengeluaran baru.',
    keyConflict: 'Identitas pengeluaran ditolak server. Minta administrator memeriksa transaksi ini sebelum mencatat lagi.',
    unboundSession: 'Pemulihan lama belum menyimpan sesi kas yang dikonfirmasi. Minta administrator mencocokkan pengeluaran dengan catatan server sebelum melanjutkan. Jangan membuat pengeluaran baru.',
    sessionConflict: 'Sesi kas sudah berubah atau ditutup. Input tetap tersimpan. Periksa sesi lalu konfirmasi kembali.',
    sessionError: 'Sesi kas gagal diperiksa. Pengeluaran belum dikirim. Periksa sesi lalu coba kembali.',
    rejected: 'Pengeluaran ditolak. Periksa nominal, kategori, alasan / catatan, dan izin akun sebelum konfirmasi kembali.',
    storageUnavailable: 'Pemulihan tidak dapat disimpan di tab ini. Izinkan penyimpanan browser sebelum mengirim pengeluaran.'
};

export default function ExpenseCreate() {
    const state = useExpenseStore();
    const auth = useAuthStore();
    const cash = useCashSessionStore();
    const [confirmation, setConfirmation] = useState(null);
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
    const checkSession = () => cash.getCurrentSession({ timeout: EXPENSE_TIMEOUT_MS }).catch(() => {});
    useEffect(() => { state.select(); }, [ownerAccountId, locked, state.select]);
    useEffect(() => { setConfirmation(null); }, [ownerAccountId]);
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
    return (
        <Stack spacing={ 3 } sx={ { maxWidth: 800, mx: 'auto', width: '100%' } }>
            <Typography component="h1" variant="h4">Catat pengeluaran</Typography>
            <Button component={ Link } to="/expenses" sx={ { alignSelf: 'flex-start' } }>Riwayat pengeluaran</Button>
            <Card><CardContent><Stack spacing={ 2 }>
                { result ? <>
                    <Alert severity={ result.voided ? 'warning' : 'success' } role="status" tabIndex={ -1 } ref={ feedbackRef }>
                        { result.voided ? 'Pengeluaran yang dipulihkan sudah dibatalkan.' : 'Pengeluaran tercatat.' }
                    </Alert>
                    <ExpenseRecord record={ result }/>
                    <Typography variant="body2">Waktu mengikuti zona waktu perangkat. Buka riwayat untuk memuat data terbaru.</Typography>
                    <Button disabled={ pending } onClick={ () => { nextFocus.current = true; state.next(); } }>Catat pengeluaran berikutnya</Button>
                </> : <>
                    { messages[outcome] && <Alert severity={ pending ? 'info' : 'warning' }
                                                  role={ pending ? 'status' : 'alert' }
                                                  tabIndex={ -1 }
                                                  ref={ feedbackRef }>{ messages[outcome] }</Alert> }
                    { attempt && <>
                        <Typography variant="body2" sx={ { overflowWrap: 'anywhere' } }>Referensi pemulihan: { attempt.key }</Typography>
                        { !unboundSession && <Typography>Sesi yang dikonfirmasi: #{ attempt.request.expectedCashSessionId }. Jika sudah tersimpan, server mengembalikan catatan semula. Jika belum, sesi tersebut harus masih terbuka. Pemulihan tidak berpindah ke sesi lain.</Typography> }
                        { !unboundSession && outcome !== 'keyConflict' && <Button disabled={ pending } onClick={ () => state.submit() }>Pulihkan pengeluaran yang sama</Button> }
                    </> }
                    <Stack component="form" spacing={ 2 } onSubmit={ review } noValidate aria-busy={ pending }>
                        <Alert severity={ sessionReady ? 'info' : 'warning' } role="status">
                            { cash.currentStatus === 'loading' ? 'Memeriksa sesi kas...'
                                : cash.currentStatus === 'error' ? 'Sesi kas gagal diperiksa.'
                                    : sessionReady ? `Sesi kas #${ cash.currentSession.id } terbuka. Pengeluaran mengurangi uang laci.`
                                        : 'Pengeluaran baru memerlukan sesi kas terbuka.' }
                            <Button disabled={ pending || cash.currentStatus === 'loading' } onClick={ checkSession }>Periksa sesi kas</Button>
                            { !sessionReady && <Button component={ Link } to="/cashier">Buka kasir</Button> }
                        </Alert>
                        <Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 }>
                            <BloomMoneyField label="Nominal pengeluaran"
                                             value={ draft.amount }
                                             onValueChange={ value => edit('amount', value) }
                                             groupSeparator="."
                                             decimalSeparator=","
                                             inputRef={ amountRef }
                                             fullWidth
                                             required
                                             disabled={ locked || !!confirmation }
                                             error={ !!errors.amount }
                                             helperText={ errors.amount || 'Gunakan koma untuk desimal, maksimal 4 angka.' }/>
                            <TextField select
                                       label="Kategori"
                                       value={ draft.category }
                                       onChange={ event => edit('category', event.target.value) }
                                       inputRef={ categoryRef }
                                       fullWidth
                                       required
                                       disabled={ locked || !!confirmation }
                                       error={ !!errors.category }
                                       helperText={ errors.category }>
                                { Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => <MenuItem key={ value } value={ value }>{ label }</MenuItem>) }
                            </TextField>
                        </Stack>
                        <TextField label="Alasan / catatan"
                                   value={ draft.description }
                                   onChange={ event => edit('description', event.target.value) }
                                   inputRef={ descriptionRef }
                                   multiline
                                   minRows={ 2 }
                                   required={ draft.category === 'OTHER' }
                                   disabled={ locked || !!confirmation }
                                   error={ !!errors.description }
                                   helperText={ errors.description || 'Maksimal 255 karakter. Wajib untuk kategori Lainnya; opsional untuk kategori lain.' }
                                   slotProps={ { htmlInput: { maxLength: 255 } } }/>
                        <Button type="submit" variant="contained" disabled={ locked || !sessionReady || !!confirmation }>Tinjau pengeluaran</Button>
                    </Stack>
                </> }
            </Stack></CardContent></Card>
            <Dialog open={ !!confirmation }
                    onClose={ () => setConfirmation(null) }
                    fullWidth
                    maxWidth="sm"
                    aria-labelledby="expense-confirm-title"
                    aria-describedby="expense-confirm-body">
                <DialogTitle id="expense-confirm-title">Konfirmasi pengeluaran</DialogTitle>
                <DialogContent id="expense-confirm-body" sx={ { overflowWrap: 'anywhere' } }>
                    <p>{ formatRupiah(confirmation?.request.amount) } · { EXPENSE_CATEGORIES[confirmation?.request.category] }</p>
                    <p>{ confirmation?.request.description || 'Tanpa catatan' }</p>
                    <p>Sesi yang dikonfirmasi: #{ confirmation?.request.expectedCashSessionId }. Pastikan uang sudah dikeluarkan. Server hanya mencatat pengeluaran jika sesi ini masih terbuka.</p>
                </DialogContent>
                <DialogActions>
                    <Button autoFocus onClick={ () => setConfirmation(null) }>Kembali</Button>
                    <Button disabled={ locked || !sessionReady }
                            onClick={ () => {
                                const intent = confirmation;
                                setConfirmation(null);
                                state.submit(intent);
                            } }>Catat pengeluaran</Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
