import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Alert, Button, Chip, CircularProgress, Paper } from '@mui/material';
import { ArrowLeft } from 'lucide-react';

import { GENERIC_ERR_MESSAGE } from '@constants/general.js';
import { useBreadcrumbStore, useSupplierStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';

const valueOrDash = value => value || '-';

export default function SupplierDetail() {
    const { code = '' } = useParams();
    const location = useLocation();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const supplier = useSupplierStore(state => state.supplierDetails);
    const status = useSupplierStore(state => state.detailStatus);
    const error = useSupplierStore(state => state.detailError);
    const getSupplierDetails = useSupplierStore(state => state.getSupplierDetails);
    const clearSupplierDetails = useSupplierStore(state => state.clearSupplierDetails);
    const [retryVersion, setRetryVersion] = useState(0);
    const isValidCode = Boolean(code.trim()) && code.length <= 255;
    const returnTo = typeof location.state?.from === 'string'
        && location.state.from.startsWith('/suppliers') ? location.state.from : '/suppliers';

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
            <Button component={ Link } to={ returnTo } startIcon={ <ArrowLeft aria-hidden="true" /> }>Kembali ke daftar</Button>

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
