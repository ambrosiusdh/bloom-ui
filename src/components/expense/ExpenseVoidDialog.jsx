import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import ExpenseRecord from '@components/expense/ExpenseRecord.jsx';
import useAuthStore from '@stores/modules/auth.js';
import useExpenseVoidStore, { canUseExpenseVoid } from '@stores/modules/expense-void.js';
import { canVoidExpense, expenseVoidEligibility, validateExpenseVoidReason } from '@utils/expense-utils.js';

const getStatusMessage = state => {
    if (state.pending && state.outcome === 'loading') {
        return 'Memuat detail terbaru dan kelayakan pembatalan dari server...';
    }

    if (state.pending && state.outcome === 'sending') {
        return 'Permintaan pembatalan sedang diproses. Data dikunci sampai hasil server diketahui.';
    }

    if (state.pending) {
        return 'Memeriksa hasil terbaru pada server...';
    }

    if (state.outcome === 'confirmed') {
        return 'Server mengonfirmasi pengeluaran sudah dibatalkan. Catatan asli tetap utuh dan audit pembatalan tersimpan.';
    }

    if (state.outcome === 'rejected') {
        return 'Server menolak permintaan. Tidak ada pembatalan baru yang dikonfirmasi; alasan tetap tersedia untuk diperiksa atau diperbaiki.';
    }

    if (state.outcome === 'storageError') {
        return 'Pemulihan tidak dapat disimpan di perangkat. Permintaan belum dikirim.';
    }

    if (state.outcome === 'readError') {
        return 'Detail pengeluaran belum dapat diverifikasi. Periksa hasil sebelum melanjutkan.';
    }

    if (state.attempt) {
        return 'Hasil belum pasti. Pengeluaran, sesi asal, dan alasan dikunci untuk pemulihan akun ini.';
    }

    return expenseVoidEligibility(state.record);
};

const getStatusSeverity = state => {
    if (state.outcome === 'confirmed') {
        return 'success';
    }

    if (state.pending) {
        return 'info';
    }

    return state.outcome === 'ready' ? 'info' : 'warning';
};

function ExpenseSessionImpact({ session, refreshError }) {
    return (
        <Card component="section" variant="outlined" aria-label="Dampak sesi menurut server">
            <CardContent>
                <Typography component="h3" variant="subtitle1">Dampak sesi menurut server</Typography>
                { session ? (
                    <dl className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-3">
                        <div>
                            <dt className="text-xs font-medium text-gray-600">Sesi kas asal</dt>
                            <dd className="mt-1">#{ session.id }</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-gray-600">Status server</dt>
                            <dd className="mt-1">{ session.status === 'OPEN' ? 'Terbuka' : 'Ditutup' }</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-gray-600">Kas yang diharapkan</dt>
                            <dd className="mt-1">{ formatRupiah(session.expectedClosingCash) }</dd>
                        </div>
                    </dl>
                ) : (
                    <Typography sx={ { mt: 1 } }>
                        Detail dampak sesi belum tersedia. Pembatalan yang telah dikonfirmasi tetap berlaku.
                    </Typography>
                ) }
                <Typography variant="body2" color="text.secondary" sx={ { mt: 2 } }>
                    Nilai ini dibaca langsung dari server; aplikasi tidak menghitung ulang saldo atau dampak sesi.
                </Typography>
                { refreshError && (
                    <Alert severity="warning" sx={ { mt: 2 } }>
                        Sebagian data sesi terbaru gagal dimuat. Periksa lagi tanpa mengirim ulang pembatalan.
                    </Alert>
                ) }
            </CardContent>
        </Card>
    );
}

ExpenseSessionImpact.propTypes = {
    session: PropTypes.object,
    refreshError: PropTypes.bool.isRequired
};

