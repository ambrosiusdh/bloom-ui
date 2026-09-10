import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import BloomMoneyField from '@components/_ui/BloomMoneyField.jsx';
import { formatRupiah, getMoneySign } from '@components/cash-session/cash-session-money.js';
import useCashSessionStore from '@stores/modules/cash-session.js';
import useSupplierPaymentStore, { validatePayment } from '@stores/modules/supplier-payment.js';

const methods = { BANK_TRANSFER: 'Transfer bank', QRIS: 'QRIS', CASH: 'Tunai (CASH)' };
const messages = {
    pending: 'Menyimpan pembayaran. Tunggu hasilnya sebelum membayar lagi.',
    uncertain: 'Hasil pembayaran belum pasti. Periksa koneksi, lalu pulihkan pembayaran yang sama. Jangan membuat pembayaran baru.',
    keyConflict: 'Identitas pembayaran ditolak server. Minta petugas memeriksa transaksi ini sebelum membayar lagi.',
    conflict: 'Pembayaran ditolak: nominal mungkin melebihi sisa tagihan atau penerimaan sudah berubah. Periksa nilai terbaru, lalu konfirmasi kembali.',
    sessionConflict: 'Pembayaran tunai belum dapat dicatat. Sesi kas mungkin sudah ditutup atau waktu pembayaran berada di luar sesi. Periksa sesi, lalu konfirmasi kembali.',
    rejected: 'Pembayaran ditolak. Periksa nominal, metode, waktu, referensi, catatan, dan izin Anda sebelum mencoba kembali.',
    storageUnavailable: 'Pemulihan pembayaran tidak dapat disimpan di tab ini. Izinkan penyimpanan browser sebelum mengirim pembayaran.'
};

