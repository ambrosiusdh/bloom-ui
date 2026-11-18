import {
    useEffect,
    useRef,
    useState
} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Alert,
    Button,
    CircularProgress,
    MenuItem,
    Paper,
    TextField
} from '@mui/material';
import {
    ArrowLeftRightIcon,
    HistoryIcon
} from 'lucide-react';

import { API_ERROR_CATEGORY } from '@api/index.js';
import itemApi from '@api/item.js';
import BloomConfirmationModal from '@components/_ui/BloomConfirmationModal.jsx';
import BloomQuantityField from '@components/_ui/BloomQuantityField.jsx';
import StockTransferFacts from '@components/stock-transfer/StockTransferFacts.jsx';
import StockTransferItemPicker from '@components/stock-transfer/StockTransferItemPicker.jsx';
import {
    useAuthStore,
    useBreadcrumbStore,
    useItemStore,
    useStockTransferStore
} from '@stores/index.js';
import { formatQuantity, formatUnitOfMeasure } from '@utils/quantity-utils.js';
import {
    emptyTransferLine,
    normalizeTransferQuantity,
    TRANSFER_LOCATIONS,
    validateTransferForm
} from '@utils/stock-transfer-utils.js';

const LOCATIONS = ['STORE', 'WAREHOUSE'];
const LOCATION_LABELS = TRANSFER_LOCATIONS;
const EMPTY_FORM = {
    sourceLocation: 'WAREHOUSE',
    destinationLocation: 'STORE',
    description: ''
};
const EMPTY_ERRORS = {};
const ITEM_PAGE_SIZE = 100;

const getOppositeLocation = location => location === 'STORE' ? 'WAREHOUSE' : 'STORE';
const isZeroQuantity = value => /^0+(?:[.,]0*)?$/.test(String(value || '').trim());

const getItemPage = async (page, signal) => {
    const response = await itemApi.getItemList({
        signal,
        params: {
            page,
            size: ITEM_PAGE_SIZE,
            isRemoved: false
        }
    }, { useLoader: false });

    return response.data?.data || {};
};

const loadAllActiveItems = async signal => {
    const firstPage = await getItemPage(1, signal);
    const items = Array.isArray(firstPage.content) ? [...firstPage.content] : [];
    const totalPages = Math.max(1, Number(firstPage.totalPages) || 1);

    for (let page = 2; page <= totalPages; page += 1) {
        const nextPage = await getItemPage(page, signal);

        if (Array.isArray(nextPage.content)) {
            items.push(...nextPage.content);
        }
    }

    return Array.from(new Map(items
        .filter(item => item.active !== false && item.sku)
        .map(item => [item.sku, item])).values());
};

const createPayload = (form, items) => ({
    data: {
        sourceLocation: form.sourceLocation,
        destinationLocation: form.destinationLocation,
        description: form.description.trim(),
        lines: form.lines.map(line => ({
            itemSku: line.itemSku,
            quantity: normalizeTransferQuantity(line.quantity),
            unitOfMeasure: items.find(item => item.sku === line.itemSku).baseUnitOfMeasure
        }))
    }
});

const getBackendField = field => {
    const match = /^lines\[(\d+)\]\.(itemSku|quantity|unitOfMeasure)$/.exec(field || '');

    if (match) {
        return `lines[${ match[1] }].${ match[2] === 'unitOfMeasure' ? 'itemSku' : match[2] }`;
    }

    return ['sourceLocation', 'destinationLocation', 'description'].includes(field) ? field : '';
};

