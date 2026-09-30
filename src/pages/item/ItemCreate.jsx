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
    {
        value: 'PIECE',
        label: 'Pcs (satuan)'
    },
    {
        value: 'METER',
        label: 'Meter'
    },
    {
        value: 'KILOGRAM',
        label: 'Kilogram'
    },
    {
        value: 'LITER',
        label: 'Liter'
    }
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
    'name',
    'sku',
    'categoryCode',
    'price',
    'description',
    'baseUnitOfMeasure',
    'fractionalQuantityAllowed',
    'stockStore',
    'stockWarehouse'
];

const OPENING_FIELDS = [
    {
        name: 'stockStore',
        locationName: 'Toko',
        locationCode: 'STORE'
    },
    {
        name: 'stockWarehouse',
        locationName: 'Gudang',
        locationCode: 'WAREHOUSE'
    }
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
    const [validationMessage, setValidationMessage] = useState('');
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
        setValidationMessage('');
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
        setValidationMessage('');
        setErrorMessage('');
    };

    const handleAutoSkuChange = event => {
        const nextIsAutoSku = event.target.checked;
        setIsAutoSku(nextIsAutoSku);
        setErrorData(previous => ({ ...previous, sku: '' }));
        setValidationMessage('');
        setErrorMessage('');
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
            setValidationMessage(
                'Periksa data barang. Perbaiki kolom yang ditandai sebelum menyimpan.'
            );
            fieldRefs.current[firstInvalidField]?.focus();
            return;
        }
        if (isLoadingCategories || categoryError || !itemCategoryList.length) {
            setErrorMessage('Kategori aktif belum tersedia. Muat ulang kategori sebelum membuat barang.');
            return;
        }

        submitInProgressRef.current = true;
        setIsSubmitting(true);
        setValidationMessage('');
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
                const submittedSku = isAutoSku ? '' : submittedFormData.sku.trim();

                if (submittedSku) {
                    setErrorData(previous => ({
                        ...previous,
                        sku: `Kode ${ submittedSku } sudah digunakan. Gunakan kode lain.`
                    }));
                }
                setErrorMessage(
                    submittedSku
                        ? `Kode ${ submittedSku } sudah digunakan. Gunakan kode lain. `
                            + 'Nilai lain yang sudah Anda isi tetap dipertahankan.'
                        : 'Barang tidak dapat dibuat karena datanya berkonflik dengan data terbaru. '
                            + 'Nilai yang sudah Anda isi tetap dipertahankan; periksa kembali lalu coba lagi.'
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
        if (!isAutoSku) {
            fieldRefs.current.sku?.focus();
        }
    }, [isAutoSku]);

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
                <h1 className="font-bold text-2xl">Tambah barang</h1>
                <p className="mt-1 text-slate-600">
                    Informasi barang dan stok awal disimpan sebagai satu proses.
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

            { validationMessage && (
                <Alert
                    severity="error"
                    className="mb-4 w-full max-w-4xl"
                >
                    { validationMessage }
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
                className="item-create__form card w-full max-w-4xl overflow-hidden"
                onSubmit={ submitItem }
                noValidate
            >
                <section
                    className="border-b border-slate-200 p-4 sm:p-5"
                    aria-labelledby="item-create-identity-heading"
                >
                    <h2 id="item-create-identity-heading" className="text-lg font-semibold">
                        Identitas dan penjualan
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-slate-600">
                        Gunakan nama yang mudah dikenali kasir. SKU dapat dibuat otomatis oleh server.
                    </p>

                    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
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
                        />

                        <div className="rounded-lg border border-slate-200 p-3">
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
                            { isAutoSku ? (
                                <p className="text-sm text-slate-600">
                                    Kode barang dibuat server setelah data disimpan.
                                </p>
                            ) : (
                                <TextField
                                    label="Kode barang (SKU)"
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
                        >
                            { itemCategoryList.map(category => (
                                <MenuItem key={ category.code } value={ category.code }>
                                    [{ category.code }] { category.name }
                                </MenuItem>
                            )) }
                        </TextField>

                        <TextField
                            label="Harga jual"
                            name="price"
                            value={ formData.price }
                            inputRef={ element => { fieldRefs.current.price = element; } }
                            disabled={ isSubmitting }
                            error={ !!errorData.price }
                            helperText={ errorData.price
                                || 'Tanpa pemisah ribuan; maksimal 4 desimal dan tidak dibulatkan.' }
                            onChange={ handleFieldChange }
                            onBlur={ () => handleFieldBlur('price') }
                            size="small"
                            slotProps={ {
                                htmlInput: { inputMode: 'decimal' },
                                input: {
                                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                                }
                            } }
                        />

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
                            rows={ 3 }
                            className="md:col-span-2"
                        />
                    </div>
                </section>

                <section
                    className="border-b border-slate-200 p-4 sm:p-5"
                    aria-labelledby="item-create-quantity-heading"
                >
                    <h2 id="item-create-quantity-heading" className="text-lg font-semibold">
                        Aturan jumlah
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-slate-600">
                        Satuan dasar dan aturan pecahan akan terkunci setelah pergerakan stok pertama.
                    </p>

                    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                        <TextField
                            select
                            label="Satuan dasar (UOM)"
                            name="baseUnitOfMeasure"
                            value={ formData.baseUnitOfMeasure }
                            inputRef={ element => {
                                fieldRefs.current.baseUnitOfMeasure = element;
                            } }
                            disabled={ isSubmitting }
                            error={ !!errorData.baseUnitOfMeasure }
                            helperText={ errorData.baseUnitOfMeasure
                                || 'Semua jumlah barang dicatat dalam satuan ini.' }
                            onChange={ handleFieldChange }
                            onBlur={ () => handleFieldBlur('baseUnitOfMeasure') }
                            size="small"
                        >
                            { UNIT_OF_MEASURE_OPTIONS.map(option => (
                                <MenuItem key={ option.value } value={ option.value }>
                                    { option.label }
                                </MenuItem>
                            )) }
                        </TextField>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
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
                                { formData.fractionalQuantityAllowed
                                    ? 'Jumlah boleh memakai koma atau titik, maksimal empat angka desimal.'
                                    : 'Gunakan jumlah utuh tanpa angka pecahan.' }
                            </p>
                        </div>
                    </div>
                </section>

                <section
                    className="border-b border-slate-200 p-4 sm:p-5"
                    aria-labelledby="item-create-opening-heading"
                >
                    <h2 id="item-create-opening-heading" className="text-lg font-semibold">
                        Stok awal
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-slate-600">
                        Opsional. Kosong berarti 0. Nilai positif dicatat server sebagai
                        { ' ' }OPENING_BALANCE pada lokasi masing-masing dalam transaksi yang sama.
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        { OPENING_FIELDS.map(field => (
                            <div
                                key={ field.name }
                                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="mb-3">
                                    <strong className="block">{ field.locationName }</strong>
                                    <span className="text-sm text-slate-600">
                                        { field.locationCode }
                                    </span>
                                </div>
                                <TextField
                                    label={ `Saldo awal ${ field.locationName } (${ field.locationCode })` }
                                    name={ field.name }
                                    value={ formData[field.name] }
                                    inputRef={ element => {
                                        fieldRefs.current[field.name] = element;
                                    } }
                                    disabled={ isSubmitting }
                                    error={ !!errorData[field.name] }
                                    helperText={ errorData[field.name] || (
                                        formData.fractionalQuantityAllowed
                                            ? 'Maksimal 4 angka desimal.'
                                            : 'Gunakan jumlah utuh.'
                                    ) }
                                    onChange={ handleFieldChange }
                                    onBlur={ () => handleFieldBlur(field.name) }
                                    size="small"
                                    fullWidth
                                    slotProps={ {
                                        htmlInput: { inputMode: 'decimal' }
                                    } }
                                />
                            </div>
                        )) }
                    </div>
                </section>

                <div className="flex flex-wrap gap-2 p-4 sm:p-5">
                    <Button type="submit" variant="contained" disabled={ isSubmitting }>
                        { isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <CircularProgress size={ 18 } color="inherit" />
                                Menyimpan...
                            </span>
                        ) : 'Tambah barang' }
                    </Button>
                    <Button
                        type="button"
                        variant="text"
                        disabled={ isSubmitting }
                        onClick={ () => navigate('/items') }
                    >
                        Kembali ke daftar
                    </Button>
                </div>
            </form>
        </div>
    );
}
