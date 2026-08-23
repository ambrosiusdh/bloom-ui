import {
    useEffect,
    useRef,
    useState
} from 'react';
import {
    Link,
    useSearchParams
} from 'react-router-dom';
import {
    Alert,
    Button,
    CircularProgress,
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
    TextField
} from '@mui/material';
import {
    HistoryIcon,
    PencilIcon,
    Plus,
    PrinterIcon,
    TrashIcon
} from 'lucide-react';
import { enqueueSnackbar } from 'notistack';

import BloomConfirmationModal from '@components/_ui/BloomConfirmationModal.jsx';
import ItemAuditLogModal from '@components/item/ItemAuditLogModal.jsx';
import ItemBarcodeModal from '@components/item/ItemBarcodeModal.jsx';
import ItemDetailModal from '@components/item/ItemDetailModal.jsx';
import { GENERIC_ERR_MESSAGE } from '@constants/general.js';
import { ITEM_LIST_MESSAGES } from '@constants/item.jsx';
import {
    useBreadcrumbStore,
    useItemCategoryStore,
    useItemStore
} from '@stores/index.js';
import { formatQuantity, formatUnitOfMeasure } from '@utils/quantity-utils.js';

const FILTER_KEY_DATA = {
    name: 'Nama barang',
    sku: 'Kode barang',
    category: 'Kategori'
};
const ITEM_PER_PAGE_OPTIONS = [5, 10, 25, 50];

const getSearchState = searchParams => {
    const requestedFilterKey = searchParams.get('key');
    const requestedSize = Number(searchParams.get('itemPerPage'));

    return {
        filters: searchParams.get('q') || '',
        selectedFilterKey: Object.hasOwn(FILTER_KEY_DATA, requestedFilterKey)
            ? requestedFilterKey
            : 'name',
        currentPage: Math.max(Number(searchParams.get('page')) || 1, 1),
        itemPerPage: ITEM_PER_PAGE_OPTIONS.includes(requestedSize) ? requestedSize : 10
    };
};

const getListQueryKey = ({ currentPage, itemPerPage, selectedFilterKey, filters, refreshVersion }) => (
    JSON.stringify({ currentPage, itemPerPage, selectedFilterKey, filters, refreshVersion })
);

const getErrorMessage = error => error?.message || GENERIC_ERR_MESSAGE;

