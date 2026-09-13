import {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { Link } from 'react-router-dom';
import {
    Alert,
    Button,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import { Plus, Trash } from 'lucide-react';

import { API_ERROR_CATEGORY } from '@api/index.js';
import itemApi from '@api/item.js';
import BloomConfirmationModal from '@components/_ui/BloomConfirmationModal.jsx';
import BloomQuantityField from '@components/_ui/BloomQuantityField.jsx';
import StockAdjustmentInfoCard from '@components/stock-adjustment/StockAdjustmentInfoCard.jsx';
import StockAdjustmentItemsTable from '@components/stock-adjustment/StockAdjustmentItemsTable.jsx';
import {
    useBreadcrumbStore,
    useStockAdjustmentStore
} from '@stores/index.js';
import {
    formatQuantity,
    formatUnitOfMeasure
} from '@utils/quantity-utils.js';
import {
    ACTION_TYPES,
    STOCK_LOCATIONS,
    createStockAdjustmentPayload,
    hasStockAdjustmentErrors,
    validateStockAdjustment
} from '@utils/stock-adjustment-utils.js';

const ACTION_LABELS = {
    ADD: 'Tambah stok (ADD)',
    REMOVE: 'Kurangi stok (REMOVE)',
    CORRECTION: 'Tetapkan stok absolut (CORRECTION)'
};
const LOCATION_LABELS = {
    STORE: 'Toko (STORE)',
    WAREHOUSE: 'Gudang (WAREHOUSE)'
};
const EMPTY_LINE_ERROR = {
    itemSku: '',
    stockLocation: '',
    actionType: '',
    changeQuantity: ''
};
const ITEM_PAGE_SIZE = 100;

let nextLineId = 0;
const createLine = () => ({
    id: `adjustment-line-${ ++nextLineId }`,
    item: null,
    stockLocation: 'STORE',
    actionType: 'ADD',
    changeQuantity: ''
});

const isZeroQuantity = value => /^0+(?:[.,]0*)?$/.test(String(value || '').trim());

const getItemPage = async (page, signal) => {
    const response = await itemApi.getItemList({
        signal,
        params: {
            page,
            size: ITEM_PAGE_SIZE
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

export default function StockAdjustmentCreate() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const createAdjustment = useStockAdjustmentStore(state => state.createStockAdjustment);
    const createStatus = useStockAdjustmentStore(state => state.stockAdjustmentCreateStatus);
    const created = useStockAdjustmentStore(state => state.lastCreatedStockAdjustment);
    const ambiguousAttempt = useStockAdjustmentStore(state => state.stockAdjustmentAttempt);
    const clearCreated = useStockAdjustmentStore(state => state.clearCreatedStockAdjustment);
    const acknowledgeAmbiguous = useStockAdjustmentStore(
        state => state.acknowledgeAmbiguousStockAdjustment
    );

    const [activeItems, setActiveItems] = useState([]);
    const [reason, setReason] = useState('');
    const [lines, setLines] = useState(() => [createLine()]);
    const [errors, setErrors] = useState({
        reason: '',
        lines: [{ ...EMPTY_LINE_ERROR }]
    });
    const [confirmation, setConfirmation] = useState(null);
    const [itemsStatus, setItemsStatus] = useState('loading');
    const [itemsError, setItemsError] = useState('');
    const [itemsRetry, setItemsRetry] = useState(0);
    const [submitError, setSubmitError] = useState('');
    const [refreshWarning, setRefreshWarning] = useState('');
    const [showReconciliationConfirmation, setShowReconciliationConfirmation] = useState(false);

    const fieldRefs = useRef({});
    const itemsErrorRef = useRef(null);
    const submitErrorRef = useRef(null);
    const submitInProgressRef = useRef(false);
    const mountedRef = useRef(true);
    const pendingErrorFocusRef = useRef('');
    const itemsRefreshPurposeRef = useRef('initial');

    const itemsBySku = useMemo(
        () => new Map(activeItems.map(item => [item.sku, item])),
        [activeItems]
    );
    const interactionDisabled = itemsStatus !== 'ready'
        || ['pending', 'ambiguous'].includes(createStatus)
        || !!created;

    useEffect(() => {
        setBreadcrumbs(['Persediaan', 'Penyesuaian Stok', 'Buat']);
        clearCreated();
    }, [clearCreated, setBreadcrumbs]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        setItemsStatus('loading');
        setItemsError('');

        loadAllActiveItems(controller.signal).then(items => {
            if (!controller.signal.aborted) {
                setActiveItems(items);
                setLines(previous => previous.map(line => ({
                    ...line,
                    item: line.item ? items.find(item => item.sku === line.item.sku) || null : null
                })));
                setItemsStatus('ready');
                if (itemsRefreshPurposeRef.current === 'conflict') {
                    setSubmitError('Data barang terbaru sudah dimuat. Periksa lalu konfirmasi kembali.');
                } else if (itemsRefreshPurposeRef.current === 'success') {
                    setRefreshWarning('');
                }
                itemsRefreshPurposeRef.current = '';
            }
        }).catch(error => {
            if (!controller.signal.aborted) {
                setItemsStatus('error');
                setItemsError(error?.message || 'Daftar barang aktif gagal dimuat.');
            }
        });

        return () => controller.abort();
    }, [itemsRetry]);

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
        if (!pendingErrorFocusRef.current) {
            return undefined;
        }

        const field = pendingErrorFocusRef.current;
        pendingErrorFocusRef.current = '';
        const frame = requestAnimationFrame(() => fieldRefs.current[field]?.focus());

        return () => cancelAnimationFrame(frame);
    }, [errors]);

    const changeLine = (index, field, value) => {
        setLines(previous => previous.map((line, lineIndex) => lineIndex === index
            ? {
                ...line,
                [field]: value
            }
            : line));
        setErrors(previous => ({
            ...previous,
            lines: previous.lines.map((lineError, lineIndex) => lineIndex === index
                ? {
                    ...lineError,
                    [field]: ''
                }
                : lineError)
        }));
        setSubmitError('');
        setRefreshWarning('');
    };

    const selectItem = (index, sku) => {
        const item = activeItems.find(option => option.sku === sku) || null;
        changeLine(index, 'item', item);
    };

    const addLine = () => {
        setLines(previous => [...previous, createLine()]);
        setErrors(previous => ({
            ...previous,
            lines: [...previous.lines, { ...EMPTY_LINE_ERROR }]
        }));
    };

    const removeLine = index => {
        if (lines.length === 1) {
            return;
        }
        setLines(previous => previous.filter((_, lineIndex) => lineIndex !== index));
        setErrors(previous => ({
            ...previous,
            lines: previous.lines.filter((_, lineIndex) => lineIndex !== index)
        }));
    };

    const getFirstErrorField = nextErrors => {
        if (nextErrors.reason) {
            return 'reason';
        }
        const fieldOrder = ['itemSku', 'stockLocation', 'actionType', 'changeQuantity'];
        for (let index = 0; index < nextErrors.lines.length; index += 1) {
            const field = fieldOrder.find(name => nextErrors.lines[index][name]);
            if (field) {
                return `${ lines[index].id }-${ field }`;
            }
        }

        return '';
    };

    const review = event => {
        event.preventDefault();
        if (interactionDisabled || submitInProgressRef.current) {
            return;
        }
        const nextErrors = validateStockAdjustment(reason, lines);
        setErrors(nextErrors);
        if (hasStockAdjustmentErrors(nextErrors)) {
            pendingErrorFocusRef.current = getFirstErrorField(nextErrors);
            return;
        }

        const payload = createStockAdjustmentPayload(reason, lines);
        setConfirmation({
            payload,
            lines: lines.map(line => ({
                itemName: line.item.name,
                unitOfMeasure: line.item.baseUnitOfMeasure,
                ...payload.items.find(item => item.itemSku === line.item.sku)
            }))
        });
    };

    const reloadItems = async purpose => {
        setItemsStatus('loading');
        setItemsError('');
        itemsRefreshPurposeRef.current = purpose;

        try {
            const items = await loadAllActiveItems();

            if (mountedRef.current) {
                setActiveItems(items);
                setLines(previous => previous.map(line => ({
                    ...line,
                    item: line.item ? items.find(item => item.sku === line.item.sku) || null : null
                })));
                setItemsStatus('ready');
                itemsRefreshPurposeRef.current = '';
            }
            return true;
        } catch (error) {
            if (mountedRef.current) {
                setItemsStatus('stale');
                setItemsError(error?.message || 'Data barang terbaru gagal dimuat.');
            }
            return false;
        }
    };

    const confirm = async () => {
        if (!confirmation || submitInProgressRef.current || createStatus === 'pending') {
            return;
        }
        submitInProgressRef.current = true;
        setSubmitError('');
        setRefreshWarning('');

        try {
            await createAdjustment(confirmation.payload, { useLoader: false });
            if (mountedRef.current) {
                setConfirmation(null);
                setReason('');
                setLines([createLine()]);
                setErrors({
                    reason: '',
                    lines: [{ ...EMPTY_LINE_ERROR }]
                });
            }
            const refreshed = await reloadItems('success');
            if (mountedRef.current && !refreshed) {
                setRefreshWarning('Penyesuaian berhasil, tetapi daftar stok terbaru gagal dimuat. Muat ulang sebelum membuat penyesuaian berikutnya.');
            }
        } catch (error) {
            if (mountedRef.current) {
                setConfirmation(null);
                if (error?.category === API_ERROR_CATEGORY.CONFLICT) {
                    const refreshed = await reloadItems('conflict');
                    setSubmitError(refreshed
                        ? 'Stok berubah saat penyesuaian diproses. Data barang sudah dimuat ulang; periksa lalu konfirmasi kembali.'
                        : 'Stok berubah dan data terbaru gagal dimuat. Muat ulang barang sebelum mencoba lagi.');
                } else if (error?.category === API_ERROR_CATEGORY.VALIDATION) {
                    setSubmitError('Server menolak data penyesuaian. Periksa alasan, barang, lokasi, tindakan, dan jumlah.');
                } else if (error?.category === 'storage') {
                    setSubmitError('Penyimpanan pemulihan tab ini tidak tersedia. Tidak ada penyesuaian yang dikirim; pulihkan penyimpanan browser sebelum mencoba lagi.');
                } else {
                    setSubmitError('');
                }
            }
        } finally {
            submitInProgressRef.current = false;
        }
    };

    const startNext = () => {
        if (itemsStatus !== 'ready') {
            return;
        }

        clearCreated();
        setSubmitError('');
        setRefreshWarning('');
        requestAnimationFrame(() => fieldRefs.current.reason?.focus());
    };

    const finishManualReconciliation = () => {
        acknowledgeAmbiguous();
        setShowReconciliationConfirmation(false);
        setReason('');
        setLines([createLine()]);
        setErrors({
            reason: '',
            lines: [{ ...EMPTY_LINE_ERROR }]
        });
        setSubmitError('');
        requestAnimationFrame(() => fieldRefs.current.reason?.focus());
    };

    return (
        <div className="max-w-5xl space-y-5 pb-8">
            { confirmation && (
                <BloomConfirmationModal
                    title="Konfirmasi penyesuaian stok"
                    confirmButtonText={ createStatus === 'pending' ? 'Menyimpan...' : 'Simpan penyesuaian' }
                    onCancel={ () => setConfirmation(null) }
                    onConfirm={ confirm }
                    isPending={ createStatus === 'pending' }
                    focusCancel
                >
                    <div className="space-y-3">
                        <p>Alasan yang akan dibekukan: <strong>{ confirmation.payload.reason }</strong></p>
                        <ul className="list-disc space-y-1 pl-5">
                            { confirmation.lines.map(line => (
                                <li key={ line.itemSku }>
                                    { line.itemSku } · { line.itemName } · { LOCATION_LABELS[line.stockLocation] }
                                    { ' · ' }{ ACTION_LABELS[line.actionType] } · { formatQuantity(
                                        line.changeQuantity,
                                        line.unitOfMeasure
                                    ) }
                                </li>
                            )) }
                        </ul>
                        <p className="text-sm text-slate-600">
                            Server akan menentukan stok sebelumnya, stok baru, dan pergerakan yang dibukukan.
                        </p>
                    </div>
                </BloomConfirmationModal>
            ) }

            { showReconciliationConfirmation && (
                <BloomConfirmationModal
                    title="Konfirmasi rekonsiliasi manual"
                    confirmButtonText="Buka kembali formulir"
                    onCancel={ () => setShowReconciliationConfirmation(false) }
                    onConfirm={ finishManualReconciliation }
                    focusCancel
                >
                    <p>
                        Lanjutkan hanya jika riwayat penyesuaian sudah diperiksa dan hasil permintaan
                        sebelumnya sudah direkonsiliasi secara manual. Tindakan ini tidak mengirim
                        permintaan baru.
                    </p>
                </BloomConfirmationModal>
            ) }

            <header>
                <h2 className="text-2xl font-bold">Buat penyesuaian stok</h2>
                <p className="mt-1 text-slate-600">
                    ADD dan REMOVE memakai delta positif. CORRECTION menetapkan stok absolut dan boleh bernilai nol.
                </p>
            </header>

            { itemsStatus === 'loading' && (
                <Alert severity="info" role="status">
                    <span className="inline-flex items-center gap-2">
                        <CircularProgress size={ 18 } /> Memuat barang aktif...
                    </span>
                </Alert>
            ) }
            { ['error', 'stale'].includes(itemsStatus) && (
                <Alert
                    severity={ itemsStatus === 'stale' ? 'warning' : 'error' }
                    tabIndex={ -1 }
                    ref={ itemsErrorRef }
                    action={ <Button color="inherit" onClick={ () => setItemsRetry(value => value + 1) }>Coba lagi</Button> }>
                    { itemsError }
                </Alert>
            ) }
            { itemsStatus === 'ready' && activeItems.length === 0 && (
                <Alert severity="info">Belum ada barang aktif yang dapat disesuaikan.</Alert>
            ) }
            { submitError && (
                <Alert severity="warning" tabIndex={ -1 } ref={ submitErrorRef }>{ submitError }</Alert>
            ) }
            { refreshWarning && <Alert severity="warning">{ refreshWarning }</Alert> }

            { createStatus === 'ambiguous' && ambiguousAttempt && (
                <Card variant="outlined" role="alert" aria-labelledby="ambiguous-adjustment-title">
                    <CardContent className="space-y-3">
                        <div>
                            <Typography id="ambiguous-adjustment-title" variant="h6" color="error">
                                Hasil penyesuaian belum dapat dipastikan
                            </Typography>
                            <p className="mt-1 text-slate-700">
                                Permintaan mungkin sudah dibukukan oleh server. Formulir dikunci agar
                                penyesuaian yang sama tidak terkirim lagi. Periksa riwayat dan lakukan
                                rekonsiliasi manual terlebih dahulu.
                            </p>
                        </div>
                        <div className="rounded bg-slate-50 p-3 text-sm">
                            <div><strong>Alasan:</strong> { ambiguousAttempt.payload.reason }</div>
                            <div><strong>Jumlah baris:</strong> { ambiguousAttempt.payload.items.length }</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button component={ Link } to="/stock-adjustments" variant="contained">
                                Buka riwayat penyesuaian
                            </Button>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={ () => setShowReconciliationConfirmation(true) }>
                                Saya sudah merekonsiliasi hasilnya
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) }

            { created && (
                <Stack spacing={ 3 }>
                    <Alert severity="success" role="status">
                        Penyesuaian { created.adjustment?.stockAdjustmentCode } berhasil dibukukan oleh server.
                    </Alert>
                    <StockAdjustmentInfoCard adjustment={ created.adjustment } />
                    <StockAdjustmentItemsTable items={ created.adjustment?.items } />
                    <section className="rounded-lg bg-white p-4 shadow" aria-label="Pergerakan stok yang dibukukan">
                        <h3 className="text-lg font-bold">Pergerakan stok yang dibukukan</h3>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                            { created.movements?.map(movement => (
                                <article key={ movement.id } className="rounded border p-3">
                                    <strong>{ movement.referenceNo } · { movement.item?.sku }</strong>
                                    <div>{ LOCATION_LABELS[movement.location] || movement.location }</div>
                                    <div>{ movement.movementType } · { formatQuantity(
                                        movement.quantity,
                                        movement.item?.baseUnitOfMeasure
                                    ) }</div>
                                    <div>Stok server: { formatQuantity(
                                        movement.qtyBefore,
                                        movement.item?.baseUnitOfMeasure
                                    ) } → { formatQuantity(
                                        movement.qtyAfter,
                                        movement.item?.baseUnitOfMeasure
                                    ) }</div>
                                </article>
                            )) }
                        </div>
                    </section>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="contained"
                            disabled={ itemsStatus !== 'ready' }
                            onClick={ startNext }>
                            Buat penyesuaian berikutnya
                        </Button>
                        <Button
                            component={ Link }
                            to={ `/stock-adjustments/${ encodeURIComponent(
                            created.adjustment?.stockAdjustmentCode || ''
                        ) }` }>Buka detail</Button>
                    </div>
                </Stack>
            ) }

            <form className={ created ? 'hidden' : 'space-y-5' } onSubmit={ review } noValidate>
                <TextField
                    fullWidth
                    required
                    multiline
                    minRows={ 2 }
                    label="Alasan penyesuaian"
                    value={ reason }
                    inputRef={ element => { fieldRefs.current.reason = element; } }
                    disabled={ interactionDisabled }
                    error={ !!errors.reason }
                    helperText={ errors.reason || 'Alasan ini akan disimpan sebagai fakta audit.' }
                    onChange={ event => {
                        setReason(event.target.value);
                        setErrors(previous => ({
                            ...previous,
                            reason: ''
                        }));
                        setSubmitError('');
                    } }
                />

                <Stack spacing={ 3 }>
                    { lines.map((line, index) => {
                        const lineError = errors.lines[index] || EMPTY_LINE_ERROR;
                        const stockField = line.stockLocation === 'STORE' ? 'stockStore' : 'stockWarehouse';

                        return (
                            <Card key={ line.id } variant="outlined">
                                <CardContent>
                                    <Stack spacing={ 3 }>
                                        <div className="flex items-center justify-between gap-2">
                                            <Typography variant="h6">Baris { index + 1 }</Typography>
                                            <IconButton
                                                type="button"
                                                color="error"
                                                aria-label={ `Hapus baris ${ index + 1 }` }
                                                disabled={ interactionDisabled || lines.length === 1 }
                                                onClick={ () => removeLine(index) }>
                                                <Trash size={ 18 } />
                                            </IconButton>
                                        </div>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Barang"
                                            value={ line.item?.sku || '' }
                                            inputRef={ element => {
                                                fieldRefs.current[`${ line.id }-itemSku`] = element;
                                            } }
                                            disabled={ interactionDisabled }
                                            error={ !!lineError.itemSku }
                                            helperText={ lineError.itemSku || 'Pilih satu barang aktif.' }
                                            onChange={ event => selectItem(index, event.target.value) }>
                                            { Array.from(itemsBySku.values()).map(item => (
                                                <MenuItem key={ item.sku } value={ item.sku }>
                                                    [{ item.sku }] { item.name }
                                                </MenuItem>
                                            )) }
                                        </TextField>

                                        { line.item && (
                                            <Alert severity="info">
                                                Satuan: <strong>{ formatUnitOfMeasure(line.item.baseUnitOfMeasure) }</strong>.
                                                { line.item.fractionalQuantityAllowed
                                                    ? ' Pecahan hingga empat desimal diperbolehkan.'
                                                    : ' Jumlah harus utuh.' }
                                                <div className="mt-1 text-sm">
                                                    Stok { LOCATION_LABELS[line.stockLocation] } saat dimuat: { formatQuantity(
                                                        line.item[stockField],
                                                        line.item.baseUnitOfMeasure
                                                    ) }. Server menentukan hasil akhir saat posting.
                                                </div>
                                            </Alert>
                                        ) }

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <TextField
                                                select
                                                label="Lokasi stok"
                                                value={ line.stockLocation }
                                                inputRef={ element => {
                                                    fieldRefs.current[`${ line.id }-stockLocation`] = element;
                                                } }
                                                disabled={ interactionDisabled }
                                                error={ !!lineError.stockLocation }
                                                helperText={ lineError.stockLocation || 'Wajib STORE atau WAREHOUSE.' }
                                                onChange={ event => changeLine(index, 'stockLocation', event.target.value) }>
                                                { STOCK_LOCATIONS.map(location => (
                                                    <MenuItem key={ location } value={ location }>
                                                        { LOCATION_LABELS[location] }
                                                    </MenuItem>
                                                )) }
                                            </TextField>
                                            <TextField
                                                select
                                                label="Tindakan"
                                                value={ line.actionType }
                                                inputRef={ element => {
                                                    fieldRefs.current[`${ line.id }-actionType`] = element;
                                                } }
                                                disabled={ interactionDisabled }
                                                error={ !!lineError.actionType }
                                                helperText={ lineError.actionType || (line.actionType === 'CORRECTION'
                                                    ? 'Nilai adalah target stok absolut; nol diperbolehkan.'
                                                    : 'Nilai adalah delta positif.') }
                                                onChange={ event => changeLine(index, 'actionType', event.target.value) }>
                                                { ACTION_TYPES.map(action => (
                                                    <MenuItem key={ action } value={ action }>
                                                        { ACTION_LABELS[action] }
                                                    </MenuItem>
                                                )) }
                                            </TextField>
                                        </div>

                                        <BloomQuantityField
                                            fullWidth
                                            required
                                            label="Jumlah penyesuaian"
                                            value={ line.changeQuantity }
                                            unitOfMeasure={ line.item?.baseUnitOfMeasure }
                                            disabled={ interactionDisabled }
                                            inputRef={ element => {
                                                fieldRefs.current[`${ line.id }-changeQuantity`] = element;
                                            } }
                                            error={ !!lineError.changeQuantity }
                                            helperText={ lineError.changeQuantity || (line.actionType === 'CORRECTION'
                                                ? 'Target stok absolut, maksimal empat desimal.'
                                                : 'Delta positif, maksimal empat desimal.') }
                                            decrementDisabled={ !line.changeQuantity || isZeroQuantity(line.changeQuantity) }
                                            onChange={ value => changeLine(index, 'changeQuantity', value) }
                                            onStep={ value => {
                                                if (value !== null) {
                                                    changeLine(index, 'changeQuantity', value);
                                                }
                                            } }
                                        />
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    }) }
                </Stack>

                <div className="flex flex-wrap gap-3">
                    <Button
                        type="button"
                        variant="outlined"
                        startIcon={ <Plus /> }
                        disabled={ interactionDisabled }
                        onClick={ addLine }>
                        Tambah baris
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={ interactionDisabled || activeItems.length === 0 }>
                        { createStatus === 'pending' ? 'Menyimpan...' : 'Tinjau penyesuaian' }
                    </Button>
                    <Button component={ Link } to="/stock-adjustments" disabled={ createStatus === 'pending' }>
                        Batal
                    </Button>
                </div>
            </form>
        </div>
    );
}
