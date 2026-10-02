import {
    useEffect,
    useRef,
    useState
} from 'react';
import { Link } from 'react-router-dom';
import {
    Alert,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import PropTypes from 'prop-types';

import { SUPPLIER_PAYMENT_TIMEOUT_MS } from '@api/supplier-payment.js';
import BloomMoneyField from '@components/_ui/BloomMoneyField.jsx';
import {
    formatRupiah,
    getMoneySign
} from '@components/cash-session/cash-session-money.js';
import useAuthStore from '@stores/modules/auth.js';
import useCashSessionStore from '@stores/modules/cash-session.js';
import useSupplierPaymentStore, {
    canUsePayment,
    isPaymentLocked
} from '@stores/modules/supplier-payment.js';
import {
    paymentRequest,
    SUPPLIER_PAYMENT_METHODS,
    validatePayment
} from '@utils/supplier-payment-utils.js';
import { formatDate } from '@utils/date-utils.js';

const messages = {
    checkingSession: 'Memastikan sesi kas yang dipilih masih terbuka sebelum mengirim pembayaran.',
    pending: 'Menyimpan pembayaran. Tunggu hasilnya sebelum membayar lagi.',
    uncertain: 'Hasil pembayaran belum pasti. Periksa koneksi, lalu pulihkan pembayaran yang sama. Jangan membuat pembayaran baru.',
    cashRecoveryBlocked: 'Pembayaran tunai belum dipulihkan. Sesi kas asal tidak tersedia atau bukan lagi sesi aktif. Permintaan tetap dikunci ke sesi asal dan tidak akan dialihkan ke sesi lain.',
    keyConflict: 'Identitas pembayaran ditolak server. Minta petugas memeriksa transaksi ini sebelum membayar lagi.',
    conflict: 'Tidak ada pembayaran yang dikonfirmasi server. Nominal mungkin melebihi sisa tagihan atau penerimaan sudah berubah. Periksa nilai terbaru, lalu konfirmasi kembali.',
    sessionConflict: 'Tidak ada pembayaran yang dikonfirmasi server. Sesi kas mungkin sudah ditutup, berubah, atau waktu pembayaran berada di luar sesi. Periksa sesi dan tanggal/jam perangkat, lalu konfirmasi kembali.',
    clockInvalid: 'Tidak ada pembayaran yang dikonfirmasi server. Waktu pembayaran ditolak. Sinkronkan tanggal/jam perangkat, lalu buka konfirmasi kembali.',
    rejected: 'Tidak ada pembayaran yang dikonfirmasi server. Periksa nominal, metode, waktu, referensi, catatan, dan izin Anda sebelum mencoba kembali.',
    storageUnavailable: 'Pemulihan pembayaran tidak dapat disimpan di tab ini. Izinkan penyimpanan browser sebelum mengirim pembayaran.'
};

export default function SupplierPayment({ receipt }) {
    const state = useSupplierPaymentStore();
    const auth = useAuthStore();
    const cash = useCashSessionStore();
    const [confirmation, setConfirmation] = useState(null);
    const amountRef = useRef(null);
    const feedbackRef = useRef(null);
    const focusNextRef = useRef(false);
    const headingRef = useRef(null);
    const {
        code,
        draft,
        attempt,
        result,
        pending,
        checkingCashSession,
        outcome,
        refreshStatus
    } = state;
    const current = code === receipt.code;
    const authAccountId = auth.authStatus === 'authenticated' ? auth.currentUser?.accountId : null;
    const accessible = canUsePayment(state, authAccountId);
    const locked = isPaymentLocked(state);
    const payable = receipt.status === 'POSTED' && ['UNPAID', 'PARTIALLY_PAID'].includes(receipt.paymentStatus)
        && getMoneySign(receipt.outstandingAmount) > 0;
    const blocked = locked || !current || !accessible;
    const cashBlocked = (confirmation?.request.paymentMethod || draft.paymentMethod) === 'CASH'
        && (cash.currentStatus !== 'ready' || !cash.drawerActionsEnabled);
    const checkSession = () => cash.getCurrentSession({ timeout: SUPPLIER_PAYMENT_TIMEOUT_MS }).catch(() => {
    });

    useEffect(() => {
        state.select(receipt.code);
    }, [receipt.code, code, locked, authAccountId, state.select]);
    useEffect(() => {
        setConfirmation(null);
    }, [authAccountId]);
    useEffect(() => {
        if (accessible && current && draft.paymentMethod === 'CASH' && !attempt && !result) {
            cash.getCurrentSession({ timeout: SUPPLIER_PAYMENT_TIMEOUT_MS }).catch(() => {
            });
        }
    }, [accessible, current, draft.paymentMethod, attempt, result, cash.getCurrentSession]);
    useEffect(() => {
        if (accessible && current && result && refreshStatus === 'idle') state.refresh();
    }, [accessible, current, result, refreshStatus, state.refresh]);
    useEffect(() => {
        if (!pending && outcome !== 'editing') feedbackRef.current?.focus();
        if (outcome === 'editing' && focusNextRef.current) {
            (amountRef.current || headingRef.current)?.focus();
            focusNextRef.current = false;
        }
    }, [pending, outcome]);

    if (!authAccountId) return <Typography role="status">Memverifikasi akun sebelum membuka pembayaran...</Typography>;
    if (!accessible && (locked || code || state.ownerAccountId || state.owner)) return (
        <Alert severity="warning">Pembayaran sebelumnya dikunci untuk akun asal. Masuk dengan akun yang memulainya untuk
            melanjutkan.
            { !state.ownerAccountId && ' Pemulihan lama belum memiliki identitas akun tetap; minta administrator memeriksa transaksi sebelum melanjutkan.' }
        </Alert>
    );
    if (!accessible || (!current && !locked)) return <Typography role="status">Menyiapkan pembayaran...</Typography>;
    if (!current) return (
        <Alert severity="info">Selesaikan pembayaran sebelumnya terlebih dahulu.
            <Button component={ Link } to={ `/goods-receipts/${ encodeURIComponent(code) }` }>Buka
                penerimaan { code }</Button>
        </Alert>
    );
    const review = event => {
        event.preventDefault();
        if (blocked || cashBlocked || !payable) return;
        const error = validatePayment(draft);
        useSupplierPaymentStore.setState({ error });
        if (error) {
            amountRef.current?.focus();
            return;
        }
        setConfirmation({
            code,
            ownerAccountId: state.ownerAccountId,
            request: paymentRequest(draft, new Date().toISOString()),
            expectedCashSessionId: draft.paymentMethod === 'CASH' ? cash.currentSession?.id : null,
            supplierName: receipt.supplierName,
            outstandingAmount: receipt.outstandingAmount
        });
    };
    const edit = (field, value) => state.edit({
        ...draft,
        [field]: value
    });

    return (
        <Card className="print:hidden">
            <CardContent>
                <Stack spacing={ 2 }>
                    <Typography component="h3" variant="h6" tabIndex={ -1 } ref={ headingRef }>
                        Bayar pemasok untuk penerimaan ini
                    </Typography>
                    { result ? (
                        <Alert severity={ result.voided ? 'warning' : 'success' }
                               role="status"
                               tabIndex={ -1 }
                               ref={ feedbackRef }>
                            { result.voided ? 'Pembayaran yang dipulihkan sudah dibatalkan.' : 'Pembayaran tercatat.' }
                        </Alert>
                    ) : messages[outcome] && (
                        <Alert severity={ pending ? 'info' : 'warning' }
                               role={ pending ? 'status' : 'alert' }
                               tabIndex={ -1 }
                               ref={ feedbackRef }>
                            { messages[outcome] }
                        </Alert>
                    ) }
                    { result && (
                        <Stack spacing={ 0.5 } aria-label="Catatan pembayaran dari server">
                            <Typography variant="subtitle2">Catatan pembayaran dari server</Typography>
                            <Typography variant="body2">Pembayaran #{ result.id } · Penerimaan { result.receiptCode }</Typography>
                            <Typography variant="body2">{ formatRupiah(result.amount) } · { SUPPLIER_PAYMENT_METHODS[result.paymentMethod] || result.paymentMethod }</Typography>
                            <Typography variant="body2">Waktu pembayaran: { formatDate(result.paidAt) || 'Tidak tersedia' }</Typography>
                            <Typography variant="body2">Referensi: { result.reference || 'Tidak ada' }</Typography>
                            <Typography variant="body2">Catatan: { result.note || 'Tidak ada' }</Typography>
                            <Typography variant="body2">Pelaku: { result.actor || 'Tidak tersedia' }</Typography>
                            { result.cashSessionId && <Typography variant="body2">Sesi kas #{ result.cashSessionId }</Typography> }
                        </Stack>
                    ) }
                    { attempt && (
                        <Stack spacing={ 0.5 } sx={ { overflowWrap: 'anywhere' } } aria-label="Permintaan pembayaran yang dikunci">
                            <Typography variant="subtitle2">Permintaan yang dikunci untuk pemulihan</Typography>
                            <Typography variant="body2">Penerimaan { attempt.code } · { formatRupiah(attempt.request.amount) } · { SUPPLIER_PAYMENT_METHODS[attempt.request.paymentMethod] || attempt.request.paymentMethod }</Typography>
                            <Typography variant="body2">Waktu pembayaran: { formatDate(attempt.request.paidAt) || 'Tidak tersedia' }</Typography>
                            { attempt.expectedCashSessionId && <Typography variant="body2">Sesi kas asal #{ attempt.expectedCashSessionId }</Typography> }
                            <Typography variant="body2">Referensi pemulihan: { attempt.key }</Typography>
                        </Stack>
                    ) }
                    { refreshStatus === 'loading' &&
                        <Typography role="status">Memuat ulang nilai dan status penerimaan...</Typography> }
                    { refreshStatus === 'error' && (
                        <Alert severity="warning">Nilai penerimaan belum berhasil diperbarui. Angka di atas masih data
                            sebelumnya.
                            <Button onClick={ state.refresh }>Muat ulang nilai penerimaan</Button>
                        </Alert>
                    ) }
                    { result && refreshStatus === 'ready' && (
                        <Stack spacing={ 0.5 } aria-label="Nilai penerimaan terbaru dari server">
                            <Typography variant="subtitle2">Nilai penerimaan terbaru dari server</Typography>
                            <Typography variant="body2">Total dibayar: { formatRupiah(receipt.paidAmount) }</Typography>
                            <Typography variant="body2">Sisa utang: { formatRupiah(receipt.outstandingAmount) }</Typography>
                            <Typography variant="body2">Status pembayaran: { receipt.paymentStatus }</Typography>
                        </Stack>
                    ) }
                    { result && refreshStatus === 'ready' && <Button disabled={ pending }
                                                                     onClick={ () => {
                                                                         focusNextRef.current = true;
                                                                         state.next();
                                                                     } }>{ payable ? 'Catat pembayaran berikutnya' : 'Selesai' }</Button> }
                    { attempt && outcome !== 'keyConflict' &&
                        <Button disabled={ pending || checkingCashSession } onClick={ () => state.submit() }>
                            { attempt.request.paymentMethod === 'CASH'
                                ? 'Periksa sesi asal dan pulihkan pembayaran yang sama'
                                : 'Pulihkan pembayaran yang sama' }
                        </Button> }
                    { !attempt && !result && !payable &&
                        <Alert severity="info">Penerimaan ini tidak memiliki tagihan yang dapat dibayar.</Alert> }
                    { !result && (payable || attempt) && (
                        <Stack component="form" spacing={ 2 } onSubmit={ review } aria-busy={ pending }>
                            <Stack direction={ { xs: 'column', lg: 'row' } } spacing={ 2 }>
                                <BloomMoneyField label="Nominal pembayaran"
                                                 groupSeparator="."
                                                 decimalSeparator=","
                                                 value={ draft.amount }
                                                 onValueChange={ value => edit('amount', value) }
                                                 inputRef={ amountRef }
                                                 disabled={ blocked }
                                                 error={ !!state.error }
                                                 helperText={ state.error || 'Bayar sebagian atau seluruh sisa tagihan. Gunakan koma untuk desimal (maksimal 4 angka).' }
                                                 fullWidth/>
                                <TextField select
                                           label="Metode pembayaran"
                                           value={ draft.paymentMethod }
                                           onChange={ event => edit('paymentMethod', event.target.value) }
                                           disabled={ blocked }
                                           fullWidth>
                                    { Object.entries(SUPPLIER_PAYMENT_METHODS).map(([value, label]) => <MenuItem key={ value }
                                                                                                value={ value }>{ label }</MenuItem>) }
                                </TextField>
                            </Stack>
                            <Button disabled={ blocked }
                                    onClick={ () => edit('amount', String(receipt.outstandingAmount)) }>Isi seluruh sisa
                                tagihan: { formatRupiah(receipt.outstandingAmount) }</Button>
                            { draft.paymentMethod === 'CASH' ? (
                                <Alert severity={ cashBlocked ? 'warning' : 'info' }>
                                    { attempt?.expectedCashSessionId
                                        ? `Pemulihan ini tetap terikat ke sesi kas asal #${ attempt.expectedCashSessionId }; sesi baru tidak akan menggantikannya.`
                                        : cash.currentStatus === 'loading' ? 'Memeriksa sesi kas...'
                                        : cash.currentStatus === 'error' ? 'Sesi kas gagal diperiksa.'
                                            : cashBlocked ? 'Pembayaran tunai memerlukan sesi kas terbuka.'
                                                : `Tunai mengurangi uang laci sesi #${ cash.currentSession?.id }.` }
                                    <Button disabled={ pending || cash.currentStatus === 'loading' }
                                            onClick={ checkSession }>Periksa sesi kas</Button>
                                    { cashBlocked && <Button component={ Link } to="/cashier">Buka kasir</Button> }
                                </Alert>
                            ) : <Typography variant="body2">Transfer bank dan QRIS tidak memerlukan sesi kas dan tidak
                                mengubah uang laci.</Typography> }
                            <TextField label="Referensi pembayaran (opsional)"
                                       value={ draft.reference }
                                       onChange={ event => edit('reference', event.target.value) }
                                       disabled={ blocked }
                                       slotProps={ { htmlInput: { maxLength: 255 } } }/>
                            <TextField label="Catatan (opsional)"
                                       value={ draft.note }
                                       onChange={ event => edit('note', event.target.value) }
                                       disabled={ blocked }
                                       slotProps={ { htmlInput: { maxLength: 255 } } }/>
                            <Button type="submit" variant="contained" disabled={ blocked || cashBlocked || !payable }>Tinjau
                                pembayaran</Button>
                        </Stack>
                    ) }
                </Stack>
            </CardContent>
            <Dialog open={ !!confirmation }
                    onClose={ () => setConfirmation(null) }
                    fullWidth
                    maxWidth="sm"
                    aria-labelledby="payment-confirm-title"
                    aria-describedby="payment-confirm-body">
                <DialogTitle id="payment-confirm-title">Konfirmasi pembayaran pemasok</DialogTitle>
                <DialogContent id="payment-confirm-body" sx={ { overflowWrap: 'anywhere' } }>
                    <p>{ confirmation?.supplierName } · { confirmation?.code }</p>
                    <p>{ formatRupiah(confirmation?.request.amount) } · { SUPPLIER_PAYMENT_METHODS[confirmation?.request.paymentMethod] }</p>
                    <p>Sisa tagihan terakhir: { formatRupiah(confirmation?.outstandingAmount) }.</p>
                    <p>Referensi: { confirmation?.request.reference || 'Tidak ada' }</p>
                    <p>Catatan: { confirmation?.request.note || 'Tidak ada' }</p>
                    <p>Waktu pembayaran: { formatDate(confirmation?.request.paidAt) || 'Tidak tersedia' }</p>
                    <p>Pastikan pembayaran sudah dilakukan. Waktu pembayaran dicatat saat konfirmasi ini dibuka. Server
                        akan memeriksa sisa tagihan sebelum menyimpan.</p>
                    { confirmation?.request.paymentMethod === 'CASH' ? (
                        <p>Pembayaran ini mengurangi uang laci sesi kas #{ confirmation?.expectedCashSessionId } dan tetap terikat ke sesi tersebut saat dipulihkan.</p>
                    ) : (
                        <p>Pembayaran ini tidak memakai sesi kas dan tidak mengubah uang laci.</p>
                    ) }
                </DialogContent>
                <DialogActions>
                    <Button autoFocus onClick={ () => setConfirmation(null) }>Kembali</Button>
                    <Button disabled={ blocked || cashBlocked }
                            onClick={ () => {
                                const intent = confirmation;
                                setConfirmation(null);
                                state.submit(intent);
                            } }>Catat pembayaran</Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
}

SupplierPayment.propTypes = {
    receipt: PropTypes.shape({
        code: PropTypes.string.isRequired,
        supplierName: PropTypes.string,
        status: PropTypes.string,
        paymentStatus: PropTypes.string,
        paidAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        outstandingAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }).isRequired
};
