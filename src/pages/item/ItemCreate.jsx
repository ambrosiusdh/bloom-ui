import {
    useEffect,
    useRef,
    useState
} from 'react';
import { useNavigate } from 'react-router-dom';
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
    useItemCategoryStore,
    useItemStore
} from '@stores/index.js';

const UNIT_OF_MEASURE_OPTIONS = [
    { value: 'PIECE', label: 'Pcs (satuan)' }, { value: 'METER', label: 'Meter' },
    { value: 'KILOGRAM', label: 'Kilogram' }, { value: 'LITER', label: 'Liter' }
];

const EMPTY_FORM_DATA = {
    sku: '',
    name: '',
    categoryCode: '',
    description: '',
    price: '',
    baseUnitOfMeasure: 'PIECE',
    fractionalQuantityAllowed: false,
    stockStore: '',
    stockWarehouse: ''
};

const EMPTY_ERRORS = Object.fromEntries(
    Object.keys(EMPTY_FORM_DATA).map(field => [field, ''])
);

const FIELD_ORDER = [
    'name', 'categoryCode', 'sku', 'price', 'baseUnitOfMeasure', 'stockStore', 'stockWarehouse'
];

const OPENING_FIELDS = [
    { name: 'stockStore', label: 'Stok awal STORE' },
    { name: 'stockWarehouse', label: 'Stok awal WAREHOUSE' }
];

const DECIMAL_PATTERN = /^\d+(?:[.,]\d+)?$/;

const normalizeDecimal = value => value.trim().replace(',', '.');

const validateDecimal = (value, { allowBlank = false, allowZero = true } = {}) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return allowBlank ? '' : 'Nilai wajib diisi.';
    }
    if (!DECIMAL_PATTERN.test(trimmedValue)) {
        return 'Gunakan angka tanpa pemisah ribuan; desimal boleh memakai koma atau titik.';
    }

    const normalizedValue = normalizeDecimal(trimmedValue);
    const [integerPart, fractionalPart = ''] = normalizedValue.split('.');
    if (integerPart.length > 15) {
        return 'Maksimal 15 angka sebelum tanda desimal.';
    }
    if (fractionalPart.length > 4) {
        return 'Maksimal 4 angka di belakang tanda desimal.';
    }
    if (!allowZero && /^0+(?:\.0+)?$/.test(normalizedValue)) {
        return 'Nilai harus lebih besar dari 0.';
    }
    return '';
};

const validateOpeningQuantity = (value, fractionalQuantityAllowed) => {
    const decimalError = validateDecimal(value, { allowBlank: true });
    if (decimalError || !value.trim() || fractionalQuantityAllowed) {
        return decimalError;
    }

    const [, fractionalPart = ''] = normalizeDecimal(value).split('.');
    return fractionalPart && /[1-9]/.test(fractionalPart)
        ? 'Barang satuan utuh hanya menerima jumlah tanpa pecahan.'
        : '';
};

const getValidationErrors = (formData, isAutoSku) => ({
    ...EMPTY_ERRORS,
    sku: !isAutoSku && !formData.sku.trim()
        ? 'SKU wajib diisi jika pembuatan otomatis dimatikan.'
        : formData.sku.length > 100
            ? 'SKU maksimal 100 karakter.'
            : '',
    name: !formData.name.trim()
        ? 'Nama barang wajib diisi.'
        : formData.name.length > 255
            ? 'Nama barang maksimal 255 karakter.'
            : '',
    categoryCode: formData.categoryCode ? '' : 'Kategori barang wajib dipilih.',
    description: formData.description.length > 255
        ? 'Deskripsi maksimal 255 karakter.'
        : '',
    price: validateDecimal(formData.price, { allowZero: false }),
    baseUnitOfMeasure: UNIT_OF_MEASURE_OPTIONS.some(
        option => option.value === formData.baseUnitOfMeasure
    ) ? '' : 'Satuan dasar wajib dipilih.',
    stockStore: validateOpeningQuantity(
        formData.stockStore,
        formData.fractionalQuantityAllowed
    ),
    stockWarehouse: validateOpeningQuantity(
        formData.stockWarehouse,
        formData.fractionalQuantityAllowed
    )
});

const getBackendValidationMessage = detail => {
    if (detail.message === 'must not be blank' || detail.message === 'must not be null') {
        return `${ detail.field } wajib diisi.`;
    }
    if (detail.message === 'must be greater than or equal to 0') {
        return 'Jumlah awal tidak boleh negatif.';
    }
    return detail.message || `${ detail.field } tidak valid.`;
};

