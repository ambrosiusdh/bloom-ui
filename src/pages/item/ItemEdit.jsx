import {
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    Button,
    CircularProgress,
    FormControlLabel,
    InputAdornment,
    MenuItem,
    Switch,
    TextField
} from '@mui/material';

import {
    useBreadcrumbStore,
    useItemStore
} from '@stores/index.js';

const UNIT_OF_MEASURE_OPTIONS = [
    { value: 'PIECE', label: 'Pcs (satuan)' },
    { value: 'METER', label: 'Meter' },
    { value: 'KILOGRAM', label: 'Kilogram' },
    { value: 'LITER', label: 'Liter' }
];

const EMPTY_FORM_DATA = {
    sku: '',
    name: '',
    description: '',
    price: '',
    baseUnitOfMeasure: 'PIECE',
    fractionalQuantityAllowed: false
};

const EMPTY_ERRORS = Object.fromEntries(
    Object.keys(EMPTY_FORM_DATA).map(field => [field, ''])
);

const FIELD_ORDER = [
    'name', 'sku', 'price', 'baseUnitOfMeasure', 'fractionalQuantityAllowed', 'description'
];

const DECIMAL_PATTERN = /^\d+(?:[.,]\d+)?$/;
const MEASUREMENT_LOCK_ID = 'item-measurement-lock-explanation';
const FRACTIONAL_POLICY_HELP_ID = 'item-fractional-policy-help';

const normalizeDecimal = value => String(value ?? '').trim().replace(',', '.');

const validatePrice = value => {
    const trimmedValue = String(value ?? '').trim();
    if (!trimmedValue) {
        return 'Harga jual wajib diisi.';
    }
    if (!DECIMAL_PATTERN.test(trimmedValue)) {
        return 'Gunakan angka tanpa pemisah ribuan; desimal boleh memakai koma atau titik.';
    }

    const [integerPart, fractionalPart = ''] = normalizeDecimal(trimmedValue).split('.');
    if (integerPart.length > 15) {
        return 'Maksimal 15 angka sebelum tanda desimal.';
    }
    if (fractionalPart.length > 4) {
        return 'Maksimal 4 angka di belakang tanda desimal.';
    }
    return '';
};

const getValidationErrors = (formData, lockState) => ({
    ...EMPTY_ERRORS,
    sku: !formData.sku.trim()
        ? 'SKU wajib diisi.'
        : formData.sku.length > 100
            ? 'SKU maksimal 100 karakter.'
            : '',
    name: !formData.name.trim()
        ? 'Nama barang wajib diisi.'
        : formData.name.length > 255
            ? 'Nama barang maksimal 255 karakter.'
            : '',
    description: formData.description.length > 255
        ? 'Deskripsi maksimal 255 karakter.'
        : '',
    price: validatePrice(formData.price),
    baseUnitOfMeasure: lockState.baseUnitOfMeasureLocked
        ? ''
        : UNIT_OF_MEASURE_OPTIONS.some(option => option.value === formData.baseUnitOfMeasure)
            ? ''
            : 'Satuan dasar wajib dipilih.',
    fractionalQuantityAllowed: ''
});

const getBackendValidationMessage = detail => {
    if (detail.message === 'must not be blank' || detail.message === 'must not be null') {
        return `${ detail.field } wajib diisi.`;
    }
    return detail.message || `${ detail.field } tidak valid.`;
};

const assertExplicitLockState = item => {
    if (typeof item?.baseUnitOfMeasureLocked !== 'boolean'
            || typeof item?.fractionalQuantityAllowedLocked !== 'boolean') {
        throw new Error(
            'Server belum memberikan status kunci satuan dan kebijakan pecahan secara lengkap.'
        );
    }
};

const toFormData = item => ({
    sku: item.sku ?? '',
    name: item.name ?? '',
    description: item.description ?? '',
    price: item.price?.toString() ?? '',
    baseUnitOfMeasure: item.baseUnitOfMeasure ?? '',
    fractionalQuantityAllowed: item.fractionalQuantityAllowed === true
});

const createUpdatePayload = (formData, lockState) => {
    const data = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim(),
        price: normalizeDecimal(formData.price)
    };

    if (!lockState.baseUnitOfMeasureLocked) {
        data.baseUnitOfMeasure = formData.baseUnitOfMeasure;
    }
    if (!lockState.fractionalQuantityAllowedLocked) {
        data.fractionalQuantityAllowed = formData.fractionalQuantityAllowed;
    }

    return { data };
};

