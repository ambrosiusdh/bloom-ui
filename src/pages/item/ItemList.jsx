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
    TextField,
    Tooltip
} from '@mui/material';
import {
    BarcodeIcon,
    CircleOff,
    HistoryIcon,
    PencilIcon,
    Plus
} from 'lucide-react';

import BloomConfirmationModal from '@components/_ui/BloomConfirmationModal.jsx';
import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import ItemBarcodeModal from '@components/item/ItemBarcodeModal.jsx';
import ItemDetailModal from '@components/item/ItemDetailModal.jsx';
import { GENERIC_ERR_MESSAGE } from '@constants/general.js';
import { ITEM_LIST_MESSAGES } from '@constants/item.jsx';
import {
    useBreadcrumbStore,
    useItemCategoryStore,
    useItemStore
} from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';
import { formatQuantity, formatUnitOfMeasure } from '@utils/quantity-utils.js';

const ITEM_PER_PAGE_OPTIONS = [5, 10, 25, 50];

const getUpdatedByLabel = updatedBy => updatedBy?.trim() || 'Belum tersedia';
const getUpdatedAtLabel = updatedAt => updatedAt
    ? formatDate(updatedAt)
    : 'Belum diperbarui';
const getFractionLabel = fractionalQuantityAllowed => fractionalQuantityAllowed
    ? 'Pecahan diizinkan'
    : 'Unit utuh';

const getSearchState = searchParams => {
    const requestedSize = Number(searchParams.get('itemPerPage'));

    return {
        searchQuery: searchParams.get('q') || '',
        categoryCode: searchParams.get('category') || '',
        currentPage: Math.max(Number(searchParams.get('page')) || 1, 1),
        itemPerPage: ITEM_PER_PAGE_OPTIONS.includes(requestedSize) ? requestedSize : 10
    };
};