export default function StockTransferCreate() {
    const [searchParams] = useSearchParams();
    const authStatus = useAuthStore(state => state.authStatus);
    const currentUser = useAuthStore(state => state.currentUser);
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
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
        lines: [emptyTransferLine(searchParams.get('itemSku') || '')]
    }));
    const [activeItems, setActiveItems] = useState([]);
    const [errors, setErrors] = useState(EMPTY_ERRORS);
    const [isLoadingItems, setLoadingItems] = useState(true);
    const [itemsError, setItemsError] = useState('');
    const [itemsRefreshVersion, setItemsRefreshVersion] = useState(0);
    const [confirmationPayload, setConfirmationPayload] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [isConflict, setConflict] = useState(false);
    const [refreshWarning, setRefreshWarning] = useState('');

    const fieldRefs = useRef({});
    const itemCacheRef = useRef(new Map());
    const itemsErrorRef = useRef(null);
    const submitErrorRef = useRef(null);
    const mountedRef = useRef(true);

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
    const hasCurrentRecovery = recoveryBelongsToCurrentAccount
        && !!transferAttempt
        && !isSubmitting;
    const recoveryLines = hasCurrentRecovery ? transferAttempt.request?.lines || [] : [];
    const showTransferForm = !hasForeignRecovery && !result && !hasCurrentRecovery;

    useEffect(() => {
        setBreadcrumbs([
            {
                to: '/stock-transfers',
                label: 'Transfer Stok'
            },
            'Buat transfer'
        ]);
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

        loadAllActiveItems(controller.signal).then(items => {
            if (!controller.signal.aborted) {
                setActiveItems(items);
            }
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
    }, [itemsRefreshVersion]);

    useEffect(() => {
        activeItems.forEach(item => itemCacheRef.current.set(item.sku, item));
    }, [activeItems]);

    useEffect(() => {
        if (itemsError) {
            itemsErrorRef.current?.focus();
        }
    }, [itemsError]);

    useEffect(() => {
        if (submitError && !confirmationPayload && !isSubmitting) {
            const focusTimer = window.setTimeout(() => {
                const firstInvalidField = Object.keys(errors).find(field => errors[field]);
                const target = fieldRefs.current[firstInvalidField] || submitErrorRef.current;

                target?.focus();
            }, 0);

            return () => window.clearTimeout(focusTimer);
        }
    }, [confirmationPayload, errors, isSubmitting, submitError]);

    useEffect(() => {
        if (!recoveryBelongsToCurrentAccount || !transferAttempt) {
            return;
        }

        const request = transferAttempt.request;
        if (request?.lines?.length && transferStatus !== 'pending') {
            setForm({
                sourceLocation: request.sourceLocation || 'WAREHOUSE',
                destinationLocation: request.destinationLocation || 'STORE',
                lines: request.lines.map(line => ({
                    itemSku: line.itemSku || '',
                    quantity: String(line.quantity ?? '')
                })),
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
        setForm(previous => ({
            ...previous,
            [name]: value
        }));
        setErrors(previous => ({
            ...previous,
            [name]: ''
        }));
        setSubmitError('');
        setConflict(false);
        setRefreshWarning('');
    };

    const changeLine = (index, name, value) => {
        setForm(previous => ({
            ...previous,
            lines: previous.lines.map((line, lineIndex) => lineIndex === index ? {
                ...line,
                [name]: value
            } : line)
        }));
        setErrors(previous => ({
            ...previous,
            [`lines[${ index }].${ name }`]: ''
        }));
        setSubmitError('');
        setConflict(false);
        setRefreshWarning('');
    };

    const addLine = () => {
        const index = form.lines.length;

        setForm(previous => ({
            ...previous,
            lines: [...previous.lines, emptyTransferLine()]
        }));
        window.setTimeout(() => fieldRefs.current[`lines[${ index }].itemSku`]?.focus(), 0);
    };

    const removeLine = index => {
        setForm(previous => ({
            ...previous,
            lines: previous.lines.filter((_, lineIndex) => lineIndex !== index)
        }));
        setErrors({});
        window.setTimeout(() => fieldRefs.current[`lines[${ Math.max(0, index - 1) }].itemSku`]?.focus(), 0);
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
        const nextErrors = validateTransferForm(form, activeItems);
        setErrors(previous => ({
            ...previous,
            [name]: previous[name] || nextErrors[name]
        }));
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

        const nextErrors = validateTransferForm(form, activeItems);
        setErrors(nextErrors);
        const firstInvalidField = Object.keys(nextErrors).find(field => nextErrors[field]);
        if (firstInvalidField) {
            fieldRefs.current[firstInvalidField]?.focus();
            return;
        }

        setSubmitError('');
        setConflict(false);
        setConfirmationPayload({
            payload: createPayload(form, activeItems),
            items: form.lines.map(line => activeItems.find(item => item.sku === line.itemSku))
        });
    };

    const refreshAffectedData = async lines => {
        const refreshResults = await Promise.allSettled([
            loadAllActiveItems(),
            ...lines.map(line => getItemDetails(line.itemSku))
        ]);
        const refreshedItems = refreshResults[0];

        if (mountedRef.current && refreshedItems.status === 'fulfilled') {
            setActiveItems(refreshedItems.value);
        }

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
                    lines: [emptyTransferLine()],
                    description: ''
                }));
                setErrors(EMPTY_ERRORS);
            }
            const refreshed = await refreshAffectedData(response.data.lines);
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
                const nextErrors = {};
                const unboundErrors = [];
                error.validationErrors?.forEach(detail => {
                    const field = getBackendField(detail.field);
                    if (field && !nextErrors[field]) {
                        nextErrors[field] = detail.message || 'Nilai ini ditolak server.';
                    } else if (!field) {
                        unboundErrors.push(detail.message || 'Nilai ini ditolak server.');
                    }
                });
                setErrors(nextErrors);
                setSubmitError(`Transfer ditolak server. Tidak ada baris yang dibukukan. ${ unboundErrors.join(' ') || 'Periksa pesan pada baris terkait.' }`);
                await refreshAffectedData(form.lines);
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
            } else if (currentStatus === 'error') {
                await refreshAffectedData(form.lines);
                if (mountedRef.current) {
                    setSubmitError(
                        'Transfer ditolak server. Masukan Anda tetap dipertahankan. Periksa data dan stok asal sebelum mencoba lagi.'
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
        await submitTransfer(confirmationPayload.payload);
    };

    const retryTransfer = async () => {
        if (isSubmitting || !transferAttempt || !recoveryBelongsToCurrentAccount) return;
        await submitTransfer();
    };

    const startAnotherTransfer = () => {
        beginNewStockTransfer();
        setForm({
            ...EMPTY_FORM,
            lines: [emptyTransferLine(searchParams.get('itemSku') || '')]
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
                    <div className="space-y-4">
                        <ol className="space-y-3" aria-label="Baris yang dikonfirmasi">
                            { confirmationPayload.payload.data.lines.map((line, index) => {
                                const item = confirmationPayload.items[index];

                                return (
                                    <li key={ line.itemSku } className="rounded-lg border p-3">
                                        <strong className="block break-words">Baris { index + 1 }: { item.name } · { line.itemSku }</strong>
                                        <p>{ formatQuantity(line.quantity, line.unitOfMeasure) } · { item.fractionalQuantityAllowed ? 'Pecahan sampai 4 desimal' : 'Jumlah utuh' }</p>
                                        <p>Stok asal saat dimuat: { formatQuantity(item[sourceStockField], item.baseUnitOfMeasure) }</p>
                                    </li>
                                );
                            }) }
                        </ol>
                        <dl className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm text-slate-600">Lokasi asal</dt>
                                <dd className="font-semibold">{ LOCATION_LABELS[
                                    confirmationPayload.payload.data.sourceLocation
                                ] }</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-slate-600">Lokasi tujuan</dt>
                                <dd className="font-semibold">{ LOCATION_LABELS[
                                    confirmationPayload.payload.data.destinationLocation
                                ] }</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm text-slate-600">Keterangan</dt>
                                <dd className="break-words font-semibold">
                                    { confirmationPayload.payload.data.description || 'Tidak ada' }
                                </dd>
                            </div>
                        </dl>
                        <p className="rounded-lg bg-blue-50 p-3 text-sm text-slate-700">
                            Server akan memeriksa stok asal dan mencatat pergerakan keluar serta masuk
                            sebagai satu transaksi atomik.
                        </p>
                    </div>
                </BloomConfirmationModal>
            ) }

            <div className="mb-4">
                <h2 className="font-bold text-2xl">Transfer stok</h2>
                <p className="mt-1 text-slate-600">
                    Pindahkan satu atau beberapa barang antara toko dan gudang melalui satu transaksi server.
                </p>
            </div>

            <Button component={ Link } to="/stock-transfers" className="mb-4">Riwayat transfer</Button>

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
                >
                    { submitError }
                </Alert>
            ) }

            { result && recoveryBelongsToCurrentAccount && (
                <Paper
                    component="section"
                    className="mb-4 overflow-hidden"
                    aria-label="Hasil transfer stok"
                >
                    <Alert severity="success" role="status" className="rounded-none">
                        <div className="font-semibold">Transfer { result.code } berhasil.</div>
                        <div>
                            Hasil ini berasal dari catatan transfer yang dikembalikan server.
                        </div>
                    </Alert>
                    <div className="p-4 md:p-5">
                        <StockTransferFacts transfer={ result } />
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <Button component={ Link } to={ `/stock-transfers/${ encodeURIComponent(result.code) }` } variant="outlined">
                                Buka detail transfer
                            </Button>
                            <Button
                                variant="contained"
                                onClick={ startAnotherTransfer }
                            >
                                Buat transfer baru
                            </Button>
                            <Button
                                component={ Link }
                                to={ `/stock-movements?itemSku=${ encodeURIComponent(
                                    result.lines?.[0]?.itemSku || ''
                                ) }` }
                                variant="outlined"
                                startIcon={ <HistoryIcon size={ 18 } aria-hidden="true" /> }
                            >
                                Buka pergerakan stok
                            </Button>
                        </div>
                    </div>
                </Paper>
            ) }

            { hasCurrentRecovery && recoveryLines.length > 0 && (
                <Paper
                    component="section"
                    className="mb-4 p-4 md:p-5"
                    aria-label="Permintaan transfer yang dikunci"
                >
                    <h3 className="text-lg font-bold">Permintaan yang dipertahankan untuk akun ini</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Isi dan identitas permintaan tidak dapat diubah sampai hasilnya dipastikan.
                    </p>
                    <StockTransferFacts transfer={ {
                        ...transferAttempt.request,
                        lines: recoveryLines.map(line => ({
                            ...line,
                            itemName: activeItems.find(item => item.sku === line.itemSku)?.name
                        }))
                    } } />
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        { transferStatus === 'uncertain' && (
                            <Button
                                variant="contained"
                                onClick={ retryTransfer }
                                disabled={ isSubmitting }
                            >
                                Periksa hasil transfer
                            </Button>
                        ) }
                        <Button
                            component={ Link }
                            to={ `/stock-movements?itemSku=${ encodeURIComponent(
                                recoveryLines[0]?.itemSku
                            ) }` }
                            variant="outlined"
                            startIcon={ <HistoryIcon size={ 18 } aria-hidden="true" /> }
                        >
                            Buka pergerakan stok
                        </Button>
                    </div>
                    { transferStatus === 'uncertain' && (
                        <p className="mt-3 text-sm text-slate-600">
                            Periksa hasil mengirim ulang permintaan dan kunci yang sama; tindakan ini
                            tidak membuat identitas transfer baru.
                        </p>
                    ) }
                </Paper>
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
                hidden={ !showTransferForm }
            >
                <fieldset
                    disabled={ interactionDisabled || activeItems.length === 0 }
                >
                    <legend className="sr-only">Data transfer stok</legend>

                    <div className="stock-transfer-create__fields flex flex-col gap-6">

                    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-5">
                        <TextField
                            select
                            size="small"
                            label="Lokasi asal"
                            name="sourceLocation"
                            value={ form.sourceLocation }
                            inputRef={ element => {
                                fieldRefs.current.sourceLocation = element;
                            } }
                            error={ !!errors.sourceLocation }
                            helperText={ errors.sourceLocation || 'Stok asal setiap barang ditampilkan pada barisnya.' }
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
                            inputRef={ element => {
                                fieldRefs.current.destinationLocation = element;
                            } }
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

                    { form.lines.map((line, index) => {
                        const activeItem = activeItems.find(candidate => candidate.sku === line.itemSku);
                        const item = activeItem || itemCacheRef.current.get(line.itemSku) || null;
                        const itemField = `lines[${ index }].itemSku`;
                        const quantityField = `lines[${ index }].quantity`;

                        return (
                            <section key={ index } className="space-y-4 rounded-lg border p-4" aria-label={ `Baris transfer ${ index + 1 }` }>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="font-semibold">Baris { index + 1 }</h3>
                                    { form.lines.length > 1 && (
                                        <Button type="button" onClick={ () => removeLine(index) } aria-label={ `Hapus baris ${ index + 1 }` }>Hapus baris</Button>
                                    ) }
                                </div>
                                <StockTransferItemPicker
                                    items={ activeItems }
                                    value={ item }
                                    disabled={ interactionDisabled }
                                    error={ errors[itemField] }
                                    inputRef={ element => {
                                        fieldRefs.current[itemField] = element;
                                    } }
                                    onChange={ selected => changeLine(index, 'itemSku', selected?.sku || '') }
                                    onBlur={ () => blurField(itemField) }
                                />
                                { item && (
                                    <Alert severity={ activeItem ? 'info' : 'warning' }>
                                        { !activeItem && <p>Barang ini tidak lagi tersedia pada daftar aktif. Pilih barang aktif atau hapus baris. Satuan dan stok di bawah adalah data terakhir.</p> }
                                        <div>Satuan: <strong>{ formatUnitOfMeasure(item.baseUnitOfMeasure) }</strong>. { item.fractionalQuantityAllowed ? 'Jumlah pecahan diperbolehkan.' : 'Jumlah harus utuh.' }</div>
                                        <div>Stok asal { LOCATION_LABELS[form.sourceLocation] } saat dimuat: { formatQuantity(item[sourceStockField], item.baseUnitOfMeasure) }. Ketersediaan diperiksa ulang oleh server saat konfirmasi.</div>
                                    </Alert>
                                ) }
                                <BloomQuantityField
                                    fullWidth
                                    required
                                    label="Jumlah transfer"
                                    value={ line.quantity }
                                    unitOfMeasure={ item?.baseUnitOfMeasure }
                                    disabled={ interactionDisabled }
                                    inputRef={ element => {
                                        fieldRefs.current[quantityField] = element;
                                    } }
                                    error={ !!errors[quantityField] }
                                    helperText={ errors[quantityField] || (item ? `Gunakan ${ formatUnitOfMeasure(item.baseUnitOfMeasure) }; maksimal 4 angka desimal.` : 'Pilih barang untuk melihat aturan jumlah.') }
                                    decrementDisabled={ !line.quantity || isZeroQuantity(line.quantity) }
                                    onChange={ value => changeLine(index, 'quantity', value) }
                                    onBlur={ () => blurField(quantityField) }
                                    onStep={ value => {
                                        if (value !== null) {
                                            changeLine(index, 'quantity', value);
                                        }
                                    } }
                                />
                            </section>
                        );
                    }) }
                    <Button type="button" variant="outlined" onClick={ addLine }>Tambah baris</Button>

                    <TextField
                        fullWidth
                        multiline
                        rows={ 3 }
                        size="small"
                        label="Keterangan (opsional)"
                        name="description"
                        value={ form.description }
                        inputRef={ element => {
                            fieldRefs.current.description = element;
                        } }
                        error={ !!errors.description }
                        helperText={ errors.description || `${ form.description.length }/255` }
                        onChange={ changeField }
                        onBlur={ () => blurField('description') }
                    />

                        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
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
