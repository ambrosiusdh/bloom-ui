import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Chip, CircularProgress, Paper } from '@mui/material';
import { ArrowLeft, CircleOff, Pencil } from 'lucide-react';

import BloomConfirmationModal from '@components/_ui/BloomConfirmationModal.jsx';
import { GENERIC_ERR_MESSAGE } from '@constants/general.js';
import { useBreadcrumbStore, useSupplierStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';
import { getSupplierListReturnTo, isValidSupplierCode } from '@utils/supplier-utils.js';

const valueOrDash = value => value || '-';

export default function SupplierDetail() {
    const { code = '' } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const supplier = useSupplierStore(state => state.supplierDetails);
    const status = useSupplierStore(state => state.detailStatus);
    const error = useSupplierStore(state => state.detailError);
    const getSupplierDetails = useSupplierStore(state => state.getSupplierDetails);
    const setSupplierActive = useSupplierStore(state => state.setSupplierActive);
    const clearSupplierDetails = useSupplierStore(state => state.clearSupplierDetails);
    const [retryVersion, setRetryVersion] = useState(0);
    const [showDeactivation, setShowDeactivation] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [deactivationError, setDeactivationError] = useState('');
    const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
    const deactivationInProgressRef = useRef(false);
    const deactivationTriggerRef = useRef(null);
    const isMountedRef = useRef(true);
    const successAlertRef = useRef(null);
    const isValidCode = isValidSupplierCode(code);
    const returnTo = getSupplierListReturnTo(location.state?.from);

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
                    <h2 className="text-2xl font-bold break-words">{ supplier.name }</h2>
                    <p className="text-gray-600 break-all">Kode pemasok: { supplier.code }</p>
                </div>
                <Chip
                    color={ supplier.active ? 'success' : 'default' }
                    label={ statusLabel }
                    aria-label={ `Status pemasok: ${ statusLabel }` }
                />
            </header>

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

            <div className="grid gap-4 lg:grid-cols-2">
                <Paper component="section" className="p-4 md:p-5" aria-labelledby="supplier-contact-title">
                    <h3 id="supplier-contact-title" className="text-lg font-bold mb-4">Informasi kontak</h3>
                    <dl className="grid gap-4">
                        <div><dt className="text-sm text-gray-600">Nomor kontak</dt><dd className="break-words">{ valueOrDash(supplier.contactNumber) }</dd></div>
                        <div><dt className="text-sm text-gray-600">Alamat</dt><dd className="whitespace-pre-wrap break-words">{ valueOrDash(supplier.address) }</dd></div>
                    </dl>
                </Paper>

                <Paper component="section" className="p-4 md:p-5" aria-labelledby="supplier-audit-title">
                    <h3 id="supplier-audit-title" className="text-lg font-bold mb-4">Catatan data</h3>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div><dt className="text-sm text-gray-600">Dibuat</dt><dd>{ formatDate(supplier.createdAt) || '-' }</dd></div>
                        <div><dt className="text-sm text-gray-600">Dibuat oleh</dt><dd>{ valueOrDash(supplier.createdBy) }</dd></div>
                        <div><dt className="text-sm text-gray-600">Diperbarui</dt><dd>{ formatDate(supplier.updatedAt) || '-' }</dd></div>
                        <div><dt className="text-sm text-gray-600">Diperbarui oleh</dt><dd>{ valueOrDash(supplier.updatedBy) }</dd></div>
                    </dl>
                </Paper>
            </div>
        </div>
    );
}
