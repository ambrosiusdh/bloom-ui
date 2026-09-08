import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, CircularProgress, Paper, TextField } from '@mui/material';

import { useBreadcrumbStore, useSupplierStore } from '@stores/index.js';
import {
    getSupplierListReturnTo,
    isValidSupplierCode,
    SUPPLIER_CODE_MAX_LENGTH
} from '@utils/supplier-utils.js';

const MAX_LENGTH = SUPPLIER_CODE_MAX_LENGTH;
const EMPTY_FORM = { code: '', name: '', contactNumber: '', address: '' };
const EMPTY_ERRORS = { code: '', name: '', contactNumber: '', address: '' };
const FIELD_ORDER = ['name', 'code', 'contactNumber', 'address'];
const FIELD_LABELS = {
    code: 'Kode pemasok',
    name: 'Nama pemasok',
    contactNumber: 'Nomor kontak',
    address: 'Alamat'
};

const validateField = (field, value, isEdit) => {
    if ((field === 'name' || (field === 'code' && !isEdit)) && !value.trim()) {
        return `${ FIELD_LABELS[field] } wajib diisi.`;
    }
    return value.length > MAX_LENGTH
        ? `${ FIELD_LABELS[field] } maksimal ${ MAX_LENGTH } karakter.`
        : '';
};

const validateForm = (form, isEdit) => Object.fromEntries(
    Object.keys(EMPTY_ERRORS).map(field => [field, validateField(field, form[field], isEdit)])
);

const getBackendValidationMessage = detail => {
    if (detail.field === 'name' || detail.field === 'code') {
        if (/required|blank/i.test(detail.message)) {
            return `${ FIELD_LABELS[detail.field] } wajib diisi.`;
        }
    }
    if (/255|exceed|max/i.test(detail.message)) {
        return `${ FIELD_LABELS[detail.field] } maksimal ${ MAX_LENGTH } karakter.`;
    }
    return `${ FIELD_LABELS[detail.field] } tidak valid.`;
};

const toFormData = supplier => ({
    code: supplier.code ?? '',
    name: supplier.name ?? '',
    contactNumber: supplier.contactNumber ?? '',
    address: supplier.address ?? ''
});

const toPayload = (form, isEdit) => ({
    data: {
        ...(!isEdit ? { code: form.code.trim() } : {}),
        name: form.name.trim(),
        contactNumber: form.contactNumber.trim(),
        address: form.address.trim()
    }
});

