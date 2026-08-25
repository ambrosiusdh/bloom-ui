import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    MenuItem,
    Pagination,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from '@mui/material';
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
    STOCK_OPNAME: 'Stok opname',
    PURCHASE: 'Pembelian',
    RETURN: 'Retur',
    TRANSFER: 'Transfer'
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
const getMovementTypeLabel = movementType => MOVEMENT_TYPE_OPTIONS[movementType] || movementType || '-';
const getLocationLabel = location => LOCATION_OPTIONS[location] || location || '-';
const getSourceTypeLabel = sourceType => SOURCE_TYPE_LABELS[sourceType] || sourceType || '-';

function MovementDirection({ movementType, quantity, unitOfMeasure }) {
    const directionPrefix = movementType === 'IN' ? '+' : movementType === 'OUT' ? '−' : '';
    const colorClass = movementType === 'IN' ? 'text-green-700' : movementType === 'OUT' ? 'text-red-700' : '';

    return (
        <span className={ `${ colorClass } font-semibold` }>
            { directionPrefix }{ formatQuantity(quantity, unitOfMeasure) }
        </span>
    );
}

MovementDirection.propTypes = {
    movementType: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    unitOfMeasure: PropTypes.string
};

function MovementSummary({ movement }) {
    const unitOfMeasure = movement.item?.baseUnitOfMeasure;

    return (
        <article className="border rounded-lg p-4 space-y-3 bg-white">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-semibold">{ movement.item?.name || '-' }</div>
                    <div className="text-sm text-gray-600">{ movement.item?.sku || '-' }</div>
                </div>
                <Chip label={ getMovementTypeLabel(movement.movementType) } size="small" />
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <div>
                    <dt className="text-gray-600">Jumlah</dt>
                    <dd><MovementDirection { ...movement } unitOfMeasure={ unitOfMeasure } /></dd>
                </div>
                <div>
                    <dt className="text-gray-600">Lokasi</dt>
                    <dd>{ getLocationLabel(movement.location) }</dd>
                </div>
                <div>
                    <dt className="text-gray-600">Referensi</dt>
                    <dd>{ movement.referenceNo || '-' }</dd>
                </div>
                <div>
                    <dt className="text-gray-600">Oleh</dt>
                    <dd>{ movement.createdBy || '-' }</dd>
                </div>
                <div className="col-span-2">
                    <dt className="text-gray-600">Saldo sebelum / sesudah</dt>
                    <dd>
                        { formatQuantity(movement.qtyBefore, unitOfMeasure) }
                        <span aria-hidden="true"> → </span>
                        <span className="sr-only"> ke </span>
                        { formatQuantity(movement.qtyAfter, unitOfMeasure) }
                    </dd>
                </div>
                <div className="col-span-2">
                    <dt className="text-gray-600">Waktu</dt>
                    <dd>{ formatDate(movement.createdAt) || '-' }</dd>
                </div>
            </dl>
        </article>
    );
}

MovementSummary.propTypes = {
    movement: PropTypes.object.isRequired
};

