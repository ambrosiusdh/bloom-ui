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
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Pagination,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip
} from '@mui/material';
import {
    ArrowDownLeftIcon,
    ArrowLeftRightIcon,
    ArrowUpRightIcon,
    EyeIcon,
    RotateCcwIcon,
    XIcon
} from 'lucide-react';
import PropTypes from 'prop-types';

import stockMovementApi from '@api/stock-movement.js';
import { GENERIC_ERR_MESSAGE } from '@constants/general.js';
import { useBreadcrumbStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';
import { formatQuantity, formatUnitOfMeasure } from '@utils/quantity-utils.js';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const MOVEMENT_TYPE_OPTIONS = {
    IN: 'Masuk',
    OUT: 'Keluar'
};

const LOCATION_OPTIONS = {
    STORE: 'Toko',
    WAREHOUSE: 'Gudang'
};

const SOURCE_TYPE_LABELS = {
    OPENING_BALANCE: 'Stok awal',
    SALE: 'Penjualan',
    STOCK_ADJUSTMENT: 'Penyesuaian stok',
    GOODS_RECEIPT: 'Penerimaan barang',
    GOODS_RECEIPT_CANCELLATION: 'Pembatalan penerimaan barang',
    STOCK_OPNAME: 'Stok opname',
    PURCHASE: 'Pembelian',
    RETURN: 'Retur',
    TRANSFER: 'Transfer'
};

const SOURCE_DETAIL_ROUTES = {
    SALE: {
        path: '/sales',
        label: 'Buka penjualan terkait'
    },
    GOODS_RECEIPT: {
        path: '/goods-receipts',
        label: 'Buka penerimaan terkait'
    },
    STOCK_ADJUSTMENT: {
        path: '/stock-adjustments',
        label: 'Buka penyesuaian terkait'
    }
};

const getPage = searchParams => Math.max(Number(searchParams.get('page')) || 1, 1);

const getPageSize = searchParams => {
    const requestedSize = Number(searchParams.get('size'));
    return PAGE_SIZE_OPTIONS.includes(requestedSize) ? requestedSize : PAGE_SIZE_OPTIONS[0];
};

const getFilterValue = (searchParams, key, allowedValues) => {
    const value = searchParams.get(key) || '';
    return !allowedValues || Object.hasOwn(allowedValues, value) ? value : '';
};

const getErrorMessage = error => error?.message || GENERIC_ERR_MESSAGE;
const getMovementTypeLabel = movementType => MOVEMENT_TYPE_OPTIONS[movementType] || 'Arah tidak tersedia';
const getLocationLabel = location => LOCATION_OPTIONS[location] || 'Lokasi tidak tersedia';
const getSourceTypeLabel = sourceType => SOURCE_TYPE_LABELS[sourceType] || 'Sumber lainnya';

const getSourceDetailLink = movement => {
    const sourceRoute = SOURCE_DETAIL_ROUTES[movement.sourceType];

    if (!sourceRoute || !movement.referenceNo) {
        return null;
    }

    return {
        label: sourceRoute.label,
        to: `${ sourceRoute.path }/${ encodeURIComponent(movement.referenceNo) }`
    };
};

function MovementDirection({ movementType, quantity, unitOfMeasure }) {
    const isIncoming = movementType === 'IN';
    const isOutgoing = movementType === 'OUT';
    const directionPrefix = isIncoming ? '+' : isOutgoing ? '−' : '';
    const colorClass = isIncoming ? 'text-green-700' : isOutgoing ? 'text-red-700' : 'text-gray-700';

    return (
        <span className={ `inline-flex items-center gap-1 font-semibold ${ colorClass }` }>
            { isIncoming && <ArrowDownLeftIcon size={ 17 } aria-hidden="true" /> }
            { isOutgoing && <ArrowUpRightIcon size={ 17 } aria-hidden="true" /> }
            <span>{ getMovementTypeLabel(movementType) } · { directionPrefix }{ formatQuantity(quantity, unitOfMeasure) }</span>
        </span>
    );
}

MovementDirection.propTypes = {
    movementType: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    unitOfMeasure: PropTypes.string
};

function StockMovementDetailModal({ movement, onClose }) {
    if (!movement) {
        return null;
    }

    const unitOfMeasure = movement.item?.baseUnitOfMeasure;
    const sourceDetailLink = getSourceDetailLink(movement);

    return (
        <Dialog
            open
            onClose={ onClose }
            maxWidth="sm"
            fullWidth
            aria-labelledby="stock-movement-detail-title"
            aria-describedby="stock-movement-detail-description"
        >
            <DialogTitle id="stock-movement-detail-title" className="flex items-start justify-between gap-3">
                <span className="font-bold">Detail pergerakan stok</span>
                <IconButton onClick={ onClose } aria-label="Tutup detail pergerakan stok">
                    <XIcon aria-hidden="true" />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <p id="stock-movement-detail-description" className="mb-5 text-sm text-gray-600">
                    { movement.referenceNo || 'Referensi tidak tersedia' } · { getSourceTypeLabel(movement.sourceType) }
                </p>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <dt className="text-sm text-gray-600">Barang</dt>
                        <dd className="mt-1 font-semibold break-words">
                            { movement.item?.name || '-' }
                            <span className="block text-sm font-normal text-gray-600">
                                { movement.item?.sku || '-' } · { formatUnitOfMeasure(unitOfMeasure) }
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-600">Arah</dt>
                        <dd className="mt-1">{ getMovementTypeLabel(movement.movementType) }</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-600">Sumber</dt>
                        <dd className="mt-1">{ getSourceTypeLabel(movement.sourceType) }</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-600">Lokasi</dt>
                        <dd className="mt-1">{ getLocationLabel(movement.location) }</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-600">Perubahan</dt>
                        <dd className="mt-1">
                            <MovementDirection { ...movement } unitOfMeasure={ unitOfMeasure } />
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-600">Saldo sebelumnya</dt>
                        <dd className="mt-1 font-semibold tabular-nums">
                            { formatQuantity(movement.qtyBefore, unitOfMeasure) }
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-600">Saldo sesudahnya</dt>
                        <dd className="mt-1 font-semibold tabular-nums">
                            { formatQuantity(movement.qtyAfter, unitOfMeasure) }
                        </dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-sm text-gray-600">Referensi</dt>
                        <dd className="mt-1 font-semibold break-all">{ movement.referenceNo || '-' }</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-600">Dibuat oleh</dt>
                        <dd className="mt-1">{ movement.createdBy || '-' }</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-600">Dibuat pada</dt>
                        <dd className="mt-1">{ formatDate(movement.createdAt) || '-' }</dd>
                    </div>
                </dl>

                { !sourceDetailLink && (
                    <Alert className="mt-5" severity="info">
                        Detail sumber belum tersedia untuk jenis pergerakan ini.
                    </Alert>
                ) }
            </DialogContent>

            <DialogActions className="flex-wrap p-4 pt-2">
                <Button onClick={ onClose }>Tutup</Button>
                { sourceDetailLink && (
                    <Button component={ Link } to={ sourceDetailLink.to } variant="contained">
                        { sourceDetailLink.label }
                    </Button>
                ) }
            </DialogActions>
        </Dialog>
    );
}

StockMovementDetailModal.propTypes = {
    movement: PropTypes.object,
    onClose: PropTypes.func.isRequired
};

export default function StockMovementList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const [searchParams, setSearchParams] = useSearchParams();
    const [movements, setMovements] = useState([]);
    const [paging, setPaging] = useState({});
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retryVersion, setRetryVersion] = useState(0);
    const [selectedMovement, setSelectedMovement] = useState(null);
    const skuInputRef = useRef(null);

    const page = getPage(searchParams);
    const size = getPageSize(searchParams);
    const itemSku = getFilterValue(searchParams, 'itemSku');
    const movementType = getFilterValue(searchParams, 'movementType', MOVEMENT_TYPE_OPTIONS);
    const location = getFilterValue(searchParams, 'location', LOCATION_OPTIONS);
    const hasFilters = Boolean(itemSku || movementType || location);
    const searchKey = searchParams.toString();
    const [skuInput, setSkuInput] = useState(itemSku);
    const totalElements = Number.isFinite(Number(paging.totalElements))
        ? Number(paging.totalElements)
        : movements.length;
    const totalPages = Math.max(Number(paging.totalPages) || 1, 1);

    const updateQuery = updates => {
        const nextSearchParams = new URLSearchParams(searchParams);

        Object.entries(updates).forEach(([key, value]) => {
            if (value === '' || value === undefined || value === null) {
                nextSearchParams.delete(key);
            } else {
                nextSearchParams.set(key, String(value));
            }
        });

        setSearchParams(nextSearchParams);
    };

    useEffect(() => {
        setBreadcrumbs(['Pergerakan stok']);
    }, [setBreadcrumbs]);

    useEffect(() => {
        setSkuInput(itemSku);
    }, [itemSku]);

    useEffect(() => {
        if (skuInput === itemSku) {
            return undefined;
        }

        const timer = setTimeout(() => {
            const nextSearchParams = new URLSearchParams(searchKey);

            if (skuInput) {
                nextSearchParams.set('itemSku', skuInput);
            } else {
                nextSearchParams.delete('itemSku');
            }
            nextSearchParams.set('page', '1');
            setSearchParams(nextSearchParams);
        }, 350);

        return () => clearTimeout(timer);
    }, [itemSku, searchKey, setSearchParams, skuInput]);

    useEffect(() => {
        const controller = new AbortController();
        const params = {
            page,
            size,
            ...(itemSku ? { itemSku } : {}),
            ...(movementType ? { movementType } : {}),
            ...(location ? { location } : {})
        };

        setLoading(true);
        setError('');

        stockMovementApi.getStockMovementList({
            signal: controller.signal,
            params
        })
            .then(({ data: response }) => {
                if (!controller.signal.aborted) {
                    const { content = [], ...nextPaging } = response.data || {};

                    setMovements(content);
                    setPaging(nextPaging);
                }
            })
            .catch(requestError => {
                if (!controller.signal.aborted) {
                    setMovements([]);
                    setPaging({});
                    setError(getErrorMessage(requestError));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [itemSku, location, movementType, page, retryVersion, size]);

    const clearFilters = () => {
        setSkuInput('');
        updateQuery({
            itemSku: '',
            movementType: '',
            location: '',
            page: 1
        });
        skuInputRef.current?.focus();
    };

    const resultSummary = isLoading
        ? 'Memuat hasil pergerakan stok.'
        : error
            ? 'Daftar pergerakan belum tersedia.'
            : `${ totalElements } pergerakan ditemukan`;

    return (
        <div className="stock-movement-list">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="font-bold text-2xl">Riwayat stok</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Telusuri perubahan, sumber, dan saldo stok pada setiap lokasi.
                    </p>
                </div>

                <Button
                    component={ Link }
                    to="/stock-transfers/new"
                    variant="contained"
                    className="self-start"
                    startIcon={ <ArrowLeftRightIcon size={ 19 } aria-hidden="true" /> }
                >
                    Buat transfer stok
                </Button>
            </div>

            { error && (
                <Alert
                    className="mb-4"
                    severity="error"
                    action={ <Button color="inherit" size="small" onClick={ () => setRetryVersion(version => version + 1) }>Coba lagi</Button> }
                >
                    { error }
                </Alert>
            ) }

            <section className="card mb-4" aria-label="Filter riwayat pergerakan stok">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_minmax(11rem,0.45fr)_minmax(10rem,0.4fr)_auto] md:items-end">
                    <TextField
                        inputRef={ skuInputRef }
                        label="Barang atau SKU"
                        placeholder="Masukkan SKU barang"
                        type="search"
                        size="small"
                        value={ skuInput }
                        onChange={ event => setSkuInput(event.target.value) }
                    />
                    <TextField
                        select
                        label="Arah pergerakan"
                        size="small"
                        value={ movementType }
                        onChange={ event => updateQuery({
                            movementType: event.target.value,
                            page: 1
                        }) }
                    >
                        <MenuItem value="">Semua arah</MenuItem>
                        { Object.entries(MOVEMENT_TYPE_OPTIONS).map(([value, label]) => (
                            <MenuItem key={ value } value={ value }>{ label }</MenuItem>
                        )) }
                    </TextField>
                    <TextField
                        select
                        label="Lokasi"
                        size="small"
                        value={ location }
                        onChange={ event => updateQuery({
                            location: event.target.value,
                            page: 1
                        }) }
                    >
                        <MenuItem value="">Semua lokasi</MenuItem>
                        { Object.entries(LOCATION_OPTIONS).map(([value, label]) => (
                            <MenuItem key={ value } value={ value }>{ label }</MenuItem>
                        )) }
                    </TextField>
                    <Button
                        className="justify-self-start"
                        disabled={ !hasFilters }
                        onClick={ clearFilters }
                        startIcon={ <RotateCcwIcon size={ 18 } aria-hidden="true" /> }
                    >
                        Reset filter
                    </Button>
                </div>
            </section>

            <section className="overflow-hidden rounded-lg bg-white pb-2 shadow-lg" aria-labelledby="stock-movement-list-title">
                <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 id="stock-movement-list-title" className="text-xl font-bold">Daftar pergerakan</h2>
                        <p className="text-sm text-gray-600" aria-live="polite">{ resultSummary }</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <TextField
                            select
                            label="Data per halaman"
                            value={ size }
                            size="small"
                            className="w-36"
                            onChange={ event => updateQuery({
                                size: event.target.value,
                                page: 1
                            }) }
                        >
                            { PAGE_SIZE_OPTIONS.map(option => (
                                <MenuItem key={ option } value={ option }>{ option }</MenuItem>
                            )) }
                        </TextField>
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                            Halaman { page } dari { totalPages }
                        </span>
                        <Pagination
                            page={ page }
                            count={ totalPages }
                            disabled={ isLoading || !paging.totalPages }
                            onChange={ (_, nextPage) => updateQuery({ page: nextPage }) }
                            aria-label="Halaman riwayat pergerakan stok"
                        />
                    </div>
                </div>

                <TableContainer component={ Paper } elevation={ 0 } className="!overflow-x-hidden">
                    <Table
                        className="!block lg:!table lg:!table-fixed"
                        aria-label="Riwayat pergerakan stok"
                    >
                        <caption className="sr-only">
                            Barang, arah dan jumlah pergerakan, sumber, lokasi, saldo, pembuat, waktu, dan tindakan detail.
                        </caption>
                        <TableHead className="hidden bg-gray-100 lg:!table-header-group">
                            <TableRow>
                                <TableCell className="lg:!w-[25%]">Barang</TableCell>
                                <TableCell className="lg:!w-[23%]">Pergerakan</TableCell>
                                <TableCell className="lg:!w-[11%]">Lokasi</TableCell>
                                <TableCell className="lg:!w-[17%]">Saldo</TableCell>
                                <TableCell className="lg:!w-[17%]">Dibuat oleh &amp; pada</TableCell>
                                <TableCell className="lg:!w-[4rem]" align="right">
                                    <span className="sr-only">Detail</span>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="!block lg:!table-row-group">
                            { isLoading ? (
                                <TableRow className="!block lg:!table-row">
                                    <TableCell colSpan="6" className="!block !border-b-0 !py-12 !text-center lg:!table-cell">
                                        <span className="inline-flex items-center gap-2" role="status">
                                            <CircularProgress size={ 22 } /> Memuat pergerakan stok...
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow className="!block lg:!table-row">
                                    <TableCell colSpan="6" className="!block !border-b-0 !py-12 !text-center !text-gray-600 lg:!table-cell">
                                        Riwayat stok belum dapat ditampilkan.
                                    </TableCell>
                                </TableRow>
                            ) : movements.length ? movements.map((movement, index) => {
                                const unitOfMeasure = movement.item?.baseUnitOfMeasure;
                                const isLastRow = index === movements.length - 1;
                                const rowBorderClass = isLastRow ? '' : 'border-b border-gray-200';
                                const tableCellClass = isLastRow ? '!border-b-0' : '';

                                return (
                                    <TableRow
                                        key={ movement.id }
                                        className={ `!grid grid-cols-1 gap-x-5 gap-y-4 px-4 py-4 sm:grid-cols-2 lg:!table-row lg:p-0 ${ rowBorderClass } lg:border-b-0` }
                                    >
                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 lg:hidden">Barang</span>
                                            <strong className="mt-1 block break-words font-semibold lg:mt-0">
                                                { movement.item?.name || '-' }
                                            </strong>
                                            <span className="mt-1 block text-sm text-gray-600 break-all">
                                                { movement.item?.sku || '-' } · { formatUnitOfMeasure(unitOfMeasure) }
                                            </span>
                                        </TableCell>

                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 lg:hidden">Pergerakan</span>
                                            <div className="mt-1 lg:mt-0">
                                                <MovementDirection { ...movement } unitOfMeasure={ unitOfMeasure } />
                                            </div>
                                            <span className="mt-1 block text-sm text-gray-600">
                                                { getSourceTypeLabel(movement.sourceType) }
                                            </span>
                                        </TableCell>

                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 lg:hidden">Lokasi</span>
                                            <span className="mt-1 block lg:mt-0">{ getLocationLabel(movement.location) }</span>
                                        </TableCell>

                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 lg:hidden">Saldo</span>
                                            <span className="mt-1 block whitespace-nowrap tabular-nums lg:mt-0">
                                                { formatQuantity(movement.qtyBefore, unitOfMeasure) }
                                                <span aria-hidden="true"> → </span>
                                                <span className="sr-only"> menjadi </span>
                                                { formatQuantity(movement.qtyAfter, unitOfMeasure) }
                                            </span>
                                        </TableCell>

                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 lg:hidden">Dibuat oleh &amp; pada</span>
                                            <strong className="mt-1 block break-words font-medium lg:mt-0">
                                                { movement.createdBy || '-' }
                                            </strong>
                                            <span className="mt-1 block text-sm text-gray-600">
                                                { formatDate(movement.createdAt) || '-' }
                                            </span>
                                        </TableCell>

                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 sm:col-span-2 lg:!table-cell lg:!border-b lg:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 lg:hidden">Detail</span>
                                            <div className="mt-1 flex lg:mt-0 lg:justify-end">
                                                <Tooltip title="Lihat detail" arrow>
                                                    <IconButton
                                                        aria-label={ `Lihat detail pergerakan ${ movement.item?.name || movement.item?.sku || movement.id }` }
                                                        onClick={ () => setSelectedMovement(movement) }
                                                        sx={ {
                                                            width: 44,
                                                            height: 44
                                                        } }
                                                    >
                                                        <EyeIcon size={ 19 } aria-hidden="true" />
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow className="!block lg:!table-row">
                                    <TableCell colSpan="6" className="!block !border-b-0 !px-4 !py-12 !text-center lg:!table-cell">
                                        <div className="font-semibold text-gray-700">Tidak ada pergerakan stok</div>
                                        <p className="mt-1 text-gray-600">
                                            { hasFilters
                                                ? 'Ubah atau reset filter untuk melihat catatan lain.'
                                                : 'Pergerakan akan tampil setelah stok dicatat oleh sistem.' }
                                        </p>
                                        { hasFilters && <Button className="mt-3" onClick={ clearFilters }>Reset filter</Button> }
                                    </TableCell>
                                </TableRow>
                            ) }
                        </TableBody>
                    </Table>
                </TableContainer>
            </section>

            <StockMovementDetailModal
                movement={ selectedMovement }
                onClose={ () => setSelectedMovement(null) }
            />
        </div>
    );
}
