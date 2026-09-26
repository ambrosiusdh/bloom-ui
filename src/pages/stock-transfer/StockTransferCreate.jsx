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
    useAuthStore,
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
const getOppositeLocation = location => location === 'STORE' ? 'WAREHOUSE' : 'STORE';

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
    const authStatus = useAuthStore(state => state.authStatus);
    const currentUser = useAuthStore(state => state.currentUser);
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const itemList = useItemStore(state => state.itemList);
    const getItemList = useItemStore(state => state.getItemList);
    const getItemDetails = useItemStore(state => state.getItemDetails);
    const createStockTransfer = useStockTransferStore(state => state.createStockTransfer);
    const selectStockTransfer = useStockTransferStore(state => state.selectStockTransfer);
    const beginNewStockTransfer = useStockTransferStore(state => state.beginNewStockTransfer);
    const ownerAccountId = useStockTransferStore(state => state.ownerAccountId);
    const transferAttempt = useStockTransferStore(state => state.stockTransferAttempt);
    const transferStatus = useStockTransferStore(state => state.stockTransferCreateStatus);
    const result = useStockTransferStore(state => state.stockTransferResult);

    const [form, setForm] = useState(() => ({
        ...EMPTY_FORM,
        itemSku: searchParams.get('itemSku') || ''
    }));
    const [errors, setErrors] = useState(EMPTY_ERRORS);
    const [isLoadingItems, setLoadingItems] = useState(true);
    const [itemsError, setItemsError] = useState('');
    const [itemsRefreshVersion, setItemsRefreshVersion] = useState(0);
    const [confirmationPayload, setConfirmationPayload] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [isConflict, setConflict] = useState(false);
    const [refreshWarning, setRefreshWarning] = useState('');

    const fieldRefs = useRef({});
    const itemsErrorRef = useRef(null);
    const submitErrorRef = useRef(null);
    const mountedRef = useRef(true);

    const activeItems = useMemo(
        () => itemList.filter(item => item.active !== false),
        [itemList]
    );
    const selectedItem = activeItems.find(item => item.sku === form.itemSku) || null;
    const sourceStockField = form.sourceLocation === 'STORE'
        ? 'stockStore' : 'stockWarehouse';
    const recoveryBelongsToCurrentAccount = !!currentUser?.accountId
        && ownerAccountId === currentUser.accountId;
    const hasForeignRecovery = authStatus === 'authenticated'
        && !!ownerAccountId
        && ownerAccountId !== currentUser?.accountId
        && (!!transferAttempt || !!result);
    const isSubmitting = transferStatus === 'pending';
    const recoveryLocked = !!transferAttempt || !!result || isSubmitting;

    useEffect(() => {
        setBreadcrumbs(['Persediaan', 'Transfer Stok']);
    }, [setBreadcrumbs]);

    useEffect(() => {
        if (authStatus === 'authenticated') {
            selectStockTransfer();
        }
    }, [authStatus, currentUser?.accountId, selectStockTransfer]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

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

    useEffect(() => {
        if (!recoveryBelongsToCurrentAccount || !transferAttempt) {
            return;
        }

        const request = transferAttempt.request;
        const line = request?.lines?.[0];
        if (line) {
            setForm({
                itemSku: line.itemSku || '',
                sourceLocation: request.sourceLocation || 'WAREHOUSE',
                destinationLocation: request.destinationLocation || 'STORE',
                quantity: line.quantity || '',
                description: request.description || ''
            });
        }

        if (transferStatus === 'key_conflict') {
            setConflict(true);
            setSubmitError(
                'Identitas pemulihan transfer bertentangan dengan catatan server. Jangan membuat transfer baru; periksa riwayat stok dan lakukan rekonsiliasi manual.'
            );
        } else if (transferStatus === 'uncertain') {
            setConflict(true);
            setSubmitError(
                'Hasil transfer sebelumnya belum dapat dipastikan. Formulir dikunci. Periksa hasil memakai permintaan dan kunci yang sama.'
            );
        }
    }, [recoveryBelongsToCurrentAccount, transferAttempt, transferStatus]);

    const changeField = event => {
        const { name, value } = event.target;
        setForm(previous => ({ ...previous, [name]: value }));
        setErrors(previous => ({ ...previous, [name]: '' }));
        setSubmitError('');
        setConflict(false);
        setRefreshWarning('');
    };

    const changeLocation = event => {
        const { name, value } = event.target;
        const oppositeLocation = getOppositeLocation(value);
        setForm(previous => ({
            ...previous,
            [name]: value,
            [name === 'sourceLocation' ? 'destinationLocation' : 'sourceLocation']:
                oppositeLocation
        }));
        setErrors(previous => ({
            ...previous,
            sourceLocation: '',
            destinationLocation: ''
        }));
        setSubmitError('');
        setConflict(false);
        setRefreshWarning('');
    };

    const blurField = name => {
        const nextErrors = validateForm(form, selectedItem);
        setErrors(previous => ({ ...previous, [name]: nextErrors[name] }));
    };

    const swapLocations = () => {
        setForm(previous => {
            const sourceLocation = previous.sourceLocation === previous.destinationLocation
                ? getOppositeLocation(previous.sourceLocation)
                : previous.destinationLocation;
            return {
                ...previous,
                sourceLocation,
                destinationLocation: getOppositeLocation(sourceLocation)
            };
        });
        setErrors(previous => ({
            ...previous,
            sourceLocation: '',
            destinationLocation: ''
        }));
        setSubmitError('');
        setConflict(false);
        setRefreshWarning('');
    };

    const reviewTransfer = event => {
        event.preventDefault();
        if (recoveryLocked || !recoveryBelongsToCurrentAccount) return;

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

    const submitTransfer = async payload => {
        setSubmitError('');
        setConflict(false);

        try {
            const response = await createStockTransfer(payload);
            if (!response) return;

            if (mountedRef.current) {
                setConfirmationPayload(null);
                setForm(previous => ({
                    ...previous,
                    quantity: '',
                    description: ''
                }));
                setErrors(EMPTY_ERRORS);
            }
            const refreshed = await refreshAffectedData(response.data.lines[0].itemSku);
            if (mountedRef.current && !refreshed) {
                setRefreshWarning(
                    'Transfer berhasil, tetapi data stok terbaru belum dapat dimuat. Muat ulang sebelum membuat transfer lain.'
                );
            }
        } catch (error) {
            if (mountedRef.current) {
                setConfirmationPayload(null);
            }
            const currentStatus = useStockTransferStore.getState()
                .stockTransferCreateStatus;
            if (error?.category === 'storage') {
                if (mountedRef.current) {
                    setSubmitError(
                        'Pemulihan transfer tidak dapat disimpan di tab ini. Transfer belum dikirim; aktifkan penyimpanan sesi lalu coba lagi.'
                    );
                }
            } else if (error?.category === API_ERROR_CATEGORY.VALIDATION) {
                if (!mountedRef.current) return;
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
            } else if (currentStatus === 'key_conflict') {
                if (mountedRef.current) {
                    setConflict(true);
                    setSubmitError(
                        'Identitas pemulihan transfer bertentangan dengan catatan server. Jangan membuat transfer baru; periksa riwayat stok dan lakukan rekonsiliasi manual.'
                    );
                }
            } else if (currentStatus === 'uncertain') {
                if (mountedRef.current) {
                    setConflict(true);
                    setSubmitError(
                        'Hasil transfer belum dapat dipastikan. Formulir dikunci; periksa hasil dengan permintaan yang sama.'
                    );
                }
            } else if (error?.status === 400) {
                await refreshAffectedData(form.itemSku);
                if (mountedRef.current) {
                    setSubmitError(
                        'Transfer ditolak server, misalnya karena stok asal tidak cukup. Data stok sudah dimuat ulang; periksa lalu coba lagi.'
                    );
                }
            } else if (mountedRef.current) {
                setSubmitError(
                    error?.message || 'Transfer belum dapat dipastikan. Coba lagi memakai permintaan yang sama.'
                );
            }
        }
    };

    const confirmTransfer = async () => {
        if (isSubmitting || !confirmationPayload) return;
        await submitTransfer(confirmationPayload);
    };

    const retryTransfer = async () => {
        if (isSubmitting || !transferAttempt || !recoveryBelongsToCurrentAccount) return;
        await submitTransfer();
    };

    const startAnotherTransfer = () => {
        beginNewStockTransfer();
        setForm({
            ...EMPTY_FORM,
            itemSku: searchParams.get('itemSku') || ''
        });
        setErrors(EMPTY_ERRORS);
        setSubmitError('');
        setConflict(false);
        setRefreshWarning('');
    };

    const retryItemLoad = () => setItemsRefreshVersion(version => version + 1);
    const interactionDisabled = isSubmitting
        || recoveryLocked
        || !recoveryBelongsToCurrentAccount
        || isLoadingItems
        || !!itemsError;

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

            { hasForeignRecovery && (
                <Alert severity="warning" className="mb-4" role="alert">
                    Ada pemulihan transfer milik akun lain di tab ini. Masuk dengan akun asal untuk
                    memeriksa hasilnya; permintaan baru tetap dikunci agar transfer tidak terduplikasi.
                </Alert>
            ) }

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
                    action={ transferStatus === 'uncertain'
                        && recoveryBelongsToCurrentAccount ? (
                        <Button
                            color="inherit"
                            size="small"
                            onClick={ retryTransfer }
                            disabled={ isSubmitting }
                        >
                            Periksa hasil transfer
                        </Button>
                    ) : undefined }
                >
                    { submitError }
                </Alert>
            ) }

            { result && recoveryBelongsToCurrentAccount && (
                <Alert severity="success" className="mb-4" role="status">
                    <div className="font-semibold">Transfer { result.code } berhasil.</div>
                    <div>
                        { formatQuantity(result.lines?.[0]?.quantity, result.lines?.[0]?.unitOfMeasure) }
                        { ' ' }{ result.lines?.[0]?.itemName || result.lines?.[0]?.itemSku }
                        { ' ' }dipindahkan dari { LOCATION_LABELS[result.sourceLocation] }
                        { ' ' }ke { LOCATION_LABELS[result.destinationLocation] }.
                    </div>
                    <Button
                        className="mt-2"
                        color="inherit"
                        size="small"
                        onClick={ startAnotherTransfer }
                    >
                        Buat transfer baru
                    </Button>
                </Alert>
            ) }

            { refreshWarning && (
                <Alert severity="warning" className="mb-4">
                    { refreshWarning }
                </Alert>
            ) }

            <Paper
                component="form"
                className="p-5 md:p-6"
                onSubmit={ reviewTransfer }
                noValidate
            >
                <fieldset
                    disabled={ interactionDisabled || activeItems.length === 0 }
                >
                    <legend className="sr-only">Data transfer stok</legend>

                    <div className="stock-transfer-create__fields flex flex-col gap-6">

                        <TextField
                            select
                            fullWidth
                            size="small"
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
                        <Alert severity="info">
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

                    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-5">
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
                            onChange={ changeLocation }
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
                                || 'Lokasi asal akan menyesuaikan otomatis.' }
                            onChange={ changeLocation }
                            onBlur={ () => blurField('destinationLocation') }
                        >
                            { LOCATIONS.map(location => (
                                <MenuItem
                                    key={ location }
                                    value={ location }
                                >
                                    { LOCATION_LABELS[location] }
                                </MenuItem>
                            )) }
                        </TextField>
                    </div>

                    <TextField
                        fullWidth
                        size="small"
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
                        label="Keterangan (opsional)"
                        name="description"
                        value={ form.description }
                        inputRef={ element => { fieldRefs.current.description = element; } }
                        error={ !!errors.description }
                        helperText={ errors.description || `${ form.description.length }/255` }
                        onChange={ changeField }
                        onBlur={ () => blurField('description') }
                    />

                        <div className="flex flex-wrap gap-3 pt-1">
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
                    </div>
                </fieldset>
            </Paper>
        </div>
    );
}
