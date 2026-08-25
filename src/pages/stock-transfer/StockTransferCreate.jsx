import {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Alert,
    Button,
    CircularProgress,
    MenuItem,
    Paper,
    TextField
} from '@mui/material';
import { ArrowLeftRightIcon } from 'lucide-react';

import { API_ERROR_CATEGORY } from '@api/index.js';
import BloomConfirmationModal from '@components/_ui/BloomConfirmationModal.jsx';
import {
    useBreadcrumbStore,
    useItemStore,
    useStockTransferStore
} from '@stores/index.js';
import { formatQuantity, formatUnitOfMeasure } from '@utils/quantity-utils.js';

const LOCATIONS = ['STORE', 'WAREHOUSE'];
const LOCATION_LABELS = {
    STORE: 'Toko (STORE)',
    WAREHOUSE: 'Gudang (WAREHOUSE)'
};
const EMPTY_FORM = {
    itemSku: '',
    sourceLocation: 'WAREHOUSE',
    destinationLocation: 'STORE',
    quantity: '',
    description: ''
};
const EMPTY_ERRORS = {
    itemSku: '',
    sourceLocation: '',
    destinationLocation: '',
    quantity: '',
    description: ''
};
const FIELD_ORDER = [
    'itemSku',
    'sourceLocation',
    'destinationLocation',
    'quantity',
    'description'
];
const DECIMAL_PATTERN = /^\d+(?:[.,]\d+)?$/;

const normalizeDecimal = value => value.trim().replace(',', '.');

const validateQuantity = (value, item) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return 'Jumlah transfer wajib diisi.';
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
    if (!/[1-9]/.test(`${ integerPart }${ fractionalPart }`)) {
        return 'Jumlah transfer harus lebih besar dari 0.';
    }
    if (item && !item.fractionalQuantityAllowed && /[1-9]/.test(fractionalPart)) {
        return 'Barang ini hanya dapat dipindahkan dalam jumlah utuh.';
    }
    return '';
};

const validateForm = (form, item) => ({
    ...EMPTY_ERRORS,
    itemSku: item ? '' : 'Barang wajib dipilih.',
    sourceLocation: LOCATIONS.includes(form.sourceLocation)
        ? '' : 'Lokasi asal wajib dipilih.',
    destinationLocation: LOCATIONS.includes(form.destinationLocation)
        ? form.sourceLocation === form.destinationLocation
            ? 'Lokasi tujuan harus berbeda dari lokasi asal.'
            : ''
        : 'Lokasi tujuan wajib dipilih.',
    quantity: validateQuantity(form.quantity, item),
    description: form.description.length > 255
        ? 'Keterangan maksimal 255 karakter.'
        : ''
});

const createRequestKey = () => {
    const identifier = globalThis.crypto?.randomUUID?.()
        || `${ Date.now() }-${ Math.random().toString(16).slice(2) }`;
    return `stock-transfer-${ identifier }`;
};

const createPayload = (form, item) => ({
    data: {
        sourceLocation: form.sourceLocation,
        destinationLocation: form.destinationLocation,
        description: form.description.trim(),
        lines: [{
            itemSku: item.sku,
            quantity: normalizeDecimal(form.quantity),
            unitOfMeasure: item.baseUnitOfMeasure
        }]
    }
});

const getBackendField = field => {
    if (field?.includes('quantity')) return 'quantity';
    if (field?.includes('itemSku') || field === 'lines') return 'itemSku';
    if (field?.includes('unitOfMeasure')) return 'itemSku';
    return Object.hasOwn(EMPTY_ERRORS, field) ? field : '';
};