export default function SupplierPayment({ receipt }) {
    const state = useSupplierPaymentStore();
    const cash = useCashSessionStore();
    const [confirmation, setConfirmation] = useState(null);
    const amountRef = useRef(null);
    const feedbackRef = useRef(null);
    const focusNextRef = useRef(false);
    const { code, draft, attempt, result, pending, outcome, refreshStatus } = state;
    const current = code === receipt.code;
    const payable = receipt.status === 'POSTED' && ['UNPAID', 'PARTIALLY_PAID'].includes(receipt.paymentStatus)
        && getMoneySign(receipt.outstandingAmount) > 0;
    const blocked = pending || !!attempt || !!result || !current || refreshStatus === 'loading' || refreshStatus === 'error';
    const cashBlocked = draft.paymentMethod === 'CASH' && !cash.drawerActionsEnabled;

    useEffect(() => { state.select(receipt.code); }, [receipt.code, code, pending, state.select]);
    useEffect(() => {
        if (current && draft.paymentMethod === 'CASH' && !attempt && !result) {
            cash.getCurrentSession().catch(() => {});
        }
    }, [current, draft.paymentMethod, attempt, result, cash.getCurrentSession]);
    useEffect(() => {
        if (current && result && refreshStatus === 'idle') state.refresh();
    }, [current, result, refreshStatus, state.refresh]);
    useEffect(() => {
        if (!pending && outcome !== 'editing') feedbackRef.current?.focus();
        if (outcome === 'editing' && focusNextRef.current) {
            amountRef.current?.focus();
            focusNextRef.current = false;
        }
    }, [pending, outcome]);

    if (!current) return (
        <Alert severity="info">Selesaikan pembayaran sebelumnya terlebih dahulu.
            <Button component={ Link } to={ `/goods-receipts/${ encodeURIComponent(code) }` }>Buka penerimaan { code }</Button>
        </Alert>
    );
    const review = event => {
        event.preventDefault();
        if (blocked || cashBlocked || !payable) return;
        const error = validatePayment(draft);
        useSupplierPaymentStore.setState({ error });
        if (error) { amountRef.current?.focus(); return; }
        setConfirmation(new Date().toISOString());
    };
    const edit = (field, value) => state.edit({ ...draft, [field]: value });

    return (
        <Card className="print:hidden">
            <CardContent>
                <Stack spacing={ 2 }>
                    <Typography variant="h6">Bayar pemasok untuk penerimaan ini</Typography>
                    { result ? (
                        <Alert severity={ result.voided ? 'warning' : 'success' } role="status" tabIndex={ -1 } ref={ feedbackRef }>
                            { result.voided ? 'Pembayaran yang dipulihkan sudah dibatalkan.' : 'Pembayaran tercatat.' }
                            { ` #${ result.id } · ${ result.receiptCode } · ${ formatRupiah(result.amount) } · ${ methods[result.paymentMethod] }` }
                            { result.cashSessionId && ` · Sesi kas #${ result.cashSessionId }` }
                        </Alert>
                    ) : messages[outcome] && (
                        <Alert severity={ pending ? 'info' : 'warning' } role={ pending ? 'status' : 'alert' } tabIndex={ -1 } ref={ feedbackRef }>
                            { messages[outcome] }
                        </Alert>
                    ) }
                    { attempt && <Typography variant="body2" sx={ { overflowWrap: 'anywhere' } }>Referensi pemulihan: { attempt.key }</Typography> }
                    { refreshStatus === 'loading' && <Typography role="status">Memuat ulang nilai dan status penerimaan...</Typography> }
                    { refreshStatus === 'error' && (
                        <Alert severity="warning">Nilai penerimaan belum berhasil diperbarui. Angka di atas masih data sebelumnya.
                            <Button onClick={ state.refresh }>Muat ulang nilai penerimaan</Button>
                        </Alert>
                    ) }
                    { result && refreshStatus === 'ready' && payable && <Button onClick={ () => { focusNextRef.current = true; state.next(); } }>Catat pembayaran berikutnya</Button> }
                    { attempt && outcome !== 'keyConflict' && <Button disabled={ pending } onClick={ () => state.submit() }>Pulihkan pembayaran yang sama</Button> }
                    { !attempt && !result && !payable && <Alert severity="info">Penerimaan ini tidak memiliki tagihan yang dapat dibayar.</Alert> }
                    { !result && (payable || attempt) && (
                        <Stack component="form" spacing={ 2 } onSubmit={ review } aria-busy={ pending }>
                            <Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 }>
                                <BloomMoneyField label="Nominal pembayaran" groupSeparator="." decimalSeparator="," value={ draft.amount } onValueChange={ value => edit('amount', value) } inputRef={ amountRef } disabled={ blocked } error={ !!state.error } helperText={ state.error || 'Bayar sebagian atau seluruh sisa tagihan. Gunakan koma untuk desimal (maksimal 4 angka).' } fullWidth />
                                <TextField select label="Metode pembayaran" value={ draft.paymentMethod } onChange={ event => edit('paymentMethod', event.target.value) } disabled={ blocked } fullWidth>
                                    { Object.entries(methods).map(([value, label]) => <MenuItem key={ value } value={ value }>{ label }</MenuItem>) }
                                </TextField>
                            </Stack>
                            <Button disabled={ blocked } onClick={ () => edit('amount', String(receipt.outstandingAmount)) }>Isi seluruh sisa tagihan: { formatRupiah(receipt.outstandingAmount) }</Button>
                            { draft.paymentMethod === 'CASH' ? (
                                <Alert severity={ cashBlocked ? 'warning' : 'info' }>
                                    { cash.currentStatus === 'loading' ? 'Memeriksa sesi kas...'
                                        : cash.currentStatus === 'error' ? 'Sesi kas gagal diperiksa.'
                                            : cashBlocked ? 'Pembayaran tunai memerlukan sesi kas terbuka.'
                                                : `Tunai mengurangi uang laci sesi #${ cash.currentSession?.id }.` }
                                    <Button disabled={ pending || cash.currentStatus === 'loading' } onClick={ () => cash.getCurrentSession().catch(() => {}) }>Periksa sesi kas</Button>
                                    { cashBlocked && <Button component={ Link } to="/cashier">Buka kasir</Button> }
                                </Alert>
                            ) : <Typography variant="body2">Transfer bank dan QRIS tidak memerlukan sesi kas dan tidak mengubah uang laci.</Typography> }
                            <TextField label="Referensi pembayaran (opsional)" value={ draft.reference } onChange={ event => edit('reference', event.target.value) } disabled={ blocked } slotProps={ { htmlInput: { maxLength: 255 } } } />
                            <TextField label="Catatan (opsional)" value={ draft.note } onChange={ event => edit('note', event.target.value) } disabled={ blocked } slotProps={ { htmlInput: { maxLength: 255 } } } />
                            <Button type="submit" variant="contained" disabled={ blocked || cashBlocked || !payable }>Tinjau pembayaran</Button>
                        </Stack>
                    ) }
                </Stack>
            </CardContent>
            <Dialog open={ !!confirmation } onClose={ () => setConfirmation(null) } fullWidth maxWidth="sm" aria-labelledby="payment-confirm-title" aria-describedby="payment-confirm-body">
                <DialogTitle id="payment-confirm-title">Konfirmasi pembayaran pemasok</DialogTitle>
                <DialogContent id="payment-confirm-body">
                    <p>{ receipt.supplierName } · { receipt.code }</p>
                    <p>{ formatRupiah(draft.amount) } · { methods[draft.paymentMethod] }</p>
                    <p>Sisa tagihan terakhir: { formatRupiah(receipt.outstandingAmount) }.</p>
                    <p>Pastikan pembayaran sudah dilakukan. Waktu pembayaran dicatat saat konfirmasi ini dibuka. Server akan memeriksa sisa tagihan sebelum menyimpan.</p>
                    { draft.paymentMethod === 'CASH' && <p>Pembayaran ini mengurangi uang laci sesi kas terbuka.</p> }
                </DialogContent>
                <DialogActions>
                    <Button autoFocus onClick={ () => setConfirmation(null) }>Kembali</Button>
                    <Button disabled={ blocked || cashBlocked } onClick={ () => { const paidAt = confirmation; setConfirmation(null); state.submit(paidAt); } }>Catat pembayaran</Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
}

SupplierPayment.propTypes = { receipt: PropTypes.shape({ code: PropTypes.string.isRequired, supplierName: PropTypes.string,
    status: PropTypes.string, paymentStatus: PropTypes.string,
    outstandingAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }).isRequired };