const getListQueryKey = ({ currentPage, itemPerPage, searchQuery, categoryCode, refreshVersion }) => JSON.stringify({
    currentPage,
    itemPerPage,
    searchQuery,
    categoryCode,
    refreshVersion
});

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
    const [selectedDeactivateTarget, setSelectedDeactivateTarget] = useState({});
    const [selectedBarcodeItem, setSelectedBarcodeItem] = useState({});
    const [searchQuery, setSearchQuery] = useState(initialSearchState.searchQuery);
    const [categoryCode, setCategoryCode] = useState(initialSearchState.categoryCode);
    const [currentPage, setCurrentPage] = useState(initialSearchState.currentPage);
    const [itemPerPage, setItemPerPage] = useState(initialSearchState.itemPerPage);
    const [refreshVersion, setRefreshVersion] = useState(0);
    const [loadedQueryKey, setLoadedQueryKey] = useState('');
    const [isLoadingTable, setLoadingTable] = useState(true);
    const [listError, setListError] = useState('');
    const [isLoadingItemDetail, setLoadingItemDetail] = useState(false);
    const [itemDetailError, setItemDetailError] = useState('');
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [deactivationError, setDeactivationError] = useState('');
    const [messageAlertData, setMessageAlertData] = useState(() => ({
        show: searchParams.has('message'),
        message: searchParams.get('message'),
        type: searchParams.get('messageType') || 'info'
    }));
    const detailRequestRef = useRef(null);
    const deactivateTriggerRef = useRef(null);
    const deactivationInProgressRef = useRef(false);
    const deactivationErrorRef = useRef(null);
    const messageAlertRef = useRef(null);
    const syncingSearchParamsRef = useRef(false);
    const searchParamKey = searchParams.toString();

    const queryKey = getListQueryKey({
        currentPage,
        itemPerPage,
        searchQuery,
        categoryCode,
        refreshVersion
    });
    const hasCurrentQueryData = loadedQueryKey === queryKey;
    const showTableLoading = isLoadingTable || (!listError && !hasCurrentQueryData);
    const totalElements = hasCurrentQueryData
        ? Number(itemPaging?.totalElements) || 0
        : 0;
    const totalPages = Math.max(Number(itemPaging?.totalPages) || 1, 1);
    const firstVisibleItem = totalElements
        ? ((currentPage - 1) * itemPerPage) + 1
        : 0;
    const lastVisibleItem = totalElements
        ? Math.min(firstVisibleItem + itemList.length - 1, totalElements)
        : 0;
    const hasFilters = Boolean(searchQuery || categoryCode);

    const refreshItemList = () => setRefreshVersion(version => version + 1);

    const handleFilterClear = () => {
        setSearchQuery('');
        setCategoryCode('');
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

    const handleOpenBarcodeFromDetail = () => {
        if (!selectedItemDetailData?.sku) {
            return;
        }

        const item = selectedItemDetailData;

        handleCloseItemDetail();
        setSelectedBarcodeItem(item);
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

    const openDeactivateConfirmation = (item, trigger) => {
        deactivateTriggerRef.current = trigger;
        setDeactivationError('');
        setSelectedDeactivateTarget(item);
    };

    const closeDeactivateConfirmation = () => {
        if (isDeactivating) {
            return;
        }

        const trigger = deactivateTriggerRef.current;

        setDeactivationError('');
        setSelectedDeactivateTarget({});
        window.setTimeout(() => {
            if (trigger?.isConnected) {
                trigger.focus();
            }
        }, 0);
    };

    const handleDeactivateItem = async () => {
        if (deactivationInProgressRef.current || !selectedDeactivateTarget.sku) {
            return;
        }

        deactivationInProgressRef.current = true;
        setIsDeactivating(true);
        setDeactivationError('');

        try {
            await deactivateItem(selectedDeactivateTarget.sku, { useLoader: false });
            setMessageAlertData({
                show: true,
                message: ITEM_LIST_MESSAGES.deactivateItemSuccess.message(
                    selectedDeactivateTarget.name
                ),
                type: 'success'
            });
            setSelectedDeactivateTarget({});
            setCurrentPage(1);
            refreshItemList();
        } catch (error) {
            setDeactivationError(getErrorMessage(error));
        } finally {
            deactivationInProgressRef.current = false;
            setIsDeactivating(false);
        }
    };

    useEffect(() => {
        setBreadcrumbs(['Data Barang']);
        getItemCategoryList({ params: { page: 1, size: 2000 } }).catch(() => {});
    }, [getItemCategoryList, setBreadcrumbs]);

    useEffect(() => {
        const nextSearchState = getSearchState(searchParams);
        const searchStateChanged = nextSearchState.searchQuery !== searchQuery
            || nextSearchState.categoryCode !== categoryCode
            || nextSearchState.currentPage !== currentPage
            || nextSearchState.itemPerPage !== itemPerPage;

        if (!searchStateChanged) {
            return;
        }

        // This update came from browser Back/Forward, not from a form control.
        // Skip the URL-writing effect once so it does not overwrite that history entry.
        syncingSearchParamsRef.current = true;
        setSearchQuery(nextSearchState.searchQuery);
        setCategoryCode(nextSearchState.categoryCode);
        setCurrentPage(nextSearchState.currentPage);
        setItemPerPage(nextSearchState.itemPerPage);
    }, [searchParamKey]);

    useEffect(() => {
        const currentSearchState = getSearchState(searchParams);
        const searchParamsMatchLocalState = currentSearchState.searchQuery === searchQuery
            && currentSearchState.categoryCode === categoryCode
            && currentSearchState.currentPage === currentPage
            && currentSearchState.itemPerPage === itemPerPage;

        if (searchParamsMatchLocalState) {
            return;
        }

        if (syncingSearchParamsRef.current) {
            syncingSearchParamsRef.current = false;
            return;
        }

        setSearchParams({
            page: String(currentPage),
            itemPerPage: String(itemPerPage),
            q: searchQuery,
            category: categoryCode
        });
    }, [categoryCode, currentPage, itemPerPage, searchParamKey, searchQuery, setSearchParams]);

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
                        skuOrName: searchQuery,
                        category: categoryCode
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

    useEffect(() => {
        if (deactivationError) {
            deactivationErrorRef.current?.focus();
        }
    }, [deactivationError]);

    useEffect(() => {
        if (messageAlertData.show) {
            messageAlertRef.current?.focus();
        }
    }, [messageAlertData]);

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
                    onOpenBarcode={ handleOpenBarcodeFromDetail }
                    onRetry={ () => openItemDetail(selectedItemDetailSku) }
                />
            ) }

            { selectedDeactivateTarget?.sku && (
                <BloomConfirmationModal
                    onCancel={ closeDeactivateConfirmation }
                    onConfirm={ handleDeactivateItem }
                    title={ `Nonaktifkan ${ selectedDeactivateTarget.name }?` }
                    confirmButtonText={ isDeactivating ? 'Menonaktifkan...' : 'Nonaktifkan' }
                    confirmButtonColor="error"
                    isPending={ isDeactivating }
                    focusCancel
                >
                    <div className="item-list__delete">
                        { deactivationError && (
                            <Alert
                                ref={ deactivationErrorRef }
                                severity="error"
                                tabIndex={ -1 }
                                className="mb-3"
                            >
                                { deactivationError }
                            </Alert>
                        ) }
                        <div className="item-list__delete-description">
                            <span className="font-bold">{ selectedDeactivateTarget.name }</span> tidak lagi muncul
                            dalam daftar barang aktif.
                        </div>
                        Riwayat dan saldo barang tidak dihapus. Tindakan ini hanya menandai barang sebagai nonaktif.
                    </div>
                </BloomConfirmationModal>
            ) }

            { messageAlertData.show && (
                <Alert
                    ref={ messageAlertRef }
                    className="item-list__alert mb-4"
                    variant="filled"
                    severity={ messageAlertData.type }
                    tabIndex={ -1 }
                    onClose={ () => setMessageAlertData({}) }
                >
                    { messageAlertData.message }
                </Alert>
            ) }

            <div className="item-list__header mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                <div>
                    <h1 className="item-list__header-title font-bold text-2xl">Data Barang</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Kelola informasi barang serta stok toko dan gudang secara terpisah.
                    </p>
                </div>
                <Button
                    component={ Link }
                    to="/items/new"
                    variant="contained"
                    startIcon={ <Plus className="w-5" aria-hidden="true" /> }
                    className="item-list__header-action-create self-start sm:self-auto"
                >
                    Tambah barang
                </Button>
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

            <div className="item-list__filter card mb-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_minmax(12rem,0.45fr)_auto] md:items-end">
                <TextField
                    className="item-list__filter-search"
                    label="Cari barang"
                    placeholder="Nama atau kode barang"
                    variant="outlined"
                    size="small"
                    type="search"
                    value={ searchQuery }
                    onChange={ event => {
                        setSearchQuery(event.target.value);
                        setCurrentPage(1);
                    } }
                />

                <TextField
                    select
                    className="item-list__filter-category"
                    label="Kategori"
                    variant="outlined"
                    size="small"
                    value={ categoryCode }
                    onChange={ event => {
                        setCategoryCode(event.target.value);
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

                <Button className="item-list__filter-clear justify-self-start" variant="text" onClick={ handleFilterClear }>
                    Reset filter
                </Button>
            </div>

            <div className="item-list__content bg-white rounded-lg shadow-lg pb-2 overflow-hidden">
                <div className="item-list__content-pagination px-4 py-3 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <h2 className="item-list__content-pagination-title font-semibold">
                            { showTableLoading || listError
                                ? 'Daftar barang aktif'
                                : `${ totalElements } barang aktif` }
                        </h2>
                        <p className="text-sm text-gray-600" aria-live="polite">
                            { showTableLoading
                                ? 'Stok toko dan gudang sedang dimuat dari server.'
                                : listError
                                    ? 'Gunakan Coba lagi untuk memuat daftar barang.'
                                    : totalElements
                                        ? `Menampilkan ${ firstVisibleItem }–${ lastVisibleItem } dari ${ totalElements } barang aktif`
                                        : 'Tidak ada barang aktif untuk ditampilkan' }
                        </p>
                    </div>

                    <div className="item-list__content-pagination-inputs flex flex-wrap gap-2 items-center">
                        <TextField
                            select
                            label="Data per halaman"
                            value={ itemPerPage }
                            onChange={ event => {
                                setItemPerPage(Number(event.target.value));
                                setCurrentPage(1);
                            } }
                            size="small"
                            className="w-36"
                        >
                            { ITEM_PER_PAGE_OPTIONS.map(option => (
                                <MenuItem key={ option } value={ option }>{ option }</MenuItem>
                            )) }
                        </TextField>
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                            Halaman { currentPage } dari { totalPages }
                        </span>
                        <Pagination
                            page={ currentPage }
                            count={ totalPages }
                            onChange={ (_, value) => setCurrentPage(value) }
                            disabled={ showTableLoading || !hasCurrentQueryData || !itemPaging?.totalPages }
                            aria-label="Halaman barang"
                            getItemAriaLabel={ (type, page) => type === 'page'
                                ? `Ke halaman ${ page }`
                                : `${ type } halaman` }
                        />
                    </div>
                </div>

                <TableContainer
                    component={ Paper }
                    elevation={ 0 }
                    className="item-list__content-table !overflow-x-hidden"
                >
                    <Table
                        className="!block lg:!table lg:!table-fixed"
                        aria-label="Daftar barang aktif dan stok per lokasi"
                    >
                        <caption className="sr-only">
                            Barang aktif, aturan jumlah, harga jual, stok STORE dan WAREHOUSE, pembaruan, serta tindakan.
                        </caption>
                        <TableHead className="item-list__content-table-header bg-gray-100 hidden lg:!table-header-group">
                            <TableRow className="text-xs font-semibold tracking-wider">
                                <TableCell className="lg:!w-[30%]">Barang</TableCell>
                                <TableCell className="lg:!w-[23%]">Stok per lokasi</TableCell>
                                <TableCell className="lg:!w-[15%]">Harga jual</TableCell>
                                <TableCell className="lg:!w-[15%]">Data barang diperbarui</TableCell>
                                <TableCell className="lg:!w-[11.5rem]" align="right">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="!block lg:!table-row-group">
                            { showTableLoading ? (
                                <TableRow className="!block lg:!table-row">
                                    <TableCell colSpan="5" className="!block lg:!table-cell !border-b-0 !text-center italic !text-gray-500">
                                        <span className="inline-flex items-center gap-2" role="status">
                                            <CircularProgress size={ 18 } /> Memuat barang...
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ) : listError ? (
                                <TableRow className="!block lg:!table-row">
                                    <TableCell colSpan="5" className="!block lg:!table-cell !border-b-0 !text-center !text-gray-500">
                                        Data barang belum dapat ditampilkan.
                                    </TableCell>
                                </TableRow>
                            ) : hasCurrentQueryData && itemList?.length ? itemList.map((item, index) => {
                                const isLastRow = index === itemList.length - 1;
                                const rowBorderClass = isLastRow ? '' : 'border-b border-gray-200';
                                const tableCellClass = isLastRow ? '!border-b-0' : '';
                                const unitLabel = formatUnitOfMeasure(item.baseUnitOfMeasure);

                                return (
                                    <TableRow
                                        key={ item.sku }
                                        className={ `item-list__content-table-row !grid grid-cols-1 gap-y-4 px-4 py-4 sm:grid-cols-2 sm:gap-x-5 lg:!table-row lg:p-0 ${ rowBorderClass } lg:border-b-0` }
                                    >
                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 sm:col-span-2 lg:!table-cell lg:!border-b lg:!p-4` }>
                                            <button
                                                type="button"
                                                className="text-left text-base font-semibold text-primary-main hover:underline focus-visible:rounded-sm"
                                                onClick={ () => openItemDetail(item.sku) }
                                            >
                                                { item.name }
                                            </button>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                                                <span className="break-all">{ item.sku }</span>
                                                <span aria-hidden="true">•</span>
                                                <span className="break-words">{ item.category?.name || 'Tanpa kategori' }</span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-800">
                                                    { unitLabel }
                                                </span>
                                                <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-800">
                                                    { getFractionLabel(item.fractionalQuantityAllowed) }
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                            <span className="mb-2 block text-xs font-medium text-gray-600 lg:hidden">
                                                Stok per lokasi
                                            </span>
                                            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                                                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 lg:border-0 lg:bg-transparent lg:p-0">
                                                    <span className="block text-xs text-gray-600">Toko · STORE</span>
                                                    <strong className="mt-1 block text-right font-semibold tabular-nums lg:text-left">
                                                        { formatQuantity(item.stockStore, item.baseUnitOfMeasure) }
                                                    </strong>
                                                </div>
                                                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 lg:border-0 lg:bg-transparent lg:p-0">
                                                    <span className="block text-xs text-gray-600">Gudang · WAREHOUSE</span>
                                                    <strong className="mt-1 block text-right font-semibold tabular-nums lg:text-left">
                                                        { formatQuantity(item.stockWarehouse, item.baseUnitOfMeasure) }
                                                    </strong>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 lg:hidden">Harga jual</span>
                                            <strong className="mt-1 block font-semibold tabular-nums lg:mt-0">
                                                { formatRupiah(item.price) }
                                            </strong>
                                            <span className="mt-1 block text-xs text-gray-600">per { unitLabel }</span>
                                        </TableCell>

                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 lg:!table-cell lg:!border-b lg:!p-4` }>
                                            <span className="block text-xs font-medium text-gray-600 lg:hidden">
                                                Data barang diperbarui
                                            </span>
                                            <strong className="mt-1 block font-medium break-words lg:mt-0">
                                                { getUpdatedByLabel(item.updatedBy) }
                                            </strong>
                                            <span className="mt-1 block text-xs text-gray-600">
                                                { getUpdatedAtLabel(item.updatedAt) }
                                            </span>
                                        </TableCell>

                                        <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 sm:col-span-2 lg:!table-cell lg:!border-b lg:!p-4` }>
                                            <span className="mb-1 block text-xs font-medium text-gray-600 lg:hidden">Aksi</span>
                                            <div className="flex items-center justify-start gap-0 lg:justify-end">
                                                <Tooltip title="Riwayat stok" arrow>
                                                    <IconButton
                                                        component={ Link }
                                                        to={ `/stock-movements?itemSku=${ encodeURIComponent(item.sku) }` }
                                                        aria-label={ `Riwayat stok ${ item.name }` }
                                                        sx={ {
                                                            width: 44,
                                                            height: 44
                                                        } }
                                                    >
                                                        <HistoryIcon className="text-blue-500" size={ 19 } aria-hidden="true" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Cetak barcode" arrow>
                                                    <IconButton
                                                        aria-label={ `Cetak barcode ${ item.name }` }
                                                        onClick={ () => setSelectedBarcodeItem(item) }
                                                        sx={ {
                                                            width: 44,
                                                            height: 44
                                                        } }
                                                    >
                                                        <BarcodeIcon className="text-gray-700" size={ 19 } aria-hidden="true" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Ubah barang" arrow>
                                                    <IconButton
                                                        component={ Link }
                                                        to={ `/items/${ item.sku }/edit` }
                                                        aria-label={ `Ubah barang ${ item.name }` }
                                                        sx={ {
                                                            width: 44,
                                                            height: 44
                                                        } }
                                                    >
                                                        <PencilIcon className="text-gray-500" size={ 19 } aria-hidden="true" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Nonaktifkan barang" arrow>
                                                    <IconButton
                                                        color="error"
                                                        aria-label={ `Nonaktifkan barang ${ item.name }` }
                                                        onClick={ event => openDeactivateConfirmation(
                                                            item,
                                                            event.currentTarget
                                                        ) }
                                                        sx={ {
                                                            width: 44,
                                                            height: 44
                                                        } }
                                                    >
                                                        <CircleOff size={ 19 } aria-hidden="true" />
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow className="!block lg:!table-row">
                                    <TableCell colSpan="5" className="!block lg:!table-cell !border-b-0 !text-center italic !text-gray-500">
                                        <div className="py-6">
                                            <div className="font-semibold not-italic text-gray-700">
                                                { hasFilters ? 'Barang tidak ditemukan' : 'Belum ada barang aktif' }
                                            </div>
                                            <div className="mt-1 mb-3">
                                                { hasFilters
                                                    ? 'Ubah kata pencarian atau reset filter untuk mencoba lagi.'
                                                    : 'Tambah barang agar stok dapat dicatat per lokasi.' }
                                            </div>
                                            { hasFilters ? (
                                                <Button onClick={ handleFilterClear }>Reset filter</Button>
                                            ) : (
                                                <Button component={ Link } to="/items/new" variant="contained">Tambah barang</Button>
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