export default function ItemList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const itemList = useItemStore(state => state.itemList);
    const itemPaging = useItemStore(state => state.itemPaging);
    const getItemList = useItemStore(state => state.getItemList);
    const getItemDetails = useItemStore(state => state.getItemDetails);
    const deactivateItem = useItemStore(state => state.deactivateItem);
    const itemCategoryList = useItemCategoryStore(state => state.itemCategoryList);
    const getItemCategoryList = useItemCategoryStore(state => state.getItemCategoryList);
    const [searchParams, setSearchParams] = useSearchParams();
    const initialSearchState = getSearchState(searchParams);

    const [selectedItemDetailSku, setSelectedItemDetailSku] = useState('');
    const [selectedItemDetailData, setSelectedItemDetailData] = useState(null);
    const [selectedDeleteTarget, setSelectedDeleteTarget] = useState({});
    const [selectedItemAuditLogData, setSelectedItemAuditLogData] = useState({});
    const [selectedBarcodeItem, setSelectedBarcodeItem] = useState({});
    const [filters, setFilters] = useState(initialSearchState.filters);
    const [selectedFilterKey, setSelectedFilterKey] = useState(initialSearchState.selectedFilterKey);
    const [currentPage, setCurrentPage] = useState(initialSearchState.currentPage);
    const [itemPerPage, setItemPerPage] = useState(initialSearchState.itemPerPage);
    const [refreshVersion, setRefreshVersion] = useState(0);
    const [loadedQueryKey, setLoadedQueryKey] = useState('');
    const [isLoadingTable, setLoadingTable] = useState(true);
    const [listError, setListError] = useState('');
    const [isLoadingItemDetail, setLoadingItemDetail] = useState(false);
    const [itemDetailError, setItemDetailError] = useState('');
    const [messageAlertData, setMessageAlertData] = useState(() => ({
        show: searchParams.has('message'),
        message: searchParams.get('message'),
        type: searchParams.get('messageType') || 'info'
    }));
    const detailRequestRef = useRef(null);

    const queryKey = getListQueryKey({
        currentPage,
        itemPerPage,
        selectedFilterKey,
        filters,
        refreshVersion
    });
    const hasCurrentQueryData = loadedQueryKey === queryKey;
    const showTableLoading = isLoadingTable || (!listError && !hasCurrentQueryData);

    const refreshItemList = () => setRefreshVersion(version => version + 1);

    const handleFilterKeyChange = event => {
        setSelectedFilterKey(event.target.value);
        setFilters('');
        setCurrentPage(1);
    };

    const handleFilterClear = () => {
        setFilters('');
        setSelectedFilterKey('name');
        setCurrentPage(1);
    };

    const handleCloseItemDetail = () => {
        detailRequestRef.current?.abort();
        detailRequestRef.current = null;
        setSelectedItemDetailSku('');
        setSelectedItemDetailData(null);
        setItemDetailError('');
        setLoadingItemDetail(false);
    };

    const openItemDetail = async sku => {
        detailRequestRef.current?.abort();
        const controller = new AbortController();
        detailRequestRef.current = controller;
        setSelectedItemDetailSku(sku);
        setSelectedItemDetailData(null);
        setItemDetailError('');
        setLoadingItemDetail(true);

        try {
            const response = await getItemDetails(sku, { signal: controller.signal });
            if (!controller.signal.aborted) {
                setSelectedItemDetailData(response.data);
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                setItemDetailError(getErrorMessage(error));
            }
        } finally {
            if (detailRequestRef.current === controller) {
                setLoadingItemDetail(false);
            }
        }
    };

    const handleDeleteItem = async () => {
        try {
            await deactivateItem(selectedDeleteTarget.sku, { useLoader: true });
            enqueueSnackbar(
                ITEM_LIST_MESSAGES.deleteItemSuccess.message(selectedDeleteTarget.name),
                ITEM_LIST_MESSAGES.deleteItemSuccess.options
            );
            setSelectedDeleteTarget({});
            setCurrentPage(1);
            refreshItemList();
        } catch (error) {
            enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
        }
    };

    useEffect(() => {
        setBreadcrumbs(['Data Barang']);
        getItemCategoryList({ params: { page: 1, size: 2000 } }).catch(() => {});
    }, [getItemCategoryList, setBreadcrumbs]);

    useEffect(() => {
        setSearchParams({
            page: String(currentPage),
            itemPerPage: String(itemPerPage),
            q: filters,
            key: selectedFilterKey
        });
    }, [currentPage, filters, itemPerPage, selectedFilterKey, setSearchParams]);

    useEffect(() => {
        const controller = new AbortController();
        const querySnapshot = queryKey;

        setLoadingTable(true);
        setListError('');
        const timer = setTimeout(async () => {
            try {
                await getItemList({
                    signal: controller.signal,
                    params: {
                        page: currentPage,
                        size: itemPerPage,
                        [selectedFilterKey]: filters,
                        isRemoved: false
                    }
                });
                if (!controller.signal.aborted) {
                    setLoadedQueryKey(querySnapshot);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setListError(getErrorMessage(error));
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingTable(false);
                }
            }
        }, 350);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [getItemList, queryKey]);

    useEffect(() => () => detailRequestRef.current?.abort(), []);

    return (
        <div className="item-list">
            { selectedBarcodeItem?.sku && (
                <ItemBarcodeModal
                    itemData={ selectedBarcodeItem }
                    onClose={ () => setSelectedBarcodeItem({}) }
                />
            ) }

            { selectedItemDetailSku && (
                <ItemDetailModal
                    itemData={ selectedItemDetailData || { sku: selectedItemDetailSku } }
                    isLoading={ isLoadingItemDetail }
                    error={ itemDetailError }
                    onClose={ handleCloseItemDetail }
                    onRetry={ () => openItemDetail(selectedItemDetailSku) }
                />
            ) }

            { selectedItemAuditLogData?.sku && (
                <ItemAuditLogModal
                    sku={ selectedItemAuditLogData.sku }
                    onClose={ () => setSelectedItemAuditLogData({}) }
                />
            ) }

            { selectedDeleteTarget?.sku && (
                <BloomConfirmationModal
                    onCancel={ () => setSelectedDeleteTarget({}) }
                    onConfirm={ handleDeleteItem }
                    title={ `Hapus ${selectedDeleteTarget.name}?` }
                    confirmButtonText="Hapus"
                >
                    <div className="item-list__delete">
                        <div className="item-list__delete-description">
                            Apakah Anda yakin ingin menghapus
                            <span className="font-bold"> { selectedDeleteTarget.name }</span>?
                        </div>
                        Jika dihapus, data barang tidak bisa dikembalikan lagi.
                    </div>
                </BloomConfirmationModal>
            ) }

            { messageAlertData.show && (
                <Alert
                    className="item-list__alert mb-4"
                    variant="filled"
                    severity={ messageAlertData.type }
                    onClose={ () => setMessageAlertData({}) }
                >
                    { messageAlertData.message }
                </Alert>
            ) }

            <div className="item-list__header mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <h2 className="item-list__header-title font-bold text-2xl">Daftar Barang</h2>
                <Link to="/items/new" className="item-list__header-action-create self-start sm:self-auto">
                    <Button variant="contained" endIcon={ <Plus className="w-5" /> }>
                        Buat Barang
                    </Button>
                </Link>
            </div>

            { listError && (
                <Alert
                    className="mb-4"
                    severity="error"
                    action={ <Button color="inherit" size="small" onClick={ refreshItemList }>Coba lagi</Button> }
                >
                    { listError }
                </Alert>
            ) }

            <div className="item-list__filter card mb-4 flex flex-col gap-2 md:flex-row md:items-center">
                <TextField
                    select
                    className="item-list__filter-key md:basis-1/4"
                    label="Cari berdasarkan"
                    variant="outlined"
                    size="small"
                    value={ selectedFilterKey }
                    onChange={ handleFilterKeyChange }
                >
                    { Object.entries(FILTER_KEY_DATA).map(([filterKey, label]) => (
                        <MenuItem key={ filterKey } value={ filterKey }>{ label }</MenuItem>
                    )) }
                </TextField>

                { selectedFilterKey === 'category' ? (
                    <TextField
                        select
                        className="item-list__filter-value md:basis-1/3"
                        label="Cari berdasarkan Kategori"
                        variant="outlined"
                        size="small"
                        value={ filters }
                        onChange={ event => {
                            setFilters(event.target.value);
                            setCurrentPage(1);
                        } }
                    >
                        <MenuItem value=""><em>Semua kategori</em></MenuItem>
                        { itemCategoryList?.map(category => (
                            <MenuItem key={ category.code } value={ category.code }>
                                [{ category.code }] { category.name }
                            </MenuItem>
                        )) }
                    </TextField>
                ) : (
                    <TextField
                        className="item-list__filter-value md:basis-1/3"
                        label={ `Cari berdasarkan ${FILTER_KEY_DATA[selectedFilterKey]}` }
                        variant="outlined"
                        size="small"
                        value={ filters }
                        onChange={ event => {
                            setFilters(event.target.value);
                            setCurrentPage(1);
                        } }
                    />
                ) }

                <Button className="item-list__filter-clear self-start" variant="text" onClick={ handleFilterClear }>
                    Hapus filter
                </Button>
            </div>

            <div className="item-list__content bg-white rounded-lg shadow-lg pb-2">
                <div className="item-list__content-pagination px-4 py-2 flex flex-col gap-2 lg:flex-row lg:justify-between lg:items-center">
                    <h3 className="item-list__content-pagination-title text-xl font-bold">Daftar Barang</h3>
                    <div className="item-list__content-pagination-inputs flex flex-wrap gap-2 items-center">
                        <span className="text-sm text-gray-700">Data per halaman:</span>
                        <TextField
                            select
                            value={ itemPerPage }
                            onChange={ event => {
                                setItemPerPage(Number(event.target.value));
                                setCurrentPage(1);
                            } }
                            size="small"
                            className="w-20 mr-2"
                            aria-label="Data per halaman"
                        >
                            { ITEM_PER_PAGE_OPTIONS.map(option => (
                                <MenuItem key={ option } value={ option }>{ option }</MenuItem>
                            )) }
                        </TextField>
                        <Pagination
                            page={ currentPage }
                            count={ itemPaging?.totalPages || 1 }
                            onChange={ (_, value) => setCurrentPage(value) }
                            disabled={ showTableLoading || !hasCurrentQueryData || !itemPaging?.totalPages }
                        />
                    </div>
                </div>

                <TableContainer component={ Paper } elevation={ 0 } className="item-list__content-table">
                    <Table sx={ { minWidth: 1050 } } aria-label="Daftar barang">
                        <TableHead className="item-list__content-table-header bg-gray-100">
                            <TableRow className="text-xs font-semibold tracking-wider">
                                <TableCell>Nama barang</TableCell>
                                <TableCell>Kategori</TableCell>
                                <TableCell>Kode barang</TableCell>
                                <TableCell>Satuan</TableCell>
                                <TableCell align="right">Harga</TableCell>
                                <TableCell align="right">Stok toko</TableCell>
                                <TableCell align="right">Stok gudang</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            { showTableLoading ? (
                                <TableRow>
                                    <TableCell colSpan="9" className="!border-b-0 !text-center italic !text-gray-500">
                                        <span className="inline-flex items-center gap-2" role="status">
                                            <CircularProgress size={ 18 } /> Memuat barang...
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ) : listError ? (
                                <TableRow>
                                    <TableCell colSpan="9" className="!border-b-0 !text-center !text-gray-500">
                                        Data barang belum dapat ditampilkan.
                                    </TableCell>
                                </TableRow>
                            ) : hasCurrentQueryData && itemList?.length ? itemList.map((item, index) => {
                                const isLastRow = index === itemList.length - 1;
                                const tableCellClass = isLastRow ? '!border-b-0' : '';
                                const openDetailFromKeyboard = event => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        openItemDetail(item.sku);
                                    }
                                };

                                return (
                                    <TableRow
                                        key={ item.sku }
                                        className="item-list__content-table-row hover:bg-gray-50 cursor-pointer"
                                        tabIndex={ 0 }
                                        aria-label={ `Lihat detail ${item.name}` }
                                        onClick={ event => {
                                            if (!event.target.closest('button') && !event.target.closest('a')) {
                                                openItemDetail(item.sku);
                                            }
                                        } }
                                        onKeyDown={ openDetailFromKeyboard }
                                    >
                                        <TableCell className={ `${tableCellClass} whitespace-nowrap w-full` }>{ item.name }</TableCell>
                                        <TableCell className={ `${tableCellClass} whitespace-nowrap` }>{ item.category?.name || '-' }</TableCell>
                                        <TableCell className={ `${tableCellClass} whitespace-nowrap` }>{ item.sku }</TableCell>
                                        <TableCell className={ `${tableCellClass} whitespace-nowrap` }>{ formatUnitOfMeasure(item.baseUnitOfMeasure) }</TableCell>
                                        <TableCell className={ `${tableCellClass} whitespace-nowrap` } align="right">
                                            { new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price || 0) }
                                        </TableCell>
                                        <TableCell className={ `${tableCellClass} whitespace-nowrap` } align="right">
                                            { formatQuantity(item.stockStore, item.baseUnitOfMeasure) }
                                        </TableCell>
                                        <TableCell className={ `${tableCellClass} whitespace-nowrap` } align="right">
                                            { formatQuantity(item.stockWarehouse, item.baseUnitOfMeasure) }
                                        </TableCell>
                                        <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                            { item.active ? 'Aktif' : 'Nonaktif' }
                                        </TableCell>
                                        <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                            <div className="flex gap-2">
                                                <IconButton component={ Link } to={ `/items/${item.sku}/edit` } size="small" aria-label={ `Ubah barang ${item.name}` }>
                                                    <PencilIcon className="text-gray-500" />
                                                </IconButton>
                                                <IconButton size="small" aria-label={ `Riwayat stok ${item.name}` } onClick={ () => setSelectedItemAuditLogData(item) }>
                                                    <HistoryIcon className="text-blue-500 w-5 h-5" />
                                                </IconButton>
                                                <IconButton size="small" aria-label={ `Cetak barcode ${item.name}` } onClick={ () => setSelectedBarcodeItem(item) }>
                                                    <PrinterIcon className="text-gray-700 w-5 h-5" />
                                                </IconButton>
                                                <IconButton size="small" color="error" aria-label={ `Hapus barang ${item.name}` } onClick={ () => setSelectedDeleteTarget(item) }>
                                                    <TrashIcon className="table-action__delete" />
                                                </IconButton>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan="9" className="!border-b-0 !text-center italic !text-gray-500">
                                        <div className="py-6">
                                            <div className="font-semibold not-italic text-gray-700">
                                                { filters ? 'Barang tidak ditemukan' : 'Belum ada barang aktif' }
                                            </div>
                                            <div className="mt-1 mb-3">
                                                { filters
                                                    ? 'Ubah atau hapus filter untuk mencoba lagi.'
                                                    : 'Buat barang agar stok dapat dicatat per lokasi.' }
                                            </div>
                                            { filters ? (
                                                <Button onClick={ handleFilterClear }>Hapus filter</Button>
                                            ) : (
                                                <Button component={ Link } to="/items/new" variant="contained">Buat barang</Button>
                                            ) }
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) }
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
}