export default function SupplierUpsert() {
    const { code } = useParams();
    const isEdit = Boolean(code);
    const isValidCode = !isEdit || isValidSupplierCode(code);
    const location = useLocation();
    const navigate = useNavigate();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const getSupplierDetails = useSupplierStore(state => state.getSupplierDetails);
    const createSupplier = useSupplierStore(state => state.createSupplier);
    const updateSupplier = useSupplierStore(state => state.updateSupplier);
    const listReturnTo = getSupplierListReturnTo(location.state?.from);
    const detailPath = isEdit && isValidCode
        ? `/suppliers/${ encodeURIComponent(code) }`
        : '';
    const cancelTo = detailPath || listReturnTo;

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState(EMPTY_ERRORS);
    const [isLoading, setIsLoading] = useState(isEdit && isValidCode);
    const [loadError, setLoadError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reloadVersion, setReloadVersion] = useState(0);
    const fieldRefs = useRef({});
    const errorAlertRef = useRef(null);
    const loadErrorRef = useRef(null);
    const isMountedRef = useRef(true);
    const submitInProgressRef = useRef(false);
    const pendingFieldFocusRef = useRef('');

    const loadSupplier = useCallback(async signal => {
        if (!isEdit || !isValidCode) return;
        setIsLoading(true);
        setLoadError('');
        try {
            const supplier = await getSupplierDetails(code, { signal });
            if (!signal.aborted) {
                setForm(toFormData(supplier));
                setErrors(EMPTY_ERRORS);
            }
        } catch (error) {
            if (!signal.aborted) {
                setLoadError(error?.category === 'not_found'
                    ? 'Pemasok ini tidak lagi tersedia.'
                    : error?.message || 'Data pemasok gagal dimuat. Silakan coba lagi.');
            }
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, [code, getSupplierDetails, isEdit, isValidCode]);

    const handleChange = event => {
        const { name, value } = event.target;
        setForm(previous => ({ ...previous, [name]: value }));
        setErrors(previous => ({ ...previous, [name]: '' }));
        setSubmitError('');
    };

    const handleBlur = field => {
        setErrors(previous => ({
            ...previous,
            [field]: validateField(field, form[field], isEdit)
        }));
    };

    const handleSubmit = async event => {
        event.preventDefault();
        if (submitInProgressRef.current) return;

        const nextErrors = validateForm(form, isEdit);
        const firstInvalidField = FIELD_ORDER.find(field => nextErrors[field]);
        if (firstInvalidField) pendingFieldFocusRef.current = firstInvalidField;
        setErrors(nextErrors);
        if (firstInvalidField) {
            return;
        }

        submitInProgressRef.current = true;
        setIsSubmitting(true);
        setSubmitError('');
        pendingFieldFocusRef.current = '';
        const submittedForm = { ...form };

        try {
            const supplier = isEdit
                ? await updateSupplier(code, toPayload(submittedForm, true))
                : await createSupplier(toPayload(submittedForm, false));
            if (!isMountedRef.current) return;
            navigate(`/suppliers/${ encodeURIComponent(supplier.code) }`, {
                replace: true,
                state: {
                    from: listReturnTo,
                    message: isEdit
                        ? `Pemasok ${ supplier.name } berhasil diperbarui.`
                        : `Pemasok ${ supplier.name } berhasil dibuat.`
                }
            });
        } catch (error) {
            if (!isMountedRef.current) return;
            const backendErrors = { ...EMPTY_ERRORS };
            error?.validationErrors?.forEach(detail => {
                if (detail.field in backendErrors) {
                    backendErrors[detail.field] = getBackendValidationMessage(detail);
                }
            });

            if (!isEdit && error?.category === 'conflict') {
                backendErrors.code = 'Kode pemasok sudah digunakan, termasuk oleh pemasok tidak aktif.';
            }
            setErrors(previous => ({ ...previous, ...backendErrors }));

            const backendField = FIELD_ORDER.find(field => backendErrors[field]);
            if (backendField) {
                pendingFieldFocusRef.current = backendField;
                setSubmitError(!isEdit && error?.category === 'conflict'
                    ? 'Kode pemasok harus unik. Gunakan kode lain.'
                    : 'Periksa kembali kolom yang ditandai.');
            } else if (error?.category === 'not_found') {
                setSubmitError('Pemasok ini tidak lagi tersedia. Kembali ke daftar dan muat ulang data.');
            } else if (error?.category === 'conflict') {
                setSubmitError('Data pemasok berubah. Muat ulang halaman sebelum mencoba lagi.');
            } else {
                setSubmitError(error?.message || 'Pemasok gagal disimpan. Silakan coba lagi.');
            }
        } finally {
            submitInProgressRef.current = false;
            if (isMountedRef.current) setIsSubmitting(false);
        }
    };

    useEffect(() => {
        setBreadcrumbs([
            { to: '/suppliers', label: 'Pemasok' },
            isEdit ? `Ubah ${ code }` : 'Buat baru'
        ]);
    }, [code, isEdit, setBreadcrumbs]);

    useEffect(() => {
        if (!isEdit || !isValidCode) {
            setForm({ ...EMPTY_FORM });
            setErrors({ ...EMPTY_ERRORS });
            setIsLoading(false);
            return undefined;
        }
        const controller = new AbortController();
        loadSupplier(controller.signal);
        return () => controller.abort();
    }, [isEdit, isValidCode, loadSupplier, reloadVersion]);

    useEffect(() => {
        if (loadError) loadErrorRef.current?.focus();
    }, [loadError]);

    useEffect(() => {
        if (submitError) errorAlertRef.current?.focus();
    }, [submitError]);

    useEffect(() => {
        const field = pendingFieldFocusRef.current;
        if (!isSubmitting && field && errors[field]) {
            pendingFieldFocusRef.current = '';
            fieldRefs.current[field]?.focus();
        }
    }, [errors, isSubmitting]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            submitInProgressRef.current = false;
        };
    }, []);

    if (!isValidCode) {
        return (
            <div className="space-y-3 max-w-3xl">
                <Alert severity="error">Kode pemasok tidak valid.</Alert>
                <Button component={ Link } to={ listReturnTo }>Kembali ke daftar</Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div role="status" className="flex items-center gap-2 py-12">
                <CircularProgress size={ 22 } aria-hidden="true" />
                Memuat data pemasok...
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="space-y-3 max-w-3xl">
                <Alert
                    ref={ loadErrorRef }
                    severity="error"
                    tabIndex={ -1 }
                    action={ <Button color="inherit" onClick={ () => setReloadVersion(value => value + 1) }>Coba lagi</Button> }
                >
                    { loadError }
                </Alert>
                <Button component={ Link } to={ cancelTo } state={ detailPath ? { from: listReturnTo } : undefined }>
                    { detailPath ? 'Kembali ke detail' : 'Kembali ke daftar' }
                </Button>
            </div>
        );
    }

    const interactionDisabled = isSubmitting;

    return (
        <div className="space-y-4 pb-8">
            <header>
                <h2 className="text-2xl font-bold">{ isEdit ? `Ubah pemasok ${ code }` : 'Buat pemasok baru' }</h2>
                <p className="text-gray-600 mt-1">
                    { isEdit
                        ? 'Kode pemasok adalah identitas tetap dan tidak dapat diubah.'
                        : 'Kode akan disimpan sebagai identitas tetap dan harus unik.' }
                </p>
            </header>

            { submitError && (
                <Alert ref={ errorAlertRef } severity="error" tabIndex={ -1 } className="max-w-3xl">
                    { submitError }
                </Alert>
            ) }

            <Paper component="form" onSubmit={ handleSubmit } noValidate className="p-4 md:p-5 max-w-3xl space-y-4">
                <fieldset disabled={ interactionDisabled } className="grid gap-4 sm:grid-cols-2">
                    <legend className="sr-only">Informasi pemasok</legend>
                    <TextField
                        label="Nama pemasok"
                        name="name"
                        value={ form.name }
                        inputRef={ element => { fieldRefs.current.name = element; } }
                        autoFocus
                        error={ Boolean(errors.name) }
                        helperText={ errors.name || `${ form.name.length }/${ MAX_LENGTH }` }
                        onChange={ handleChange }
                        onBlur={ () => handleBlur('name') }
                        slotProps={ { htmlInput: { maxLength: MAX_LENGTH } } }
                        fullWidth
                    />

                    { isEdit ? (
                        <TextField
                            label="Kode pemasok"
                            value={ form.code }
                            disabled
                            helperText="Identitas tetap; riwayat tetap memakai kode ini."
                            fullWidth
                        />
                    ) : (
                        <TextField
                            label="Kode pemasok"
                            name="code"
                            value={ form.code }
                            inputRef={ element => { fieldRefs.current.code = element; } }
                            error={ Boolean(errors.code) }
                            helperText={ errors.code || `Unik, maksimal ${ MAX_LENGTH } karakter.` }
                            onChange={ handleChange }
                            onBlur={ () => handleBlur('code') }
                            slotProps={ { htmlInput: { maxLength: MAX_LENGTH } } }
                            fullWidth
                        />
                    ) }

                    <TextField
                        label="Nomor kontak (opsional)"
                        name="contactNumber"
                        value={ form.contactNumber }
                        inputRef={ element => { fieldRefs.current.contactNumber = element; } }
                        error={ Boolean(errors.contactNumber) }
                        helperText={ errors.contactNumber || `${ form.contactNumber.length }/${ MAX_LENGTH }` }
                        onChange={ handleChange }
                        onBlur={ () => handleBlur('contactNumber') }
                        slotProps={ { htmlInput: { maxLength: MAX_LENGTH } } }
                        fullWidth
                    />

                    <TextField
                        label="Alamat (opsional)"
                        name="address"
                        value={ form.address }
                        inputRef={ element => { fieldRefs.current.address = element; } }
                        error={ Boolean(errors.address) }
                        helperText={ errors.address || `${ form.address.length }/${ MAX_LENGTH }` }
                        onChange={ handleChange }
                        onBlur={ () => handleBlur('address') }
                        slotProps={ { htmlInput: { maxLength: MAX_LENGTH } } }
                        multiline
                        minRows={ 3 }
                        fullWidth
                        className="sm:col-span-2"
                    />
                </fieldset>

                <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="contained" disabled={ interactionDisabled } aria-busy={ isSubmitting }>
                        { isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan perubahan' : 'Buat pemasok' }
                    </Button>
                    <Button
                        component={ Link }
                        to={ cancelTo }
                        state={ detailPath ? { from: listReturnTo } : undefined }
                        disabled={ interactionDisabled }
                    >
                        Batal
                    </Button>
                </div>

                { isSubmitting && (
                    <div role="status" aria-live="polite" className="flex items-center gap-2 text-gray-700">
                        <CircularProgress size={ 18 } aria-hidden="true" />
                        Menyimpan pemasok...
                    </div>
                ) }
            </Paper>
        </div>
    );
}
