import {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField
} from '@mui/material';
import {
    CheckCircle2,
    Download,
    Minus,
    Plus,
    X
} from 'lucide-react';
import PropTypes from 'prop-types';

import itemApi from '@api/item.js';

export const MAX_BARCODE_LABELS = 100;

const createQuantityState = items => Object.fromEntries(
    items.map(item => [item.sku, 1])
);

const downloadPdf = data => {
    const blob = data instanceof Blob
        ? data
        : new Blob([data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'barcodes-bulk.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const ItemBulkBarcodeDialog = ({
    allowCopies = true,
    contextLabel = '',
    items = [],
    loadError = '',
    loading = false,
    onClose,
    onRetry,
    open
}) => {
    const [quantities, setQuantities] = useState(() => createQuantityState(items));
    const [downloadState, setDownloadState] = useState('idle');
    const [downloadError, setDownloadError] = useState('');
    const pendingRef = useRef(false);
    const resultRef = useRef(null);

    const totalLabels = useMemo(() => items.reduce(
        (total, item) => total + (quantities[item.sku] || 1),
        0
    ), [items, quantities]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setQuantities(createQuantityState(items));
        setDownloadState('idle');
        setDownloadError('');
        pendingRef.current = false;
    }, [items, open]);

    useEffect(() => {
        if (downloadState === 'success' || downloadError) {
            resultRef.current?.focus();
        }
    }, [downloadError, downloadState]);

    const updateQuantity = (sku, nextValue) => {
        const parsedValue = Number(nextValue);
        const quantity = Number.isInteger(parsedValue)
            ? Math.min(Math.max(parsedValue, 1), MAX_BARCODE_LABELS)
            : 1;

        setQuantities(current => ({
            ...current,
            [sku]: quantity
        }));
        setDownloadState('idle');
        setDownloadError('');
    };

    const handleDownload = async () => {
        if (pendingRef.current || !items.length || totalLabels > MAX_BARCODE_LABELS) {
            return;
        }

        const skus = items.flatMap(item => Array.from(
            { length: quantities[item.sku] || 1 },
            () => item.sku
        ));

        pendingRef.current = true;
        setDownloadState('pending');
        setDownloadError('');

        try {
            const response = await itemApi.downloadBulkBarcodes(skus, { useLoader: false });

            downloadPdf(response.data);
            setDownloadState('success');
        } catch (error) {
            setDownloadState('error');
            setDownloadError(
                error?.message || 'PDF barcode gagal dibuat. Periksa koneksi lalu coba lagi.'
            );
        } finally {
            pendingRef.current = false;
        }
    };

    const handleClose = () => {
        if (downloadState === 'pending') {
            return;
        }

        onClose();
    };

    return (
        <Dialog
            open={ open }
            onClose={ handleClose }
            maxWidth="sm"
            fullWidth
            aria-labelledby="bulk-barcode-title"
        >
            <DialogTitle className="flex items-start justify-between gap-3">
                <span>
                    <span id="bulk-barcode-title" className="block font-bold">
                        Cetak barcode bulk
                    </span>
                    <span className="mt-1 block text-sm font-normal text-gray-600">
                        { contextLabel || `${ items.length } barang dipilih` }
                    </span>
                </span>
                <IconButton
                    onClick={ handleClose }
                    disabled={ downloadState === 'pending' }
                    aria-label="Tutup dialog cetak barcode bulk"
                    size="small"
                >
                    <X size={ 19 } aria-hidden="true" />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                { loading ? (
                    <div className="flex min-h-40 items-center justify-center gap-2" role="status">
                        <CircularProgress size={ 20 } />
                        Memuat barang aktif dalam kategori...
                    </div>
                ) : loadError ? (
                    <Alert
                        severity="error"
                        action={ onRetry ? (
                            <Button color="inherit" onClick={ onRetry }>
                                Coba lagi
                            </Button>
                        ) : null }
                    >
                        { loadError }
                    </Alert>
                ) : items.length ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div className="rounded-lg bg-gray-50 p-3">
                                <span className="block text-xs text-gray-600">Barang</span>
                                <strong className="mt-1 block font-semibold">{ items.length }</strong>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                                <span className="block text-xs text-gray-600">Jumlah label</span>
                                <strong className="mt-1 block font-semibold">{ totalLabels }</strong>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                                <span className="block text-xs text-gray-600">Layout PDF</span>
                                <strong className="mt-1 block font-semibold">A4 · 3 kolom</strong>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                            { items.map(item => (
                                <div
                                    key={ item.sku }
                                    className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0">
                                        <strong className="block break-words font-semibold">
                                            { item.name }
                                        </strong>
                                        <span className="mt-1 block break-all text-sm text-gray-600">
                                            { item.sku }
                                        </span>
                                    </div>

                                    { allowCopies ? (
                                        <div className="shrink-0">
                                            <span className="mb-1 block text-xs text-gray-600">
                                                Jumlah label
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <IconButton
                                                    size="small"
                                                    aria-label={ `Kurangi label ${ item.name }` }
                                                    disabled={ quantities[item.sku] <= 1 }
                                                    onClick={ () => updateQuantity(
                                                        item.sku,
                                                        quantities[item.sku] - 1
                                                    ) }
                                                >
                                                    <Minus size={ 17 } aria-hidden="true" />
                                                </IconButton>
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={ quantities[item.sku] || 1 }
                                                    inputProps={ {
                                                        min: 1,
                                                        max: MAX_BARCODE_LABELS,
                                                        'aria-label': `Jumlah label ${ item.name }`
                                                    } }
                                                    className="w-20"
                                                    onChange={ event => updateQuantity(
                                                        item.sku,
                                                        event.target.value
                                                    ) }
                                                />
                                                <IconButton
                                                    size="small"
                                                    aria-label={ `Tambah label ${ item.name }` }
                                                    onClick={ () => updateQuantity(
                                                        item.sku,
                                                        quantities[item.sku] + 1
                                                    ) }
                                                >
                                                    <Plus size={ 17 } aria-hidden="true" />
                                                </IconButton>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="shrink-0 text-sm text-gray-600">1 label</span>
                                    ) }
                                </div>
                            )) }
                        </div>

                        { totalLabels > MAX_BARCODE_LABELS && (
                            <Alert severity="error" role="alert">
                                Total { totalLabels } label melebihi batas { MAX_BARCODE_LABELS }.
                                Kurangi jumlah label sebelum membuat PDF.
                            </Alert>
                        ) }

                        { downloadError && (
                            <Alert ref={ resultRef } severity="error" tabIndex={ -1 }>
                                { downloadError }
                            </Alert>
                        ) }

                        { downloadState === 'success' && (
                            <Alert
                                ref={ resultRef }
                                severity="success"
                                icon={ <CheckCircle2 aria-hidden="true" /> }
                                tabIndex={ -1 }
                            >
                                PDF barcode berhasil dibuat dan diunduh. Buka PDF untuk memilih printer.
                            </Alert>
                        ) }
                    </div>
                ) : (
                    <Alert severity="info">Tidak ada barang yang dapat dicetak.</Alert>
                ) }
            </DialogContent>

            <DialogActions className="flex-wrap p-4">
                <span className="mr-auto text-sm text-gray-600">
                    Maksimum { MAX_BARCODE_LABELS } label per PDF
                </span>
                <Button onClick={ handleClose } disabled={ downloadState === 'pending' }>
                    { downloadState === 'success' ? 'Selesai' : 'Batal' }
                </Button>
                <Button
                    variant="contained"
                    startIcon={ downloadState === 'pending'
                        ? <CircularProgress size={ 16 } color="inherit" />
                        : <Download size={ 18 } aria-hidden="true" /> }
                    disabled={ loading
                        || Boolean(loadError)
                        || !items.length
                        || totalLabels > MAX_BARCODE_LABELS
                        || downloadState === 'pending' }
                    onClick={ handleDownload }
                >
                    { downloadState === 'pending'
                        ? 'Membuat PDF...'
                        : `Unduh PDF (${ totalLabels })` }
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ItemBulkBarcodeDialog.propTypes = {
    allowCopies: PropTypes.bool,
    contextLabel: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        sku: PropTypes.string.isRequired
    })),
    loadError: PropTypes.string,
    loading: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onRetry: PropTypes.func,
    open: PropTypes.bool.isRequired
};

export default ItemBulkBarcodeDialog;