export default function StockMovementList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const [searchParams, setSearchParams] = useSearchParams();
    const [movements, setMovements] = useState([]);
    const [paging, setPaging] = useState({});
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retryVersion, setRetryVersion] = useState(0);

    const page = getPage(searchParams);
    const size = getPageSize(searchParams);
    const itemSku = getFilterValue(searchParams, 'itemSku');
    const movementType = getFilterValue(searchParams, 'movementType', MOVEMENT_TYPE_OPTIONS);
    const location = getFilterValue(searchParams, 'location', LOCATION_OPTIONS);
    const hasFilters = Boolean(itemSku || movementType || location);
    const searchKey = searchParams.toString();
    const [skuInput, setSkuInput] = useState(itemSku);

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
        setBreadcrumbs(['Riwayat Pergerakan Stok']);
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

        stockMovementApi.getStockMovementList({ signal: controller.signal, params })
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

    const clearFilters = () => updateQuery({
        itemSku: '',
        movementType: '',
        location: '',
        page: 1
    });

    return (
        <div className="stock-movement-list">
            <div className="mb-4">
                <h2 className="font-bold text-2xl">Riwayat Pergerakan Stok</h2>
                <p className="mt-1 text-gray-600">Catatan perubahan stok yang sudah dikonfirmasi oleh sistem.</p>
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
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <TextField
                        className="md:flex-1"
                        label="SKU barang"
                        value={ skuInput }
                        onChange={ event => setSkuInput(event.target.value) }
                    />
                    <TextField
                        select
                        className="md:w-48"
                        label="Arah pergerakan"
                        value={ movementType }
                        onChange={ event => updateQuery({ movementType: event.target.value, page: 1 }) }
                    >
                        <MenuItem value="">Semua arah</MenuItem>
                        { Object.entries(MOVEMENT_TYPE_OPTIONS).map(([value, label]) => (
                            <MenuItem key={ value } value={ value }>{ label }</MenuItem>
                        )) }
                    </TextField>
                    <TextField
                        select
                        className="md:w-44"
                        label="Lokasi"
                        value={ location }
                        onChange={ event => updateQuery({ location: event.target.value, page: 1 }) }
                    >
                        <MenuItem value="">Semua lokasi</MenuItem>
                        { Object.entries(LOCATION_OPTIONS).map(([value, label]) => (
                            <MenuItem key={ value } value={ value }>{ label }</MenuItem>
                        )) }
                    </TextField>
                    <Button disabled={ !hasFilters } onClick={ clearFilters }>Hapus filter</Button>
                </div>
            </section>

            <section className="bg-white rounded-lg shadow-lg pb-2" aria-label="Daftar pergerakan stok">
                <div className="px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="text-xl font-bold">Pergerakan stok</h3>
                        { itemSku && <p className="text-sm text-gray-600">Barang: { itemSku }</p> }
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-700">Data per halaman:</span>
                        <TextField
                            select
                            value={ size }
                            size="small"
                            className="w-20"
                            aria-label="Data per halaman"
                            onChange={ event => updateQuery({ size: event.target.value, page: 1 }) }
                        >
                            { PAGE_SIZE_OPTIONS.map(option => <MenuItem key={ option } value={ option }>{ option }</MenuItem>) }
                        </TextField>
                        <Pagination
                            page={ page }
                            count={ paging.totalPages || 1 }
                            disabled={ isLoading || !paging.totalPages }
                            onChange={ (_, nextPage) => updateQuery({ page: nextPage }) }
                            aria-label="Halaman riwayat pergerakan stok"
                        />
                    </div>
                </div>

                { isLoading ? (
                    <div className="py-12 text-center" role="status">
                        <CircularProgress size={ 22 } />
                        <span className="ml-2">Memuat pergerakan stok...</span>
                    </div>
                ) : error ? (
                    <div className="py-12 text-center text-gray-600">Riwayat stok belum dapat ditampilkan.</div>
                ) : movements.length ? (
                    <>
                        <div className="md:hidden p-4 space-y-3">
                            { movements.map(movement => <MovementSummary key={ movement.id } movement={ movement } />) }
                        </div>
                        <TableContainer component={ Paper } elevation={ 0 } className="hidden md:block">
                            <Table sx={ { minWidth: 1160 } } aria-label="Riwayat pergerakan stok">
                                <TableHead className="bg-gray-100">
                                    <TableRow>
                                        <TableCell>Waktu</TableCell>
                                        <TableCell>Barang</TableCell>
                                        <TableCell>Pergerakan</TableCell>
                                        <TableCell>Lokasi</TableCell>
                                        <TableCell align="right">Jumlah</TableCell>
                                        <TableCell align="right">Saldo</TableCell>
                                        <TableCell>Referensi</TableCell>
                                        <TableCell>Oleh</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    { movements.map(movement => {
                                        const unitOfMeasure = movement.item?.baseUnitOfMeasure;

                                        return (
                                            <TableRow key={ movement.id } hover>
                                                <TableCell className="whitespace-nowrap">{ formatDate(movement.createdAt) || '-' }</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{ movement.item?.name || '-' }</div>
                                                    <div className="text-sm text-gray-600">{ movement.item?.sku || '-' }</div>
                                                    <div className="text-sm text-gray-600">{ formatUnitOfMeasure(unitOfMeasure) }</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={ getMovementTypeLabel(movement.movementType) } size="small" />
                                                    <div className="mt-1 text-sm text-gray-600">{ getSourceTypeLabel(movement.sourceType) }</div>
                                                </TableCell>
                                                <TableCell>{ getLocationLabel(movement.location) }</TableCell>
                                                <TableCell align="right" className="whitespace-nowrap">
                                                    <MovementDirection { ...movement } unitOfMeasure={ unitOfMeasure } />
                                                </TableCell>
                                                <TableCell align="right" className="whitespace-nowrap">
                                                    <div>{ formatQuantity(movement.qtyBefore, unitOfMeasure) }</div>
                                                    <div className="text-sm text-gray-600">sesudah: { formatQuantity(movement.qtyAfter, unitOfMeasure) }</div>
                                                </TableCell>
                                                <TableCell>{ movement.referenceNo || '-' }</TableCell>
                                                <TableCell>{ movement.createdBy || '-' }</TableCell>
                                            </TableRow>
                                        );
                                    }) }
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                ) : (
                    <div className="py-12 px-4 text-center">
                        <div className="font-semibold text-gray-700">Tidak ada pergerakan stok</div>
                        <p className="mt-1 text-gray-600">
                            { hasFilters ? 'Ubah atau hapus filter untuk melihat catatan lain.' : 'Pergerakan akan tampil setelah stok dicatat oleh sistem.' }
                        </p>
                    </div>
                ) }
            </section>
        </div>
    );
}
