import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Chip, CircularProgress, Paper } from '@mui/material';
import { ArrowLeft, CircleOff, Pencil } from 'lucide-react';

import BloomConfirmationModal from '@components/_ui/BloomConfirmationModal.jsx';
import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { GENERIC_ERR_MESSAGE } from '@constants/general.js';
import { useBreadcrumbStore, useSupplierStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';
import { getSupplierDetailReturnTo, isValidSupplierCode } from '@utils/supplier-utils.js';

const valueOrDash = value => value || '-';
const money = value => value == null ? '-' : formatRupiah(value);

export default function SupplierDetail() {
    const { code = '' } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const supplier = useSupplierStore(state => state.supplierDetails);
    const status = useSupplierStore(state => state.detailStatus);
    const error = useSupplierStore(state => state.detailError);
    const getSupplierDetails = useSupplierStore(state => state.getSupplierDetails);
    const balance = useSupplierStore(state => state.supplierOutstandingBalance);
    const balanceStatus = useSupplierStore(state => state.balanceStatus);
    const balanceError = useSupplierStore(state => state.balanceError);
    const getSupplierOutstandingBalance = useSupplierStore(state => state.getSupplierOutstandingBalance);
    const setSupplierActive = useSupplierStore(state => state.setSupplierActive);
    const clearSupplierDetails = useSupplierStore(state => state.clearSupplierDetails);
    const clearSupplierOutstandingBalance = useSupplierStore(state => state.clearSupplierOutstandingBalance);
    const [retryVersion, setRetryVersion] = useState(0);
    const [balanceRetryVersion, setBalanceRetryVersion] = useState(0);
    const [showDeactivation, setShowDeactivation] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [deactivationError, setDeactivationError] = useState('');
    const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
    const deactivationInProgressRef = useRef(false);
    const deactivationTriggerRef = useRef(null);
    const isMountedRef = useRef(true);
    const successAlertRef = useRef(null);
    const isValidCode = isValidSupplierCode(code);
    const returnTo = getSupplierDetailReturnTo(location.state?.from);

    useEffect(() => {
        setBreadcrumbs([
            { to: '/suppliers', label: 'Pemasok' },
            code || 'Detail'
        ]);
    }, [code, setBreadcrumbs]);

    useEffect(() => {
        if (!isValidCode) {
            clearSupplierDetails();
            return undefined;
        }

        const controller = new AbortController();
        getSupplierDetails(code, { signal: controller.signal }).catch(() => {});

        return () => {
            controller.abort();
            clearSupplierDetails();
        };
    }, [clearSupplierDetails, code, getSupplierDetails, isValidCode, retryVersion]);

    useEffect(() => {
        if (!isValidCode) {
            clearSupplierOutstandingBalance();
            return undefined;
        }

        const controller = new AbortController();
        getSupplierOutstandingBalance(code, { signal: controller.signal }, { useLoader: false })
            .catch(() => {});

        return () => {
            controller.abort();
            clearSupplierOutstandingBalance();
        };
    }, [balanceRetryVersion, clearSupplierOutstandingBalance, code,
        getSupplierOutstandingBalance, isValidCode]);

    useEffect(() => {
        if (successMessage) successAlertRef.current?.focus();
    }, [successMessage]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            deactivationInProgressRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!location.state?.message) return;
        navigate(`${ location.pathname }${ location.search }`, {
            replace: true,
            state: { from: returnTo }
        });
    }, [location.pathname, location.search, location.state?.message, navigate, returnTo]);

    const openDeactivation = event => {
        deactivationTriggerRef.current = event.currentTarget;
        setDeactivationError('');
        setShowDeactivation(true);
    };

    const closeDeactivation = () => {
        if (deactivationInProgressRef.current) return;
        setShowDeactivation(false);
        setDeactivationError('');
        setTimeout(() => deactivationTriggerRef.current?.focus(), 0);
    };

    const deactivateSupplier = async () => {
        if (deactivationInProgressRef.current || !supplier?.active) return;
        deactivationInProgressRef.current = true;
        setIsDeactivating(true);
        setDeactivationError('');

        try {
            const updatedSupplier = await setSupplierActive(supplier.code, false);
            if (!isMountedRef.current) return;
            setShowDeactivation(false);
            setSuccessMessage(
                `Pemasok ${ updatedSupplier.name } berhasil dinonaktifkan tanpa menghapus riwayatnya.`
            );
        } catch (deactivationFailure) {
            if (!isMountedRef.current) return;
            setDeactivationError(deactivationFailure?.category === 'not_found'
                ? 'Pemasok ini tidak lagi tersedia. Tutup dialog lalu muat ulang data.'
                : deactivationFailure?.message || 'Pemasok gagal dinonaktifkan. Silakan coba lagi.');
        } finally {
            deactivationInProgressRef.current = false;
            if (isMountedRef.current) setIsDeactivating(false);
        }
    };

    if (!isValidCode) {
        return (
            <div className="space-y-4">
                <Alert severity="error">Kode pemasok tidak valid.</Alert>
                <Button component={ Link } to={ returnTo } startIcon={ <ArrowLeft aria-hidden="true" /> }>Kembali ke daftar</Button>
            </div>
        );
    }

    if (status === 'idle' || status === 'loading') {
        return (
            <div className="py-16 text-center" role="status" aria-live="polite">
                <CircularProgress size={ 24 } aria-hidden="true" /> <span>Memuat detail pemasok...</span>
            </div>
        );
    }

    if (status === 'error' || !supplier) {
        return (
            <div className="space-y-4">
                <Alert
                    severity="error"
                    action={ <Button color="inherit" onClick={ () => setRetryVersion(value => value + 1) }>Coba lagi</Button> }
                >
                    { error?.message || GENERIC_ERR_MESSAGE }
                </Alert>
                <Button component={ Link } to={ returnTo } startIcon={ <ArrowLeft aria-hidden="true" /> }>Kembali ke daftar</Button>
            </div>
        );
    }

    const statusLabel = supplier.active ? 'Aktif' : 'Tidak aktif';
    const isCurrentBalance = balance?.supplierCode === supplier.code;
    const payablesSearch = new URLSearchParams({
        key: 'supplierName',
        q: supplier.name
    }).toString();

    return (
        <div className="space-y-5 pb-8">
            { showDeactivation && (
                <BloomConfirmationModal
                    title={ `Nonaktifkan ${ supplier.name }?` }
                    confirmButtonText={ isDeactivating ? 'Menonaktifkan...' : 'Nonaktifkan' }
                    confirmButtonColor="error"
                    onCancel={ closeDeactivation }
                    onConfirm={ deactivateSupplier }
                    isPending={ isDeactivating }
                    focusCancel
                >
                    <p>
                        Pemasok tidak lagi dapat dipilih untuk transaksi baru. Identitas,
                        catatan, dan seluruh riwayat yang memakai kode <strong>{ supplier.code }</strong> tetap tersimpan.
                    </p>
                    { deactivationError && <Alert severity="error" className="mt-3">{ deactivationError }</Alert> }
                    { isDeactivating && (
                        <div role="status" className="mt-3 flex items-center gap-2">
                            <CircularProgress size={ 18 } aria-hidden="true" />
                            Menonaktifkan pemasok...
                        </div>
                    ) }
                </BloomConfirmationModal>
            ) }

            <Button component={ Link } to={ returnTo } startIcon={ <ArrowLeft aria-hidden="true" /> }>Kembali ke daftar</Button>

            { successMessage && (
                <Alert
                    ref={ successAlertRef }
                    severity="success"
                    role="status"
                    tabIndex={ -1 }
                    onClose={ () => setSuccessMessage('') }
                >
                    { successMessage }
                </Alert>
            ) }

            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold">Detail pemasok</h2>
                    <p className="text-gray-600 break-all">{ supplier.code }</p>
                </div>
            </header>

            { !supplier.active && (
                <Alert severity="info">
                    Pemasok tidak aktif dan tidak dapat dipilih untuk transaksi baru. Identitas serta riwayatnya tetap tersimpan.
                </Alert>
            ) }

            <div className="flex flex-wrap gap-2">
                <Button
                    component={ Link }
                    to={ `/suppliers/${ encodeURIComponent(supplier.code) }/edit` }
                    state={ { from: returnTo } }
                    variant="contained"
                    startIcon={ <Pencil aria-hidden="true" /> }
                >
                    Ubah pemasok
                </Button>
                { supplier.active && (
                    <Button
                        type="button"
                        color="error"
                        variant="outlined"
                        startIcon={ <CircleOff aria-hidden="true" /> }
                        onClick={ openDeactivation }
                    >
                        Nonaktifkan pemasok
                    </Button>
                ) }
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]">
                <Paper component="section" className="p-4 md:p-5" aria-labelledby="supplier-identity-title">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 id="supplier-identity-title" className="text-lg font-bold">Identitas dan kontak</h3>
                            <p className="text-sm text-gray-600">Kode adalah identitas tetap pemasok.</p>
                        </div>
                        <Chip
                            color={ supplier.active ? 'success' : 'default' }
                            label={ statusLabel }
                            aria-label={ `Status pemasok: ${ statusLabel }` }
                        />
                    </div>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-gray-600">Nama pemasok</dt>
                            <dd className="break-words font-medium">{ supplier.name }</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-600">Kode pemasok</dt>
                            <dd className="break-all font-medium">{ supplier.code }</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-600">Nomor kontak</dt>
                            <dd className="break-words">{ valueOrDash(supplier.contactNumber) }</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-600">Alamat</dt>
                            <dd className="whitespace-pre-wrap break-words">{ valueOrDash(supplier.address) }</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-600">Dibuat oleh &amp; pada</dt>
                            <dd className="break-words">{ valueOrDash(supplier.createdBy) }</dd>
                            <dd className="text-sm text-gray-600">{ formatDate(supplier.createdAt) || '-' }</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-600">Diperbarui oleh &amp; pada</dt>
                            <dd className="break-words">{ valueOrDash(supplier.updatedBy) }</dd>
                            <dd className="text-sm text-gray-600">{ formatDate(supplier.updatedAt) || '-' }</dd>
                        </div>
                    </dl>
                </Paper>

                <Paper component="section" className="p-4 md:p-5" aria-labelledby="supplier-payable-title">
                    <h3 id="supplier-payable-title" className="text-lg font-bold">Saldo utang resmi</h3>
                    <p className="text-sm text-gray-600">
                        Nilai berasal langsung dari ringkasan server, bukan penjumlahan browser.
                    </p>

                    { balanceStatus === 'idle' || balanceStatus === 'loading'
                        || (balanceStatus === 'ready' && !isCurrentBalance) ? (
                        <div role="status" aria-live="polite" className="flex items-center gap-2 py-6">
                            <CircularProgress size={ 20 } aria-hidden="true" />
                            Memuat ringkasan utang pemasok...
                        </div>
                    ) : balanceStatus === 'error' || !isCurrentBalance ? (
                        <Alert
                            severity="error"
                            className="mt-4"
                            action={ (
                                <Button
                                    color="inherit"
                                    onClick={ () => setBalanceRetryVersion(value => value + 1) }
                                >
                                    Coba lagi
                                </Button>
                            ) }
                        >
                            { balanceError?.message || 'Ringkasan utang pemasok gagal dimuat.' }
                        </Alert>
                    ) : (
                        <dl className="mt-5 grid gap-4" aria-label="Ringkasan utang pemasok dari server">
                            <div>
                                <dt className="text-sm text-gray-600">Sisa utang</dt>
                                <dd className="text-2xl font-bold tabular-nums">{ money(balance.outstandingAmount) }</dd>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                <div>
                                    <dt className="text-sm text-gray-600">Total penerimaan dibukukan</dt>
                                    <dd className="font-bold tabular-nums">{ money(balance.totalPostedAmount) }</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-600">Sudah dibayar</dt>
                                    <dd className="font-bold tabular-nums">{ money(balance.paidAmount) }</dd>
                                </div>
                            </div>
                        </dl>
                    ) }

                    <Button
                        component={ Link }
                        to={ `/payables?${ payablesSearch }` }
                        variant="outlined"
                        className="mt-5"
                    >
                        Buka utang pemasok
                    </Button>
                </Paper>
            </div>
        </div>
    );
}
