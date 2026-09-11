import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import ExpenseRecord from '@components/expense/ExpenseRecord.jsx';
import useAuthStore from '@stores/modules/auth.js';
import useExpenseVoidStore, { canUseExpenseVoid } from '@stores/modules/expense-void.js';
import { canVoidExpense, expenseVoidEligibility, validateExpenseVoidReason } from '@utils/expense-utils.js';

export default function ExpenseVoidDialog({ onExited }) {
    const state = useExpenseVoidStore();
    const owner = useAuthStore(auth => auth.authStatus === 'authenticated' ? auth.currentUser?.username : null);
    const accessible = canUseExpenseVoid(state);
    const [error, setError] = useState('');
    const reasonRef = useRef(null);
    const feedbackRef = useRef(null);

    useEffect(() => {
        const current = useExpenseVoidStore.getState();
        if (canUseExpenseVoid(current) && current.record && !current.pending) current.refresh();
    }, [owner]);

    useEffect(() => {
        setError('');
        if (!state.pending && state.outcome !== 'ready') feedbackRef.current?.focus();
    }, [state.pending, state.outcome, state.record?.id]);

    if (!state.record) return null;
    if (!accessible) return <Alert severity="warning">Pembatalan sebelumnya dikunci untuk akun asal. Masuk dengan akun tersebut untuk melanjutkan.</Alert>;

    const confirmed = state.outcome === 'confirmed';
    const message = state.pending ? 'Memproses dan memeriksa data server...'
        : confirmed ? 'Server mengonfirmasi pengeluaran sudah dibatalkan. Alasan, waktu, dan petugas di bawah adalah audit yang tersimpan, termasuk jika pembatalan dilakukan sebelumnya.'
            : state.outcome === 'storageError' ? 'Pemulihan tidak dapat disimpan di perangkat. Permintaan belum dikirim. Periksa ulang data untuk mencoba lagi.'
                : state.outcome === 'readError' ? 'Data pengeluaran gagal diverifikasi. Periksa hasil sebelum melanjutkan.'
                    : state.attempt ? 'Hasil belum pasti. Alasan dikunci; pemulihan hanya untuk pengeluaran yang sama.'
                        : expenseVoidEligibility(state.record);

    return <>
        <Button onClick={ state.resume }>Lanjutkan pembatalan #{ state.record.id }</Button>
        <Dialog open={ state.open }
                onClose={ state.close }
                disableEscapeKeyDown={ state.pending }
                disableRestoreFocus
                fullWidth
                maxWidth="sm"
                slotProps={ {
                    transition: {
                        onExited: () => {
                            state.dismiss();
                            onExited();
                        }
                    }
                } }
                aria-labelledby="expense-void-title"
                aria-describedby="expense-void-description">
            <DialogTitle id="expense-void-title">Konfirmasi pembatalan pengeluaran #{ state.record.id }</DialogTitle>
            <DialogContent sx={ { overflowWrap: 'anywhere' } }>
                <Stack spacing={ 2 } aria-busy={ state.pending }>
                    <Typography id="expense-void-description">Catatan asli tetap tersimpan. Server mencatat pembalik arus kas pada sesi asal. Pembatalan baru setelah sesi ditutup tidak tersedia.</Typography>
                    <Alert severity={ confirmed ? 'success' : state.pending ? 'info' : 'warning' }
                           role="status"
                           tabIndex={ -1 }
                           ref={ feedbackRef }>{ message }</Alert>
                    { state.notice && !confirmed && <Alert severity="warning">{ state.notice }</Alert> }
                    <ExpenseRecord record={ state.record }/>
                    { !confirmed && <TextField label="Alasan pembatalan"
                                               value={ state.reason }
                                               onChange={ event => {
                                                   state.edit(event.target.value);
                                                   setError('');
                                               } }
                                               inputRef={ reasonRef }
                                               required
                                               fullWidth
                                               multiline
                                               minRows={ 2 }
                                               disabled={ state.pending || !!state.attempt || state.outcome !== 'ready' || !canVoidExpense(state.record) }
                                               error={ !!error }
                                               helperText={ error || 'Wajib diisi, maksimal 255 karakter. Alasan akan tersimpan dalam audit.' }
                                               slotProps={ { htmlInput: { maxLength: 255 } } }/> }
                    { state.session && <Typography>Sesi kas #{ state.session.id } · { state.session.status === 'OPEN' ? 'Terbuka' : 'Ditutup' } · Kas yang diharapkan menurut server: { formatRupiah(state.session.expectedClosingCash) }</Typography> }
                    { state.refreshError && <Alert severity="warning">Sebagian data terbaru gagal dimuat. Hasil pembatalan yang sudah dikonfirmasi tetap tersimpan; periksa hasil lagi.</Alert> }
                </Stack>
            </DialogContent>
            <DialogActions sx={ {
                flexWrap: 'wrap',
                gap: 1
            } }>
                <Button autoFocus disabled={ state.pending } onClick={ state.close }>{ confirmed ? 'Selesai' : 'Kembali' }</Button>
                <Button disabled={ state.pending } onClick={ state.refresh }>Periksa hasil</Button>
                { !confirmed && <Button variant="contained"
                                        disabled={ state.pending || (!state.attempt && (state.outcome !== 'ready' || !canVoidExpense(state.record))) }
                                        onClick={ () => {
                                            const validation = validateExpenseVoidReason(state.reason);
                                            setError(validation);
                                            if (validation) reasonRef.current?.focus();
                                            else state.submit();
                                        } }>{ state.attempt ? 'Pulihkan pembatalan yang sama' : 'Konfirmasi pembatalan' }</Button> }
            </DialogActions>
        </Dialog>
    </>;
}

ExpenseVoidDialog.propTypes = { onExited: PropTypes.func.isRequired };