const createPayload = (formData, isAutoSku) => {
    const data = {
        name: formData.name.trim(),
        categoryCode: formData.categoryCode,
        description: formData.description.trim(),
        price: normalizeDecimal(formData.price),
        baseUnitOfMeasure: formData.baseUnitOfMeasure,
        fractionalQuantityAllowed: formData.fractionalQuantityAllowed
    };

    if (!isAutoSku) {
        data.sku = formData.sku.trim();
    }
    if (formData.stockStore.trim()) {
        data.stockStore = normalizeDecimal(formData.stockStore);
    }
    if (formData.stockWarehouse.trim()) {
        data.stockWarehouse = normalizeDecimal(formData.stockWarehouse);
    }

    return { data };
};

export default function ItemCreate() {
    const navigate = useNavigate();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const itemCategoryList = useItemCategoryStore(state => state.itemCategoryList);
    const getItemCategoryList = useItemCategoryStore(state => state.getItemCategoryList);
    const createItem = useItemStore(state => state.createItem);

    const [formData, setFormData] = useState(EMPTY_FORM_DATA);
    const [errorData, setErrorData] = useState(EMPTY_ERRORS);
    const [errorMessage, setErrorMessage] = useState('');
    const [isAutoSku, setIsAutoSku] = useState(true);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState('');
    const [categoryRefreshVersion, setCategoryRefreshVersion] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fieldRefs = useRef({});
    const categoryErrorRef = useRef(null);
    const errorAlertRef = useRef(null);
    const submitInProgressRef = useRef(false);
    const pendingFieldFocusRef = useRef('');
    const mountedRef = useRef(false);

    const handleFieldChange = event => {
        const { name, value } = event.target;
        setFormData(previous => ({ ...previous, [name]: value }));
        setErrorData(previous => ({ ...previous, [name]: '' }));
        setErrorMessage('');
    };

    const handleFieldBlur = name => {
        const nextErrors = getValidationErrors(formData, isAutoSku);
        setErrorData(previous => ({ ...previous, [name]: nextErrors[name] }));
    };

    const handleFractionalPolicyChange = event => {
        const fractionalQuantityAllowed = event.target.checked;
        setFormData(previous => ({ ...previous, fractionalQuantityAllowed }));
        setErrorData(previous => ({
            ...previous,
            fractionalQuantityAllowed: '',
            stockStore: validateOpeningQuantity(formData.stockStore, fractionalQuantityAllowed),
            stockWarehouse: validateOpeningQuantity(
                formData.stockWarehouse,
                fractionalQuantityAllowed
            )
        }));
        setErrorMessage('');
    };

    const handleAutoSkuChange = event => {
        const nextIsAutoSku = event.target.checked;
        setIsAutoSku(nextIsAutoSku);
        setErrorData(previous => ({ ...previous, sku: '' }));
        setErrorMessage('');
        if (!nextIsAutoSku) {
            setTimeout(() => fieldRefs.current.sku?.focus(), 0);
        }
    };

    const submitItem = async event => {
        event.preventDefault();
        if (submitInProgressRef.current) {
            return;
        }

        const nextErrors = getValidationErrors(formData, isAutoSku);
        setErrorData(nextErrors);
        const firstInvalidField = FIELD_ORDER.find(field => nextErrors[field]);
        if (firstInvalidField) {
            fieldRefs.current[firstInvalidField]?.focus();
            return;
        }
        if (isLoadingCategories || categoryError || !itemCategoryList.length) {
            setErrorMessage('Kategori aktif belum tersedia. Muat ulang kategori sebelum membuat barang.');
            return;
        }

        submitInProgressRef.current = true;
        setIsSubmitting(true);
        setErrorMessage('');
        pendingFieldFocusRef.current = '';
        const submittedFormData = { ...formData };

        try {
            const { data: response } = await createItem(
                createPayload(submittedFormData, isAutoSku)
            );
            if (!mountedRef.current) {
                return;
            }

            const createdItem = response.data;
            const params = new URLSearchParams({
                message: `Barang [${ createdItem.sku }] ${ submittedFormData.name.trim() } berhasil dibuat.`,
                messageType: 'success'
            });
            navigate(`/items?${ params.toString() }`);
        } catch (error) {
            if (!mountedRef.current) {
                return;
            }

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
                setErrorMessage(
                    'Barang tidak dapat dibuat karena datanya berkonflik dengan data terbaru. '
                    + 'Periksa SKU, lalu coba lagi.'
                );
            } else if (error?.category === 'not_found') {
                setErrorMessage(
                    'Kategori yang dipilih tidak lagi tersedia. Muat ulang kategori dan coba lagi.'
                );
            } else {
                setErrorMessage(error?.message || 'Barang gagal dibuat. Silakan coba lagi.');
            }
        } finally {
            submitInProgressRef.current = false;
            if (mountedRef.current) {
                setIsSubmitting(false);
            }
        }
    };

    useEffect(() => {
        mountedRef.current = true;
        setBreadcrumbs([{ to: '/items', label: 'Data Barang' }, 'Buat baru']);
        return () => {
            mountedRef.current = false;
            submitInProgressRef.current = false;
        };
    }, [setBreadcrumbs]);

    useEffect(() => {
        const controller = new AbortController();
        setIsLoadingCategories(true);
        setCategoryError('');

        const loadCategories = async () => {
            try {
                await getItemCategoryList({
                    signal: controller.signal,
                    params: { page: 1, size: 2000 }
                });
            } catch (error) {
                if (!controller.signal.aborted) {
                    setCategoryError(
                        error?.message || 'Kategori barang gagal dimuat. Silakan coba lagi.'
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingCategories(false);
                }
            }
        };

        loadCategories();
        return () => controller.abort();
    }, [categoryRefreshVersion, getItemCategoryList]);

    useEffect(() => {
        if (categoryError) {
            categoryErrorRef.current?.focus();
        }
    }, [categoryError]);

    useEffect(() => {
        if (errorMessage) {
            errorAlertRef.current?.focus();
        }
    }, [errorMessage]);

    useEffect(() => {
        const field = pendingFieldFocusRef.current;
        if (isSubmitting || !field || !errorData[field]) {
            return;
        }
        pendingFieldFocusRef.current = '';
        fieldRefs.current[field]?.focus();
    }, [errorData, isSubmitting]);

    return (
        <div className="item-create">
            <div className="item-create__header mb-4">
                <h2 className="font-bold text-2xl">Buat barang baru</h2>
                <p className="mt-1 text-slate-600">
                    Barang dan stok awal STORE/WAREHOUSE akan disimpan dalam satu transaksi.
                </p>
            </div>

            { categoryError && (
                <Alert
                    ref={ categoryErrorRef }
                    severity="error"
                    tabIndex={ -1 }
                    className="mb-4 w-full max-w-4xl"
                    action={ (
                        <Button
                            color="inherit"
                            onClick={ () => setCategoryRefreshVersion(previous => previous + 1) }
                        >
                            Coba lagi
                        </Button>
                    ) }
                >
                    { categoryError }
                </Alert>
            ) }

            { errorMessage && (
                <Alert
                    ref={ errorAlertRef }
                    severity="error"
                    tabIndex={ -1 }
                    className="mb-4 w-full max-w-4xl"
                >
                    { errorMessage }
                </Alert>
            ) }

            { isLoadingCategories && (
                <Alert
                    severity="info"
                    role="status"
                    className="mb-4 w-full max-w-4xl"
                >
                    Memuat kategori aktif...
                </Alert>
            ) }

            { !isLoadingCategories && !categoryError && !itemCategoryList.length && (
                <Alert
                    severity="warning"
                    className="mb-4 w-full max-w-4xl"
                    action={ (
                        <Button color="inherit" onClick={ () => navigate('/item-categories/new') }>
                            Buat kategori
                        </Button>
                    ) }
                >
                    Belum ada kategori aktif. Barang belum dapat dibuat.
                </Alert>
            ) }

            <form
                className="item-create__form card p-4 w-full max-w-4xl"
                onSubmit={ submitItem }
                noValidate
            >
                <div className="flex flex-wrap items-start gap-4 mb-4">
                    <TextField
                        label="Nama barang"
                        name="name"
                        value={ formData.name }
                        inputRef={ element => { fieldRefs.current.name = element; } }
                        autoFocus
                        disabled={ isSubmitting }
                        error={ !!errorData.name }
                        helperText={ errorData.name }
                        onChange={ handleFieldChange }
                        onBlur={ () => handleFieldBlur('name') }
                        size="small"
                        className="flex-1 min-w-60"
                    />
                    <TextField
                        select
                        label="Kategori barang"
                        name="categoryCode"
                        value={ formData.categoryCode }
                        inputRef={ element => { fieldRefs.current.categoryCode = element; } }
                        disabled={ isSubmitting || isLoadingCategories || !!categoryError }
                        error={ !!errorData.categoryCode }
                        helperText={ isLoadingCategories
                            ? 'Memuat kategori...'
                            : errorData.categoryCode
                                || (!itemCategoryList.length ? 'Belum ada kategori aktif.' : '') }
                        onChange={ handleFieldChange }
                        onBlur={ () => handleFieldBlur('categoryCode') }
                        size="small"
                        className="flex-1 min-w-60"
                    >
                        { itemCategoryList.map(category => (
                            <MenuItem key={ category.code } value={ category.code }>
                                [{ category.code }] { category.name }
                            </MenuItem>
                        )) }
                    </TextField>
                </div>

                <div className="mb-4">
                    <FormControlLabel
                        control={ (
                            <Switch
                                checked={ isAutoSku }
                                onChange={ handleAutoSkuChange }
                                disabled={ isSubmitting }
                            />
                        ) }
                        label="Buat SKU otomatis"
                    />
                    { !isAutoSku && (
                        <TextField
                            label="SKU"
                            name="sku"
                            value={ formData.sku }
                            inputRef={ element => { fieldRefs.current.sku = element; } }
                            disabled={ isSubmitting }
                            error={ !!errorData.sku }
                            helperText={ errorData.sku || 'Harus unik, maksimal 100 karakter.' }
                            onChange={ handleFieldChange }
                            onBlur={ () => handleFieldBlur('sku') }
                            size="small"
                            fullWidth
                        />
                    ) }
                </div>

                <div className="flex flex-wrap items-start gap-4 mb-4">
                    <TextField
                        label="Harga jual"
                        name="price"
                        value={ formData.price }
                        inputRef={ element => { fieldRefs.current.price = element; } }
                        disabled={ isSubmitting }
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
                        select
                        label="Satuan dasar (UOM)"
                        name="baseUnitOfMeasure"
                        value={ formData.baseUnitOfMeasure }
                        inputRef={ element => { fieldRefs.current.baseUnitOfMeasure = element; } }
                        disabled={ isSubmitting }
                        error={ !!errorData.baseUnitOfMeasure }
                        helperText={ errorData.baseUnitOfMeasure
                            || 'Semua stok barang ini dicatat dalam satuan ini.' }
                        onChange={ handleFieldChange }
                        onBlur={ () => handleFieldBlur('baseUnitOfMeasure') }
                        size="small"
                        className="flex-1 min-w-60"
                    >
                        { UNIT_OF_MEASURE_OPTIONS.map(option => (
                            <MenuItem key={ option.value } value={ option.value }>
                                { option.label }
                            </MenuItem>
                        )) }
                    </TextField>
                </div>

                <div className="mb-4">
                    <FormControlLabel
                        control={ (
                            <Switch
                                checked={ formData.fractionalQuantityAllowed }
                                onChange={ handleFractionalPolicyChange }
                                disabled={ isSubmitting }
                                name="fractionalQuantityAllowed"
                            />
                        ) }
                        label="Izinkan jumlah pecahan"
                    />
                    <p className="text-sm text-slate-600">
                        Aktifkan untuk jumlah seperti 0,5 meter atau 1,25 kilogram.
                    </p>
                </div>

                <fieldset className="border border-slate-300 rounded p-4 mb-4">
                    <legend className="px-2 font-semibold">Stok awal opsional</legend>
                    <p className="text-sm text-slate-600 mb-4">
                        Kosong berarti 0. Nilai yang diisi dibuat sebagai pergerakan OPENING_BALANCE.
                    </p>
                    <div className="flex flex-wrap items-start gap-4">
                        { OPENING_FIELDS.map(field => (
                            <TextField
                                key={ field.name }
                                label={ field.label }
                                name={ field.name }
                                value={ formData[field.name] }
                                inputRef={ element => { fieldRefs.current[field.name] = element; } }
                                disabled={ isSubmitting }
                                error={ !!errorData[field.name] }
                                helperText={ errorData[field.name] || 'Maksimal 4 angka desimal.' }
                                onChange={ handleFieldChange }
                                onBlur={ () => handleFieldBlur(field.name) }
                                size="small"
                                className="flex-1 min-w-60"
                                slotProps={ { htmlInput: { inputMode: 'decimal' } } }
                            />
                        )) }
                    </div>
                </fieldset>

                <TextField
                    label="Deskripsi barang (opsional)"
                    name="description"
                    value={ formData.description }
                    disabled={ isSubmitting }
                    error={ !!errorData.description }
                    helperText={ errorData.description || `${ formData.description.length }/255` }
                    onChange={ handleFieldChange }
                    onBlur={ () => handleFieldBlur('description') }
                    multiline
                    rows={ 4 }
                    fullWidth
                    className="mb-4"
                />

                <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="contained" disabled={ isSubmitting }>
                        { isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <CircularProgress size={ 18 } color="inherit" />
                                Menyimpan...
                            </span>
                        ) : 'Buat barang' }
                    </Button>
                    <Button
                        type="button"
                        variant="text"
                        disabled={ isSubmitting }
                        onClick={ () => navigate(-1) }
                    >
                        Kembali
                    </Button>
                </div>
            </form>
        </div>
    );
}