export default function ItemEdit() {
    const navigate = useNavigate();
    const { sku } = useParams();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const getItemDetails = useItemStore(state => state.getItemDetails);
    const updateItem = useItemStore(state => state.updateItem);

    const [item, setItem] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM_DATA);
    const [errorData, setErrorData] = useState(EMPTY_ERRORS);
    const [loadError, setLoadError] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [refreshMessage, setRefreshMessage] = useState('');
    const [hasConflict, setHasConflict] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fieldRefs = useRef({});
    const requestControllerRef = useRef(null);
    const submitInProgressRef = useRef(false);
    const errorAlertRef = useRef(null);
    const loadErrorRef = useRef(null);
    const refreshStatusRef = useRef(null);
    const pendingFieldFocusRef = useRef('');

    const loadItem = useCallback(async ({ conflictRefresh = false } = {}) => {
        requestControllerRef.current?.abort();
        const controller = new AbortController();
        requestControllerRef.current = controller;

        if (conflictRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
            setLoadError('');
        }
        setErrorMessage('');
        setRefreshMessage('');

        try {
            const response = await getItemDetails(sku, { signal: controller.signal });
            if (controller.signal.aborted) {
                return;
            }

            assertExplicitLockState(response.data);
            setItem(response.data);
            setFormData(toFormData(response.data));
            setErrorData(EMPTY_ERRORS);
            setHasConflict(false);
            if (conflictRefresh) {
                setRefreshMessage('Data terbaru berhasil dimuat. Periksa kembali sebelum menyimpan.');
            }
        } catch (error) {
            if (controller.signal.aborted) {
                return;
            }

            const message = error?.message || 'Data barang gagal dimuat. Silakan coba lagi.';
            if (conflictRefresh) {
                setErrorMessage(message);
            } else {
                setLoadError(message);
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        }
    }, [getItemDetails, sku]);

    const handleFieldChange = event => {
        const { name, value } = event.target;
        setFormData(previous => ({ ...previous, [name]: value }));
        setErrorData(previous => ({ ...previous, [name]: '' }));
        setErrorMessage('');
        setRefreshMessage('');
    };

    const handleFieldBlur = name => {
        const nextErrors = getValidationErrors(formData, item);
        setErrorData(previous => ({ ...previous, [name]: nextErrors[name] }));
    };

    const handleFractionalPolicyChange = event => {
        setFormData(previous => ({
            ...previous,
            fractionalQuantityAllowed: event.target.checked
        }));
        setErrorMessage('');
        setRefreshMessage('');
    };

    const submitItem = async event => {
        event.preventDefault();
        if (submitInProgressRef.current || hasConflict || !item) {
            return;
        }

        const nextErrors = getValidationErrors(formData, item);
        setErrorData(nextErrors);
        const firstInvalidField = FIELD_ORDER.find(field => nextErrors[field]);
        if (firstInvalidField) {
            fieldRefs.current[firstInvalidField]?.focus();
            return;
        }

        submitInProgressRef.current = true;
        setIsSubmitting(true);
        setErrorMessage('');
        setRefreshMessage('');
        pendingFieldFocusRef.current = '';
        const submittedFormData = { ...formData };

        try {
            const response = await updateItem(
                sku,
                createUpdatePayload(submittedFormData, item)
            );
            const updatedItem = response.data;
            const params = new URLSearchParams({
                message: `Barang [${ updatedItem.sku }] ${ updatedItem.name } berhasil diperbarui.`,
                messageType: 'success'
            });
            navigate(`/items?${ params.toString() }`);
        } catch (error) {
            if (error?.validationErrors?.length) {
                const backendErrors = { ...EMPTY_ERRORS };
                error.validationErrors.forEach(detail => {
                    if (detail.field in backendErrors) {
                        backendErrors[detail.field] = getBackendValidationMessage(detail);
                    }
                });
                setErrorData(previous => ({ ...previous, ...backendErrors }));
                const invalidField = FIELD_ORDER.find(field => backendErrors[field]);
                if (invalidField) {
                    pendingFieldFocusRef.current = invalidField;
                    return;
                }
            }

            if (error?.category === 'conflict') {
                setHasConflict(true);
                setErrorMessage(
                    'Barang berubah atau aturan satuannya baru saja dikunci. '
                    + 'Muat ulang data terbaru sebelum mencoba lagi.'
                );
            } else {
                setErrorMessage(error?.message || 'Barang gagal diperbarui. Silakan coba lagi.');
            }
        } finally {
            submitInProgressRef.current = false;
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        setBreadcrumbs([{ to: '/items', label: 'Data Barang' }, `Ubah ${ sku }`]);
        loadItem();
        return () => {
            requestControllerRef.current?.abort();
            submitInProgressRef.current = false;
        };
    }, [loadItem, setBreadcrumbs, sku]);

    useEffect(() => {
        if (loadError) {
            loadErrorRef.current?.focus();
        }
    }, [loadError]);

    useEffect(() => {
        if (errorMessage) {
            errorAlertRef.current?.focus();
        }
    }, [errorMessage]);

    useEffect(() => {
        if (refreshMessage) {
            refreshStatusRef.current?.focus();
        }
    }, [refreshMessage]);

    useEffect(() => {
        const field = pendingFieldFocusRef.current;
        if (isSubmitting || !field || !errorData[field]) {
            return;
        }
        pendingFieldFocusRef.current = '';
        fieldRefs.current[field]?.focus();
    }, [errorData, isSubmitting]);

    if (isLoading) {
        return (
            <Alert severity="info" role="status" className="w-full max-w-4xl">
                Memuat data barang...
            </Alert>
        );
    }

    if (loadError || !item) {
        return (
            <Alert
                ref={ loadErrorRef }
                severity="error"
                tabIndex={ -1 }
                className="w-full max-w-4xl"
                action={ (
                    <Button color="inherit" onClick={ () => loadItem() }>
                        Coba lagi
                    </Button>
                ) }
            >
                { loadError || 'Data barang tidak tersedia.' }
            </Alert>
        );
    }

    const measurementRulesLocked = item.baseUnitOfMeasureLocked
        || item.fractionalQuantityAllowedLocked;
    const interactionDisabled = isSubmitting || isRefreshing || hasConflict;

    return (
        <div className="item-edit">
            <div className="mb-4">
                <h2 className="font-bold text-2xl">Ubah barang { item.sku }</h2>
                <p className="mt-1 text-slate-600">
                    Halaman ini hanya mengubah informasi barang dan aturan satuannya.
                    Stok STORE dan WAREHOUSE tidak dapat diedit di sini.
                </p>
            </div>

            { errorMessage && (
                <Alert
                    ref={ errorAlertRef }
                    severity="error"
                    tabIndex={ -1 }
                    className="mb-4 w-full max-w-4xl"
                    action={ hasConflict ? (
                        <Button
                            color="inherit"
                            disabled={ isRefreshing }
                            onClick={ () => loadItem({ conflictRefresh: true }) }
                        >
                            { isRefreshing ? 'Memuat...' : 'Muat ulang data' }
                        </Button>
                    ) : undefined }
                >
                    { errorMessage }
                </Alert>
            ) }

            { refreshMessage && (
                <Alert
                    ref={ refreshStatusRef }
                    severity="success"
                    role="status"
                    tabIndex={ -1 }
                    className="mb-4 w-full max-w-4xl"
                >
                    { refreshMessage }
                </Alert>
            ) }

            <form
                className="card p-4 w-full max-w-4xl"
                onSubmit={ submitItem }
                noValidate
            >
                <fieldset className="border border-slate-300 rounded p-4 mb-4">
                    <legend className="px-2 font-semibold">Informasi barang yang dapat diubah</legend>
                    <div className="flex flex-wrap items-start gap-4 mb-4">
                        <TextField
                            label="Nama barang"
                            name="name"
                            value={ formData.name }
                            inputRef={ element => { fieldRefs.current.name = element; } }
                            autoFocus
                            disabled={ interactionDisabled }
                            error={ !!errorData.name }
                            helperText={ errorData.name }
                            onChange={ handleFieldChange }
                            onBlur={ () => handleFieldBlur('name') }
                            size="small"
                            className="flex-1 min-w-60"
                        />
                        <TextField
                            label="SKU"
                            name="sku"
                            value={ formData.sku }
                            inputRef={ element => { fieldRefs.current.sku = element; } }
                            disabled={ interactionDisabled }
                            error={ !!errorData.sku }
                            helperText={ errorData.sku || 'Harus unik, maksimal 100 karakter.' }
                            onChange={ handleFieldChange }
                            onBlur={ () => handleFieldBlur('sku') }
                            size="small"
                            className="flex-1 min-w-60"
                        />
                    </div>

                    <div className="flex flex-wrap items-start gap-4 mb-4">
                        <TextField
                            label="Harga jual"
                            name="price"
                            value={ formData.price }
                            inputRef={ element => { fieldRefs.current.price = element; } }
                            disabled={ interactionDisabled }
                            error={ !!errorData.price }
                            helperText={ errorData.price || 'Tanpa pemisah ribuan; maksimal 4 desimal.' }
                            onChange={ handleFieldChange }
                            onBlur={ () => handleFieldBlur('price') }
                            size="small"
                            className="flex-1 min-w-60"
                            slotProps={ {
                                htmlInput: { inputMode: 'decimal' },
                                input: {
                                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                                }
                            } }
                        />
                        <TextField
                            label="Kategori barang"
                            value={ item.category
                                ? `[${ item.category.code }] ${ item.category.name }`
                                : 'Tidak tersedia' }
                            disabled
                            helperText="Kategori tidak termasuk kontrak perubahan barang ini."
                            size="small"
                            className="flex-1 min-w-60"
                        />
                    </div>

                    <TextField
                        label="Deskripsi barang (opsional)"
                        name="description"
                        value={ formData.description }
                        inputRef={ element => { fieldRefs.current.description = element; } }
                        disabled={ interactionDisabled }
                        error={ !!errorData.description }
                        helperText={ errorData.description || `${ formData.description.length }/255` }
                        onChange={ handleFieldChange }
                        onBlur={ () => handleFieldBlur('description') }
                        multiline
                        rows={ 4 }
                        fullWidth
                    />
                </fieldset>

                <fieldset className="border border-slate-300 rounded p-4 mb-4">
                    <legend className="px-2 font-semibold">Aturan satuan dan jumlah</legend>
                    { measurementRulesLocked && (
                        <Alert
                            id={ MEASUREMENT_LOCK_ID }
                            severity="info"
                            className="mb-4"
                        >
                            Aturan yang bertanda terkunci tidak dapat diubah karena barang sudah
                            memiliki pergerakan stok. Mengubahnya akan membuat arti riwayat jumlah
                            lama menjadi tidak jelas.
                        </Alert>
                    ) }

                    <div className="flex flex-wrap items-start gap-4">
                        <TextField
                            select
                            label="Satuan dasar (UOM)"
                            name="baseUnitOfMeasure"
                            value={ formData.baseUnitOfMeasure }
                            inputRef={ element => { fieldRefs.current.baseUnitOfMeasure = element; } }
                            disabled={ interactionDisabled || item.baseUnitOfMeasureLocked }
                            error={ !!errorData.baseUnitOfMeasure }
                            helperText={ errorData.baseUnitOfMeasure || (
                                item.baseUnitOfMeasureLocked
                                    ? 'Terkunci setelah pergerakan stok pertama.'
                                    : 'Semua jumlah barang dicatat dalam satuan ini.'
                            ) }
                            onChange={ handleFieldChange }
                            onBlur={ () => handleFieldBlur('baseUnitOfMeasure') }
                            size="small"
                            className="flex-1 min-w-60"
                            slotProps={ {
                                htmlInput: item.baseUnitOfMeasureLocked
                                    ? { 'aria-describedby': MEASUREMENT_LOCK_ID }
                                    : undefined
                            } }
                        >
                            { UNIT_OF_MEASURE_OPTIONS.map(option => (
                                <MenuItem key={ option.value } value={ option.value }>
                                    { option.label }
                                </MenuItem>
                            )) }
                        </TextField>

                        <div className="flex-1 min-w-60">
                            <FormControlLabel
                                control={ (
                                    <Switch
                                        checked={ formData.fractionalQuantityAllowed }
                                        onChange={ handleFractionalPolicyChange }
                                        disabled={ interactionDisabled
                                            || item.fractionalQuantityAllowedLocked }
                                        name="fractionalQuantityAllowed"
                                        inputRef={ element => {
                                            fieldRefs.current.fractionalQuantityAllowed = element;
                                        } }
                                        inputProps={ {
                                            'aria-describedby': item.fractionalQuantityAllowedLocked
                                                ? `${ MEASUREMENT_LOCK_ID } ${ FRACTIONAL_POLICY_HELP_ID }`
                                                : FRACTIONAL_POLICY_HELP_ID
                                        } }
                                    />
                                ) }
                                label="Izinkan jumlah pecahan"
                            />
                            <p id={ FRACTIONAL_POLICY_HELP_ID } className="text-sm text-slate-600">
                                { item.fractionalQuantityAllowedLocked
                                    ? 'Terkunci setelah pergerakan stok pertama.'
                                    : 'Aktifkan untuk jumlah seperti 0,5 meter atau 1,25 kilogram.' }
                            </p>
                        </div>
                    </div>
                </fieldset>

                <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="contained" disabled={ interactionDisabled }>
                        { isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <CircularProgress size={ 18 } color="inherit" />
                                Menyimpan...
                            </span>
                        ) : 'Simpan perubahan' }
                    </Button>
                    <Button
                        type="button"
                        variant="text"
                        disabled={ isSubmitting || isRefreshing }
                        onClick={ () => navigate(-1) }
                    >
                        Kembali
                    </Button>
                </div>
            </form>
        </div>
    );
}