export default function StockTransferCreate() {
    const [searchParams] = useSearchParams();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const itemList = useItemStore(state => state.itemList);
    const getItemList = useItemStore(state => state.getItemList);
    const getItemDetails = useItemStore(state => state.getItemDetails);
    const createStockTransfer = useStockTransferStore(state => state.createStockTransfer);
    const clearLastCreatedTransfer = useStockTransferStore(
        state => state.clearLastCreatedTransfer
    );

    const [form, setForm] = useState(() => ({
        ...EMPTY_FORM,
        itemSku: searchParams.get('itemSku') || ''
    }));
    const [errors, setErrors] = useState(EMPTY_ERRORS);
    const [isLoadingItems, setLoadingItems] = useState(true);
    const [itemsError, setItemsError] = useState('');
    const [itemsRefreshVersion, setItemsRefreshVersion] = useState(0);
    const [confirmationPayload, setConfirmationPayload] = useState(null);
    const [isSubmitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [isConflict, setConflict] = useState(false);
    const [result, setResult] = useState(null);
    const [refreshWarning, setRefreshWarning] = useState('');

    const fieldRefs = useRef({});
    const itemsErrorRef = useRef(null);
    const submitErrorRef = useRef(null);
    const submitInProgressRef = useRef(false);
    const requestIdentityRef = useRef({ signature: '', key: '' });

    const activeItems = useMemo(
        () => itemList.filter(item => item.active !== false),
        [itemList]
    );
    const selectedItem = activeItems.find(item => item.sku === form.itemSku) || null;
    const sourceStockField = form.sourceLocation === 'STORE'
        ? 'stockStore' : 'stockWarehouse';

    useEffect(() => {
        setBreadcrumbs(['Persediaan', 'Transfer Stok']);
        clearLastCreatedTransfer();
    }, [clearLastCreatedTransfer, setBreadcrumbs]);

    useEffect(() => {
        const controller = new AbortController();
        setLoadingItems(true);
        setItemsError('');

        getItemList({
            signal: controller.signal,
            params: { page: 1, size: 2000, isRemoved: false }
        }).catch(error => {
            if (!controller.signal.aborted) {
                setItemsError(error?.message || 'Daftar barang gagal dimuat.');
            }
        }).finally(() => {
            if (!controller.signal.aborted) {
                setLoadingItems(false);
            }
        });

        return () => controller.abort();
    }, [getItemList, itemsRefreshVersion]);

    useEffect(() => {
        if (itemsError) {
            itemsErrorRef.current?.focus();
        }
    }, [itemsError]);

    useEffect(() => {
        if (submitError) {
            submitErrorRef.current?.focus();
        }
    }, [submitError]);

    const changeField = event => {
        const { name, value } = event.target;
        setForm(previous => ({ ...previous, [name]: value }));
        setErrors(previous => ({ ...previous, [name]: '' }));
        setSubmitError('');
        setConflict(false);
        setResult(null);
        setRefreshWarning('');
    };

    const blurField = name => {
        const nextErrors = validateForm(form, selectedItem);
        setErrors(previous => ({ ...previous, [name]: nextErrors[name] }));
    };

    const swapLocations = () => {
        setForm(previous => ({
            ...previous,
            sourceLocation: previous.destinationLocation,
            destinationLocation: previous.sourceLocation
        }));
        setErrors(previous => ({
            ...previous,
            sourceLocation: '',
            destinationLocation: ''
        }));
        setSubmitError('');
        setConflict(false);
        setResult(null);
    };

    const reviewTransfer = event => {
        event.preventDefault();
        if (submitInProgressRef.current) return;

        const nextErrors = validateForm(form, selectedItem);
        setErrors(nextErrors);
        const firstInvalidField = FIELD_ORDER.find(field => nextErrors[field]);
        if (firstInvalidField) {
            fieldRefs.current[firstInvalidField]?.focus();
            return;
        }

        setSubmitError('');
        setConflict(false);
        setConfirmationPayload(createPayload(form, selectedItem));
    };

    const refreshAffectedData = async itemSku => {
        const refreshResults = await Promise.allSettled([
            getItemDetails(itemSku),
            getItemList({ params: { page: 1, size: 2000, isRemoved: false } })
        ]);
        return refreshResults.every(refreshResult => refreshResult.status === 'fulfilled');
    };

    const confirmTransfer = async () => {
        if (submitInProgressRef.current || !confirmationPayload) return;

        submitInProgressRef.current = true;
        setSubmitting(true);
        setSubmitError('');
        setConflict(false);
        const signature = JSON.stringify(confirmationPayload.data);
        if (requestIdentityRef.current.signature !== signature) {
            requestIdentityRef.current = { signature, key: createRequestKey() };
        }

        try {
            const response = await createStockTransfer(
                confirmationPayload,
                requestIdentityRef.current.key
            );
            setConfirmationPayload(null);
            setResult(response.data);
            setForm(previous => ({
                ...previous,
                quantity: '',
                description: ''
            }));
            setErrors(EMPTY_ERRORS);
            requestIdentityRef.current = { signature: '', key: '' };
            const refreshed = await refreshAffectedData(response.data.lines[0].itemSku);
            if (!refreshed) {
                setRefreshWarning(
                    'Transfer berhasil, tetapi data stok terbaru belum dapat dimuat. Muat ulang sebelum membuat transfer lain.'
                );
            }
        } catch (error) {
            setConfirmationPayload(null);
            if (error?.category === API_ERROR_CATEGORY.VALIDATION) {
                const nextErrors = { ...EMPTY_ERRORS };
                error.validationErrors?.forEach(detail => {
                    const field = getBackendField(detail.field);
                    if (field && !nextErrors[field]) {
                        nextErrors[field] = detail.message || 'Nilai ini ditolak server.';
                    }
                });
                setErrors(nextErrors);
                const firstInvalidField = FIELD_ORDER.find(field => nextErrors[field]);
                if (firstInvalidField) {
                    fieldRefs.current[firstInvalidField]?.focus();
                } else {
                    setSubmitError('Server menolak data transfer. Periksa masukan lalu coba lagi.');
                }
            } else if (error?.category === API_ERROR_CATEGORY.CONFLICT) {
                setConflict(true);
                const refreshed = await refreshAffectedData(form.itemSku);
                setSubmitError(refreshed
                    ? 'Stok berubah saat transfer diproses. Data barang sudah dimuat ulang; periksa stok lalu konfirmasi kembali.'
                    : 'Stok berubah saat transfer diproses dan data terbaru belum dapat dimuat. Muat ulang data sebelum mencoba lagi.');
            } else if (error?.status === 400) {
                await refreshAffectedData(form.itemSku);
                setSubmitError(
                    'Transfer ditolak server, misalnya karena stok asal tidak cukup. Data stok sudah dimuat ulang; periksa lalu coba lagi.'
                );
            } else {
                setSubmitError(
                    error?.message || 'Transfer belum dapat dipastikan. Coba lagi memakai permintaan yang sama.'
                );
            }
        } finally {
            submitInProgressRef.current = false;
            setSubmitting(false);
        }
    };

    const retryItemLoad = () => setItemsRefreshVersion(version => version + 1);
    const interactionDisabled = isSubmitting || isLoadingItems || !!itemsError;

    return (
        <div className="stock-transfer-create max-w-4xl">
            { confirmationPayload && (
                <BloomConfirmationModal
                    title="Konfirmasi transfer stok"
                    confirmButtonText={ isSubmitting ? 'Memindahkan...' : 'Pindahkan stok' }
                    onCancel={ () => setConfirmationPayload(null) }
                    onConfirm={ confirmTransfer }
                    isPending={ isSubmitting }
                    focusCancel
                >
                    <div className="space-y-2">
                        <p>
                            Pindahkan <strong>{ formatQuantity(
                                confirmationPayload.data.lines[0].quantity,
                                confirmationPayload.data.lines[0].unitOfMeasure
                            ) }</strong> dari <strong>{ LOCATION_LABELS[
                                confirmationPayload.data.sourceLocation
                            ] }</strong> ke <strong>{ LOCATION_LABELS[
                                confirmationPayload.data.destinationLocation
                            ] }</strong>?
                        </p>
                        <p className="text-sm text-slate-600">
                            Server akan memeriksa stok dan mencatat kedua pergerakan secara atomik.
                        </p>
                    </div>
                </BloomConfirmationModal>
            ) }

            <div className="mb-4">
                <h2 className="font-bold text-2xl">Transfer stok</h2>
                <p className="mt-1 text-slate-600">
                    Pindahkan satu barang antara toko dan gudang melalui satu transaksi server.
                </p>
            </div>

            { isLoadingItems && (
                <Alert severity="info" className="mb-4" role="status">
                    <span className="inline-flex items-center gap-2">
                        <CircularProgress size={ 18 } /> Memuat barang aktif...
                    </span>
                </Alert>
            ) }

            { itemsError && (
                <Alert
                    severity="error"
                    className="mb-4"
                    tabIndex={ -1 }
                    ref={ itemsErrorRef }
                    action={ (
                        <Button color="inherit" size="small" onClick={ retryItemLoad }>
                            Coba lagi
                        </Button>
                    ) }
                >
                    { itemsError }
                </Alert>
            ) }

            { !isLoadingItems && !itemsError && activeItems.length === 0 && (
                <Alert severity="info" className="mb-4">
                    Belum ada barang aktif yang dapat ditransfer.
                </Alert>
            ) }

            { submitError && (
                <Alert
                    severity={ isConflict ? 'warning' : 'error' }
                    className="mb-4"
                    tabIndex={ -1 }
                    ref={ submitErrorRef }
                    action={ isConflict ? (
                        <Button color="inherit" size="small" onClick={ retryItemLoad }>
                            Muat ulang stok
                        </Button>
                    ) : undefined }
                >
                    { submitError }
                </Alert>
            ) }

            { result && (
                <Alert severity="success" className="mb-4" role="status">
                    <div className="font-semibold">Transfer { result.code } berhasil.</div>
                    <div>
                        { formatQuantity(result.lines?.[0]?.quantity, result.lines?.[0]?.unitOfMeasure) }
                        { ' ' }{ result.lines?.[0]?.itemName || result.lines?.[0]?.itemSku }
                        { ' ' }dipindahkan dari { LOCATION_LABELS[result.sourceLocation] }
                        { ' ' }ke { LOCATION_LABELS[result.destinationLocation] }.
                    </div>
                </Alert>
            ) }

            { refreshWarning && (
                <Alert severity="warning" className="mb-4">
                    { refreshWarning }
                </Alert>
            ) }

            <Paper component="form" className="p-4" onSubmit={ reviewTransfer } noValidate>
                <fieldset disabled={ interactionDisabled || activeItems.length === 0 }>
                    <legend className="sr-only">Data transfer stok</legend>

                    <TextField
                        select
                        fullWidth
                        size="small"
                        className="mb-4"
                        label="Barang"
                        name="itemSku"
                        value={ selectedItem ? form.itemSku : '' }
                        inputRef={ element => { fieldRefs.current.itemSku = element; } }
                        error={ !!errors.itemSku }
                        helperText={ errors.itemSku || 'Pilih satu barang aktif.' }
                        onChange={ changeField }
                        onBlur={ () => blurField('itemSku') }
                    >
                        { activeItems.map(item => (
                            <MenuItem key={ item.sku } value={ item.sku }>
                                [{ item.sku }] { item.name }
                            </MenuItem>
                        )) }
                    </TextField>

                    { selectedItem && (
                        <Alert severity="info" className="mb-4">
                            <div>
                                Satuan: <strong>{ formatUnitOfMeasure(
                                    selectedItem.baseUnitOfMeasure
                                ) }</strong>. { selectedItem.fractionalQuantityAllowed
                                    ? 'Jumlah pecahan diperbolehkan.'
                                    : 'Jumlah harus utuh.' }
                            </div>
                            <div className="mt-1 text-sm">
                                Stok server saat dimuat — STORE: { formatQuantity(
                                    selectedItem.stockStore,
                                    selectedItem.baseUnitOfMeasure
                                ) }; WAREHOUSE: { formatQuantity(
                                    selectedItem.stockWarehouse,
                                    selectedItem.baseUnitOfMeasure
                                ) }. Ketersediaan diperiksa ulang oleh server saat konfirmasi.
                            </div>
                        </Alert>
                    ) }

                    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[1fr_auto_1fr]">
                        <TextField
                            select
                            size="small"
                            label="Lokasi asal"
                            name="sourceLocation"
                            value={ form.sourceLocation }
                            inputRef={ element => { fieldRefs.current.sourceLocation = element; } }
                            error={ !!errors.sourceLocation }
                            helperText={ errors.sourceLocation || (selectedItem
                                ? `Stok terlihat: ${ formatQuantity(
                                    selectedItem[sourceStockField],
                                    selectedItem.baseUnitOfMeasure
                                ) }`
                                : 'Pilih lokasi stok yang akan dikurangi server.') }
                            onChange={ changeField }
                            onBlur={ () => blurField('sourceLocation') }
                        >
                            { LOCATIONS.map(location => (
                                <MenuItem key={ location } value={ location }>
                                    { LOCATION_LABELS[location] }
                                </MenuItem>
                            )) }
                        </TextField>

                        <Button
                            type="button"
                            variant="outlined"
                            className="md:mt-1"
                            startIcon={ <ArrowLeftRightIcon aria-hidden="true" /> }
                            onClick={ swapLocations }
                            aria-label="Tukar lokasi asal dan tujuan"
                        >
                            Tukar
                        </Button>

                        <TextField
                            select
                            size="small"
                            label="Lokasi tujuan"
                            name="destinationLocation"
                            value={ form.destinationLocation }
                            inputRef={ element => { fieldRefs.current.destinationLocation = element; } }
                            error={ !!errors.destinationLocation }
                            helperText={ errors.destinationLocation
                                || 'Harus berbeda dari lokasi asal.' }
                            onChange={ changeField }
                            onBlur={ () => blurField('destinationLocation') }
                        >
                            { LOCATIONS.map(location => (
                                <MenuItem
                                    key={ location }
                                    value={ location }
                                    disabled={ location === form.sourceLocation }
                                >
                                    { LOCATION_LABELS[location] }
                                </MenuItem>
                            )) }
                        </TextField>
                    </div>

                    <TextField
                        fullWidth
                        size="small"
                        className="mt-4"
                        label="Jumlah transfer"
                        name="quantity"
                        value={ form.quantity }
                        inputRef={ element => { fieldRefs.current.quantity = element; } }
                        error={ !!errors.quantity }
                        helperText={ errors.quantity || (selectedItem
                            ? `Gunakan ${ formatUnitOfMeasure(selectedItem.baseUnitOfMeasure) }; maksimal 4 angka desimal.`
                            : 'Pilih barang untuk melihat aturan jumlah.') }
                        onChange={ changeField }
                        onBlur={ () => blurField('quantity') }
                        slotProps={ { htmlInput: { inputMode: 'decimal' } } }
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={ 3 }
                        size="small"
                        className="mt-4"
                        label="Keterangan (opsional)"
                        name="description"
                        value={ form.description }
                        inputRef={ element => { fieldRefs.current.description = element; } }
                        error={ !!errors.description }
                        helperText={ errors.description || `${ form.description.length }/255` }
                        onChange={ changeField }
                        onBlur={ () => blurField('description') }
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={ interactionDisabled || activeItems.length === 0 }
                        >
                            Tinjau transfer
                        </Button>
                        <Button type="button" variant="text" onClick={ retryItemLoad }>
                            Muat ulang stok
                        </Button>
                    </div>
                </fieldset>
            </Paper>
        </div>
    );
}