export default function ExpenseVoidDialog({ onExited }) {
    const state = useExpenseVoidStore();
    const ownerAccountId = useAuthStore(auth => auth.authStatus === 'authenticated'
        ? auth.currentUser?.accountId : null);
    const accessible = canUseExpenseVoid(state);
    const [view, setView] = useState('detail');
    const [error, setError] = useState('');
    const reasonRef = useRef(null);
    const feedbackRef = useRef(null);
    const safeActionRef = useRef(null);
    const voidTriggerRef = useRef(null);
    const returningToDetailRef = useRef(false);

    useEffect(() => {
        const current = useExpenseVoidStore.getState();
        if (canUseExpenseVoid(current) && current.record && !current.pending) {
            current.refresh();
        }
    }, [ownerAccountId]);

    useEffect(() => {
        setView('detail');
        setError('');
    }, [state.record?.id]);

    useEffect(() => {
        if (!state.open) {
            return;
        }

        if (state.outcome === 'confirmed') {
            setView('result');
        } else if (state.attempt && !state.pending) {
            setView('recovery');
        } else if (state.outcome === 'rejected') {
            setView('confirm');
        }
    }, [state.attempt, state.open, state.outcome, state.pending]);

    useEffect(() => {
        if (!state.open || state.pending) {
            return;
        }

        if (returningToDetailRef.current && view === 'detail') {
            returningToDetailRef.current = false;
            voidTriggerRef.current?.focus();
            return;
        }

        if (['confirmed', 'rejected', 'storageError', 'readError'].includes(state.outcome)
            || state.attempt) {
            feedbackRef.current?.focus();
        } else {
            safeActionRef.current?.focus();
        }
    }, [state.attempt, state.open, state.outcome, state.pending, view]);

    if (!state.record) {
        return null;
    }

    if (!accessible) {
        return (
            <Alert severity="warning">
                Pembatalan sebelumnya dikunci untuk identitas akun asal. Pemulihan tanpa identitas akun tetap harus direkonsiliasi manual; semua pembatalan lain di tab ini ditahan.
            </Alert>
        );
    }

    const confirmed = state.outcome === 'confirmed';
    const recovering = view === 'recovery';
    const canStartVoid = !state.pending && !state.attempt
        && ['ready', 'rejected'].includes(state.outcome)
        && canVoidExpense(state.record);
    const title = view === 'confirm'
        ? `Konfirmasi pembatalan pengeluaran #${ state.record.id }`
        : view === 'recovery'
            ? `Pulihkan pembatalan pengeluaran #${ state.record.id }`
            : view === 'result'
                ? `Hasil pembatalan pengeluaran #${ state.record.id }`
                : `Detail pengeluaran #${ state.record.id }`;

    const closeDialog = () => {
        setView('detail');
        setError('');
        state.close();
    };

    const returnToDetail = () => {
        returningToDetailRef.current = true;
        setView('detail');
        setError('');
    };

    const submit = () => {
        const validation = validateExpenseVoidReason(state.reason);
        setError(validation);
        if (validation) {
            reasonRef.current?.focus();
            return;
        }

        state.submit();
    };

    return (
        <>
            { !state.open && (
                <Button onClick={ state.resume }>
                    { state.attempt ? 'Lanjutkan pemulihan' : `Lanjutkan detail pengeluaran #${ state.record.id }` }
                </Button>
            ) }
            <Dialog
                open={ state.open }
                onClose={ (_event, reason) => {
                    if (reason === 'escapeKeyDown' && view === 'confirm' && !state.pending) {
                        returnToDetail();
                        return;
                    }

                    closeDialog();
                } }
                disableEscapeKeyDown={ state.pending }
                disableRestoreFocus
                fullWidth
                maxWidth="md"
                slotProps={ {
                    transition: {
                        onExited: () => {
                            state.dismiss();
                            onExited();
                        }
                    }
                } }
                aria-labelledby="expense-void-title"
                aria-describedby="expense-void-description"
            >
                <DialogTitle id="expense-void-title">{ title }</DialogTitle>
                <DialogContent sx={ { overflowWrap: 'anywhere' } }>
                    <Stack spacing={ 2 } aria-busy={ state.pending }>
                        <Typography id="expense-void-description">
                            Catatan asli tidak pernah dihapus. Server menyimpan pembalikan dan dampak sesi sebagai fakta terpisah.
                        </Typography>
                        <Alert
                            severity={ getStatusSeverity(state) }
                            role="status"
                            tabIndex={ -1 }
                            ref={ feedbackRef }
                        >
                            { getStatusMessage(state) }
                        </Alert>
                        { state.notice && !confirmed && (
                            <Alert severity={ state.outcome === 'rejected' ? 'error' : 'warning' }>
                                { state.notice }
                            </Alert>
                        ) }

                        { view === 'detail' && (
                            <Card variant="outlined">
                                <CardContent>
                                    <ExpenseRecord record={ state.record }/>
                                </CardContent>
                            </Card>
                        ) }

                        { view === 'confirm' && (
                            <>
                                <Card variant="outlined">
                                    <CardContent>
                                        <ExpenseRecord record={ state.record } showSessionLink={ false }/>
                                    </CardContent>
                                </Card>
                                <TextField
                                    label="Alasan pembatalan"
                                    value={ state.reason }
                                    onChange={ event => {
                                        state.edit(event.target.value);
                                        setError('');
                                    } }
                                    inputRef={ reasonRef }
                                    required
                                    fullWidth
                                    multiline
                                    minRows={ 3 }
                                    disabled={ state.pending || !!state.attempt || !canStartVoid }
                                    error={ !!error }
                                    helperText={ error || `${ state.reason.length }/255 · Wajib diisi dan akan tersimpan dalam audit.` }
                                    slotProps={ { htmlInput: { maxLength: 255 } } }
                                />
                                <Alert severity="warning">
                                    Setelah server mengonfirmasi, pembatalan tidak dapat dibatalkan kembali dari layar ini.
                                </Alert>
                            </>
                        ) }

                        { state.pending && state.attempt && (
                            <Card component="section" variant="outlined" aria-label="Permintaan pembatalan terkunci">
                                <CardContent>
                                    <Typography component="h3" variant="subtitle1">Permintaan yang sedang diproses</Typography>
                                    <Typography>Pengeluaran #{ state.record.id } · { formatRupiah(state.record.amount) }</Typography>
                                    <Typography>Sesi kas asli #{ state.record.cashSessionId }</Typography>
                                    <Typography>Alasan: { state.attempt }</Typography>
                                    <Stack direction="row" spacing={ 1 } alignItems="center" sx={ { mt: 2 } }>
                                        <CircularProgress size={ 20 }/>
                                        <Typography variant="body2">Menunggu hasil server. Semua tindakan dikunci.</Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ) }

                        { recovering && (
                            <Card component="section" variant="outlined" aria-label="Pemulihan pembatalan terkunci">
                                <CardContent>
                                    <Typography component="h3" variant="subtitle1">Pemulihan untuk data yang sama</Typography>
                                    <Typography>Pengeluaran #{ state.record.id } · { formatRupiah(state.record.amount) }</Typography>
                                    <Typography>Sesi kas asli #{ state.record.cashSessionId }</Typography>
                                    <Typography>Alasan terkunci: { state.attempt }</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={ { mt: 2 } }>
                                        Periksa server terlebih dahulu. Jika belum dibatalkan, pemulihan hanya mengulang pengeluaran dan alasan ini pada akun yang sama.
                                    </Typography>
                                </CardContent>
                            </Card>
                        ) }

                        { view === 'result' && (
                            <>
                                <Card variant="outlined">
                                    <CardContent>
                                        <ExpenseRecord record={ state.record }/>
                                    </CardContent>
                                </Card>
                                <ExpenseSessionImpact
                                    session={ state.session }
                                    refreshError={ state.refreshError }
                                />
                            </>
                        ) }

                        { state.refreshError && view !== 'result' && (
                            <Alert severity="warning">
                                Sebagian data terbaru gagal dimuat. Periksa hasil lagi; jangan membuat pembatalan pengganti.
                            </Alert>
                        ) }
                    </Stack>
                </DialogContent>
                <DialogActions sx={ {
                    flexWrap: 'wrap',
                    gap: 1
                } }>
                    { view === 'confirm' ? (
                        <Button
                            ref={ safeActionRef }
                            autoFocus
                            disabled={ state.pending }
                            onClick={ returnToDetail }
                        >
                            Kembali
                        </Button>
                    ) : (
                        <Button
                            ref={ safeActionRef }
                            autoFocus
                            disabled={ state.pending }
                            onClick={ closeDialog }
                        >
                            { confirmed ? 'Selesai' : 'Kembali ke riwayat' }
                        </Button>
                    ) }
                    { ['detail', 'recovery', 'result'].includes(view) && (
                        <Button disabled={ state.pending } onClick={ state.refresh }>
                            { recovering ? 'Periksa hasil terbaru' : 'Muat detail terbaru' }
                        </Button>
                    ) }
                    { view === 'detail' && canStartVoid && (
                        <Button
                            ref={ voidTriggerRef }
                            variant="contained"
                            onClick={ () => {
                                setError('');
                                setView('confirm');
                            } }
                        >
                            Batalkan pengeluaran
                        </Button>
                    ) }
                    { view === 'confirm' && (
                        <Button
                            variant="contained"
                            disabled={ !canStartVoid }
                            onClick={ submit }
                        >
                            Konfirmasi pembatalan
                        </Button>
                    ) }
                    { recovering && (
                        <Button
                            variant="contained"
                            disabled={ state.pending }
                            onClick={ state.submit }
                        >
                            Pulihkan pembatalan yang sama
                        </Button>
                    ) }
                </DialogActions>
            </Dialog>
        </>
    );
}

ExpenseVoidDialog.propTypes = { onExited: PropTypes.func.isRequired };
