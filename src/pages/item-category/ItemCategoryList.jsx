import {
    useEffect,
    useRef,
    useState
} from 'react';
import {
    Link,
    useSearchParams
} from "react-router-dom";
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
    Tooltip,
} from '@mui/material';
import {
    CircleOff,
    PencilIcon,
    Plus,
    Printer
} from "lucide-react";
import { enqueueSnackbar } from "notistack"

import itemApi from "@api/item.js";
import BloomConfirmationModal from "@components/_ui/BloomConfirmationModal.jsx";
import ItemBulkBarcodeDialog, {
    MAX_BARCODE_LABELS
} from "@components/item/ItemBulkBarcodeDialog.jsx";
import { ITEM_CATEGORY_LIST_MESSAGES } from "@constants/item-category.jsx"
import {
    useBreadcrumbStore,
    useItemCategoryStore
} from "@stores/index.js";
import { formatDate } from "@utils/date-utils.js";

const FILTER_KEY_DATA = {
    code: 'Kode',
    name: 'Nama'
};
const ITEM_PER_PAGE_OPTIONS = [5, 10, 25, 50];

const getUpdatedByLabel = updatedBy => updatedBy?.trim() || 'Belum tersedia';
const getUpdatedAtLabel = updatedAt => updatedAt
    ? formatDate(updatedAt)
    : 'Belum diperbarui';

const getSearchState = searchParams => {
    const requestedFilterKey = searchParams.get('key');
    const requestedSize = Number(searchParams.get('itemPerPage'));

    return {
        filters: searchParams.get('q') || '',
        selectedFilterKey: Object.hasOwn(FILTER_KEY_DATA, requestedFilterKey)
            ? requestedFilterKey
            : 'code',
        currentPage: Math.max(Number(searchParams.get('page')) || 1, 1),
        itemPerPage: ITEM_PER_PAGE_OPTIONS.includes(requestedSize) ? requestedSize : 10
    };
};

const getListQueryKey = ({ currentPage, itemPerPage, selectedFilterKey, filters }) => JSON.stringify({
    currentPage,
    itemPerPage,
    selectedFilterKey,
    filters
});

export default function ItemCategoryList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const {
        itemCategoryList,
        itemCategoryPaging,
        getItemCategoryList,
        deactivateItemCategory,
        getItemCategoriesItemCount
    } = useItemCategoryStore();

    const [searchParams, setSearchParams] = useSearchParams();
    const initialSearchState = getSearchState(searchParams);

    const [selectedDeleteTarget, setSelectedDeleteTarget] = useState({});
    const [filters, setFilters] = useState(initialSearchState.filters);
    const [debouncedFilters, setDebouncedFilters] = useState(initialSearchState.filters);
    const [selectedFilterKey, setSelectedFilterKey] = useState(initialSearchState.selectedFilterKey);
    const [currentPage, setCurrentPage] = useState(initialSearchState.currentPage);
    const [itemPerPage, setItemPerPage] = useState(initialSearchState.itemPerPage);
    const [refreshVersion, setRefreshVersion] = useState(0);
    const [loadedQueryKey, setLoadedQueryKey] = useState('');
    const [isLoadingTable, setLoadingTable] = useState(true);
    const [isLoadingItemCount, setIsLoadingItemCount] = useState('');
    const [itemCount, setItemCount] = useState(null);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [listError, setListError] = useState('');
    const [itemCountError, setItemCountError] = useState({});
    const [deactivationError, setDeactivationError] = useState('');
    const [barcodeCategoryTarget, setBarcodeCategoryTarget] = useState({});
    const [barcodeItems, setBarcodeItems] = useState([]);
    const [barcodeLoading, setBarcodeLoading] = useState(false);
    const [barcodeLoadError, setBarcodeLoadError] = useState('');
    const [messageAlertData, setMessageAlertData] = useState(() => ({
        show: searchParams.has('message'),
        message: searchParams.get('message'),
        type: searchParams.get('messageType') || 'info'
    }));
    const deactivationInProgressRef = useRef(false);
    const deactivationTriggerRef = useRef(null);
    const focusAfterRefreshRef = useRef(false);
    const isMountedRef = useRef(false);
    const itemCountAlertRef = useRef(null);
    const itemCountRequestRef = useRef(null);
    const barcodeRequestRef = useRef(null);
    const barcodeTriggerRef = useRef(null);
    const listHeadingRef = useRef(null);
    const messageAlertRef = useRef(null);
    const searchParamKey = searchParams.toString();
    const requestQueryKey = getListQueryKey({
        currentPage,
        itemPerPage,
        selectedFilterKey,
        filters: debouncedFilters
    });
    const visibleQueryKey = getListQueryKey({
        currentPage,
        itemPerPage,
        selectedFilterKey,
        filters
    });
    const hasCurrentQueryData = loadedQueryKey === visibleQueryKey;
    const showTableLoading = isLoadingTable || (!listError && !hasCurrentQueryData);
    const listDataUnavailable = Boolean(
        listError && (!hasCurrentQueryData || !itemCategoryList?.length)
    );
    const totalElements = hasCurrentQueryData
        ? Number(itemCategoryPaging?.totalElements) || 0
        : 0;
    const totalPages = Math.max(itemCategoryPaging?.totalPages || 1, 1);
    const firstVisibleItem = totalElements
        ? ((currentPage - 1) * itemPerPage) + 1
        : 0;
    const lastVisibleItem = totalElements
        ? Math.min(firstVisibleItem + itemCategoryList.length - 1, totalElements)
        : 0;

    const handleFilterKeyChange = e => {
        setSelectedFilterKey(e.target.value);
        setFilters('');
        setDebouncedFilters('');
        setCurrentPage(1);
    }
    const handleFilterChange = e => {
        setFilters(e.target.value);
    }
    const handleFilterClear = () => {
        setFilters('')
        setDebouncedFilters('');
        setSelectedFilterKey('code');
        setCurrentPage(1);
    }

    const handleItemPerPageChange = (e) => {
        setItemPerPage(e.target.value)
        setCurrentPage(1)
    };

    const handlePageChange = (e, value) => {
        setCurrentPage(value);
    }

    const loadCategoryBarcodeItems = async (itemCategory, trigger) => {
        barcodeRequestRef.current?.abort();

        const controller = new AbortController();
        barcodeRequestRef.current = controller;
        barcodeTriggerRef.current = trigger || barcodeTriggerRef.current;
        setBarcodeCategoryTarget(itemCategory);
        setBarcodeItems([]);
        setBarcodeLoadError('');
        setBarcodeLoading(true);

        try {
            const { data: response } = await itemApi.getItemList({
                signal: controller.signal,
                params: {
                    page: 1,
                    size: MAX_BARCODE_LABELS,
                    category: itemCategory.code,
                    sort: 'sku,asc'
                }
            });
            const categoryPage = response?.data;
            const totalCategoryItems = Number(categoryPage?.totalElements) || 0;
            const categoryItems = Array.isArray(categoryPage?.content)
                ? categoryPage.content
                : [];

            if (controller.signal.aborted || !isMountedRef.current) {
                return;
            }

            if (totalCategoryItems > MAX_BARCODE_LABELS) {
                setBarcodeLoadError(
                    `Kategori ${ itemCategory.name } memiliki ${ totalCategoryItems } barang aktif. `
                    + `Maksimum ${ MAX_BARCODE_LABELS } label per PDF; gunakan Data Barang untuk memilih barang.`
                );
                return;
            }

            if (!categoryItems.length) {
                setBarcodeLoadError(
                    `Kategori ${ itemCategory.name } belum memiliki barang aktif untuk dicetak.`
                );
                return;
            }

            setBarcodeItems(categoryItems);
        } catch (error) {
            if (!controller.signal.aborted && isMountedRef.current) {
                setBarcodeLoadError(
                    error?.message || 'Daftar barang kategori gagal dimuat. Silakan coba lagi.'
                );
            }
        } finally {
            if (barcodeRequestRef.current === controller) {
                barcodeRequestRef.current = null;
                if (isMountedRef.current) {
                    setBarcodeLoading(false);
                }
            }
        }
    };

    const closeCategoryBarcodeDialog = () => {
        barcodeRequestRef.current?.abort();
        barcodeRequestRef.current = null;
        setBarcodeCategoryTarget({});
        setBarcodeItems([]);
        setBarcodeLoadError('');
        setBarcodeLoading(false);

        const trigger = barcodeTriggerRef.current;
        barcodeTriggerRef.current = null;
        setTimeout(() => trigger?.isConnected && trigger.focus(), 0);
    };

    const openDeleteItemCategoryConfirmationModal = async (itemCategory, trigger) => {
        if (itemCountRequestRef.current) {
            return;
        }

        const controller = new AbortController();
        itemCountRequestRef.current = controller;
        setIsLoadingItemCount(itemCategory.code);
        setItemCount(null);
        setItemCountError({});
        setDeactivationError('');
        deactivationTriggerRef.current = trigger || deactivationTriggerRef.current;
        try {
            const { data } = await getItemCategoriesItemCount(itemCategory.code, { signal: controller.signal })
            if (!controller.signal.aborted && isMountedRef.current) {
                setItemCount(data.itemCount)
                setSelectedDeleteTarget(itemCategory)
            }
        } catch (error) {
            if (!controller.signal.aborted && isMountedRef.current) {
                setItemCountError({
                    message: error?.message || 'Jumlah barang kategori gagal dimuat. Silakan coba lagi.',
                    target: itemCategory
                })
            }
        } finally {
            if (itemCountRequestRef.current === controller) {
                itemCountRequestRef.current = null;
                if (isMountedRef.current) {
                    setIsLoadingItemCount('');
                }
            }
        }
    }

    const closeDeactivationDialog = () => {
        setSelectedDeleteTarget({});
        setItemCount(null);
        setDeactivationError('');
        setTimeout(() => deactivationTriggerRef.current?.focus(), 0);
    }

    const handleDeleteItemCategory = async () => {
        if (deactivationInProgressRef.current) {
            return;
        }

        deactivationInProgressRef.current = true;
        setIsDeactivating(true);
        setDeactivationError('');
        try {
            await deactivateItemCategory(selectedDeleteTarget.code)
            if (!isMountedRef.current) {
                return;
            }
            enqueueSnackbar(
                ITEM_CATEGORY_LIST_MESSAGES.deactivateItemCategorySuccess.message(selectedDeleteTarget.name),
                ITEM_CATEGORY_LIST_MESSAGES.deactivateItemCategorySuccess.options
            )
            setSelectedDeleteTarget({});
            setItemCount(null);
            focusAfterRefreshRef.current = true;
            const targetPage = itemCategoryList.length === 1 && currentPage > 1
                ? currentPage - 1
                : currentPage;
            if (targetPage === currentPage) {
                setRefreshVersion(previous => previous + 1);
            } else {
                setCurrentPage(targetPage)
            }
        } catch (error) {
            if (isMountedRef.current) {
                setDeactivationError(error?.category === 'not_found'
                    ? 'Kategori ini tidak lagi tersedia. Tutup dialog lalu muat ulang daftar.'
                    : error?.message || 'Kategori gagal dinonaktifkan. Silakan coba lagi.')
            }
        } finally {
            deactivationInProgressRef.current = false;
            if (isMountedRef.current) {
                setIsDeactivating(false);
            }
        }
    }

    useEffect(() => {
        const urlState = getSearchState(searchParams);
        setFilters(previous => previous === urlState.filters ? previous : urlState.filters);
        setDebouncedFilters(previous => previous === urlState.filters ? previous : urlState.filters);
        setSelectedFilterKey(previous => (
            previous === urlState.selectedFilterKey ? previous : urlState.selectedFilterKey
        ));
        setCurrentPage(previous => previous === urlState.currentPage ? previous : urlState.currentPage);
        setItemPerPage(previous => previous === urlState.itemPerPage ? previous : urlState.itemPerPage);
    }, [searchParamKey]);

    useEffect(() => {
        if (filters === debouncedFilters) {
            return;
        }

        const timeoutId = setTimeout(() => {
            setDebouncedFilters(filters);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [filters, debouncedFilters]);

    useEffect(() => {
        const controller = new AbortController();
        setLoadingTable(true);
        setListError('');
        setSearchParams({
            page: currentPage,
            itemPerPage,
            q: debouncedFilters,
            key: selectedFilterKey
        }, { replace: true });

        const loadItemCategories = async () => {
            try {
                await getItemCategoryList({
                    signal: controller.signal,
                    params: {
                        page: currentPage,
                        size: itemPerPage,
                        [selectedFilterKey]: debouncedFilters
                    }
                })
                if (!controller.signal.aborted) {
                    setLoadedQueryKey(requestQueryKey);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setListError(error?.message || 'Daftar kategori gagal dimuat. Silakan coba lagi.')
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingTable(false);
                    if (focusAfterRefreshRef.current) {
                        focusAfterRefreshRef.current = false;
                        setTimeout(() => listHeadingRef.current?.focus(), 0);
                    }
                }
            }
        };

        loadItemCategories();
        return () => controller.abort();
    }, [itemPerPage, currentPage, selectedFilterKey, debouncedFilters, refreshVersion]);

    useEffect(() => {
        const activeItemCountRequest = itemCountRequestRef.current;
        if (activeItemCountRequest) {
            activeItemCountRequest.abort();
            itemCountRequestRef.current = null;
        }

        setIsLoadingItemCount('');
        setItemCountError({});
        barcodeRequestRef.current?.abort();
        barcodeRequestRef.current = null;
        setBarcodeCategoryTarget({});
        setBarcodeItems([]);
        setBarcodeLoadError('');
        setBarcodeLoading(false);
        barcodeTriggerRef.current = null;
        if (!deactivationInProgressRef.current) {
            setItemCount(null);
            setSelectedDeleteTarget({});
            deactivationTriggerRef.current = null;
        }
    }, [visibleQueryKey]);

    useEffect(() => {
        isMountedRef.current = true;
        setBreadcrumbs(['Kategori Barang'])
        return () => {
            isMountedRef.current = false;
            itemCountRequestRef.current?.abort();
            barcodeRequestRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (itemCountError.message) {
            itemCountAlertRef.current?.focus();
        }
    }, [itemCountError.message]);

    useEffect(() => {
        if (messageAlertData.show) {
            messageAlertRef.current?.focus();
        }
    }, [messageAlertData.show]);

    return (
        <div className="item-category-list">
            <ItemBulkBarcodeDialog
                open={ Boolean(barcodeCategoryTarget.code) }
                allowCopies={ false }
                contextLabel={ barcodeCategoryTarget.code
                    ? `${ barcodeCategoryTarget.name } · ${ barcodeCategoryTarget.code }`
                    : '' }
                items={ barcodeItems }
                loading={ barcodeLoading }
                loadError={ barcodeLoadError }
                onClose={ closeCategoryBarcodeDialog }
                onRetry={ () => loadCategoryBarcodeItems(barcodeCategoryTarget) }
            />

            {
                selectedDeleteTarget?.code && (
                    <BloomConfirmationModal
                        onCancel={ closeDeactivationDialog }
                        onConfirm={ handleDeleteItemCategory }
                        title={ `Nonaktifkan ${ selectedDeleteTarget.name }?` }
                        confirmButtonText={ isDeactivating ? 'Menonaktifkan...' : 'Nonaktifkan' }
                        confirmButtonColor="error"
                        isPending={ isDeactivating }
                        focusCancel
                    >
                        <div className="item-category-list__delete">
                            <div className="item-category-list__delete-description">
                                Kategori
                                <span className="font-bold"> { selectedDeleteTarget.name } </span>
                                akan dinonaktifkan dan tidak lagi muncul di daftar aktif.
                            </div>

                            { itemCount > 0 &&
                                <div className="item-category-list__delete-description">
                                    Tindakan ini juga menonaktifkan
                                    <span className="font-bold"> { itemCount } barang </span>
                                    aktif yang terikat pada kategori ini.
                                </div>
                            }
                            <div className="mt-2">
                                Data tidak dihapus, tetapi tidak dapat diaktifkan kembali dari aplikasi saat ini.
                            </div>
                            { deactivationError && (
                                <Alert
                                    severity="error"
                                    className="mt-3"
                                >
                                    { deactivationError }
                                </Alert>
                            ) }
                            { isDeactivating && (
                                <div
                                    className="mt-3 flex items-center gap-2"
                                    role="status"
                                >
                                    <CircularProgress size={ 18 } />
                                    Menonaktifkan kategori...
                                </div>
                            ) }
                        </div>
                    </BloomConfirmationModal>
                )
            }

            { messageAlertData.show && (
                <Alert
                    ref={ messageAlertRef }
                    className="item-category-list__alert mb-4"
                    variant="filled"
                    severity={ messageAlertData.type }
                    tabIndex={ -1 }
                    onClose={ () => setMessageAlertData({}) }
                >
                    { messageAlertData.message }
                </Alert>
            ) }

            { listError && (
                <Alert
                    className="item-category-list__alert mb-4"
                    severity="error"
                    action={
                        <Button
                            color="inherit"
                            onClick={ () => setRefreshVersion(previous => previous + 1) }
                        >
                            Coba lagi
                        </Button>
                    }
                >
                    { listError }
                </Alert>
            ) }

            { itemCountError.message && (
                <Alert
                    ref={ itemCountAlertRef }
                    className="item-category-list__alert mb-4"
                    severity="error"
                    tabIndex={ -1 }
                    action={
                        <Button
                            color="inherit"
                            onClick={ () => openDeleteItemCategoryConfirmationModal(
                                itemCountError.target,
                                deactivationTriggerRef.current
                            ) }
                        >
                            Coba lagi hitung jumlah
                        </Button>
                    }
                >
                    { itemCountError.message }
                </Alert>
            ) }

            <div className="item-category-list__header mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2
                        ref={ listHeadingRef }
                        className="item-category-list__header-title font-bold text-2xl"
                        tabIndex={ -1 }
                    >
                        Kategori Barang
                    </h2>
                    <p className="mt-1 text-gray-600">
                        Kelompokkan barang agar pencarian dan pemeliharaan data tetap teratur.
                    </p>
                </div>

                <div className="item-category-list__header-action">
                    <Link
                        to="/item-categories/new"
                        className="item-category-list__header-action-create"
                    >
                        <Button
                            variant="contained"
                            endIcon={ <Plus className="w-5"/> }>
                            Buat baru
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="
                item-category-list__filter
                card
                mb-4
                flex
                flex-wrap
                items-center
                gap-2"
            >
                <TextField
                    select
                    className="item-category-list__filter-key min-w-40"
                    label="Filter berdasarkan"
                    variant="outlined"
                    size="small"
                    value={ selectedFilterKey }
                    onChange={ handleFilterKeyChange }
                >
                    { Object.keys(FILTER_KEY_DATA).map(filterKey => (
                        <MenuItem key={ filterKey } value={ filterKey }>
                            { FILTER_KEY_DATA[filterKey] }
                        </MenuItem>
                    )) }
                </TextField>

                <TextField
                    className="item-category-list__filter-value flex-1 min-w-60"
                    label={ `Cari berdasarkan ${ FILTER_KEY_DATA[selectedFilterKey] }` }
                    variant="outlined"
                    size="small"
                    value={ filters }
                    onChange={ handleFilterChange }
                />

                <Button
                    className="item-category-list__filter-clear"
                    variant="text"
                    onClick={ handleFilterClear }
                >
                    Hapus filter
                </Button>
            </div>

            <div className="item-category-list__content il-content bg-white rounded-lg shadow-lg pb-2 overflow-hidden">
                <div className="il-content__pagination px-4 py-3 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <h3 className="il-content__pagination-title font-semibold">
                            { showTableLoading || listDataUnavailable
                                ? 'Daftar kategori barang'
                                : `${ totalElements } kategori aktif` }
                        </h3>
                        <p className="text-sm text-gray-600" aria-live="polite">
                            { showTableLoading
                                ? 'Daftar aktif sedang dimuat dari server.'
                                : listDataUnavailable
                                    ? 'Gunakan Coba lagi untuk memuat daftar kategori.'
                                    : totalElements
                                        ? `Menampilkan ${ firstVisibleItem }–${ lastVisibleItem } dari ${ totalElements } kategori aktif`
                                        : 'Tidak ada kategori aktif untuk ditampilkan' }
                        </p>
                    </div>

                    <div className="il-content__pagination-inputs flex flex-wrap gap-2 items-center">
                        <TextField
                            select
                            label="Data per halaman"
                            value={ itemPerPage }
                            onChange={ handleItemPerPageChange }
                            size="small"
                            className="w-36"
                        >
                            { ITEM_PER_PAGE_OPTIONS.map(option => (
                                <MenuItem key={ option } value={ option }>
                                    { option }
                                </MenuItem>
                            )) }
                        </TextField>
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                            Halaman { currentPage } dari { totalPages }
                        </span>
                        <Pagination
                            page={ currentPage }
                            count={ totalPages }
                            onChange={ handlePageChange }
                            disabled={ showTableLoading
                                || !hasCurrentQueryData
                                || !itemCategoryPaging?.totalPages }
                            aria-label="Halaman kategori barang"
                            getItemAriaLabel={ (type, page) => type === 'page'
                                ? `Ke halaman ${ page }`
                                : `${ type } halaman` }
                        />
                    </div>
                </div>

                <TableContainer
                    component={ Paper }
                    elevation={ 0 }
                    className="il-content__table !overflow-x-hidden"
                >
                    <Table
                        aria-label="Daftar kategori barang aktif"
                        className="!block md:!table"
                    >
                        <caption className="sr-only">
                            Kategori aktif beserta informasi pembaruan dan tindakan pemeliharaan.
                        </caption>
                        <TableHead className="il-content__table-header bg-gray-100 hidden md:!table-header-group">
                            <TableRow className="text-xs font-semibold tracking-wider">
                                <TableCell>Kategori</TableCell>
                                <TableCell>Diperbarui oleh</TableCell>
                                <TableCell>Diperbarui pada</TableCell>
                                <TableCell align="right">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="!block md:!table-row-group">
                            { showTableLoading
                                ? (
                                    <TableRow className="!block md:!table-row">
                                        <TableCell
                                            colSpan="4"
                                            className="!block md:!table-cell !border-b-0 !text-center italic !text-gray-500"
                                        >
                                            <span
                                                className="inline-flex items-center gap-2"
                                                role="status"
                                            >
                                                <CircularProgress size={ 18 } />
                                                Memuat kategori...
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )
                                : listDataUnavailable
                                    ? (
                                        <TableRow className="!block md:!table-row">
                                            <TableCell
                                                colSpan="4"
                                                className="!block md:!table-cell !border-b-0 !text-center !text-gray-500"
                                            >
                                                Data kategori belum dapat ditampilkan.
                                            </TableCell>
                                        </TableRow>
                                    )
                                : hasCurrentQueryData && itemCategoryList?.length
                                    ? itemCategoryList?.map(((itemCategory, index) => {
                                        const isLastRow = index === itemCategoryList.length - 1
                                        const tableCellClass = isLastRow ? '!border-b-0' : ''
                                        return (
                                            <TableRow
                                                key={ itemCategory.code }
                                                className="il-content__table-row !grid grid-cols-1 gap-y-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)] sm:gap-x-4 md:!table-row md:p-0"
                                            >
                                                <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 sm:row-span-2 md:!table-cell md:!border-b md:!p-4` }>
                                                    <strong className="block text-base font-semibold break-words">
                                                        { itemCategory.name }
                                                    </strong>
                                                    <span className="mt-1 block text-sm text-gray-600 break-all">
                                                        Kode: { itemCategory.code }
                                                    </span>
                                                    { itemCategory.description && (
                                                        <span className="mt-2 block text-sm text-gray-600 break-words">
                                                            { itemCategory.description }
                                                        </span>
                                                    ) }
                                                </TableCell>

                                                <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 md:!table-cell md:!border-b md:!p-4` }>
                                                    <span className="block text-xs font-medium text-gray-600 md:hidden">
                                                        Diperbarui oleh
                                                    </span>
                                                    <span className="mt-0.5 block font-medium break-words">
                                                        { getUpdatedByLabel(itemCategory.updatedBy) }
                                                    </span>
                                                </TableCell>

                                                <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 md:!table-cell md:!border-b md:!p-4 md:whitespace-nowrap` }>
                                                    <span className="block text-xs font-medium text-gray-600 md:hidden">
                                                        Diperbarui pada
                                                    </span>
                                                    <span className="mt-0.5 block font-medium">
                                                        { getUpdatedAtLabel(itemCategory.updatedAt) }
                                                    </span>
                                                </TableCell>

                                                <TableCell
                                                    className={ `${ tableCellClass } il-content__table-row-action table-action !block !border-b-0 !p-0 sm:col-span-2 md:!table-cell md:!border-b md:!p-4` }>
                                                    <div
                                                        className="table-action__content flex justify-start md:justify-end items-center gap-1"
                                                    >
                                                        <Tooltip title="Cetak barcode kategori" arrow>
                                                            <span>
                                                                <IconButton
                                                                    aria-label={ `Cetak barcode kategori ${ itemCategory.name }` }
                                                                    disabled={ barcodeLoading }
                                                                    sx={ {
                                                                        width: 44,
                                                                        height: 44
                                                                    } }
                                                                    onClick={ event => loadCategoryBarcodeItems(
                                                                        itemCategory,
                                                                        event.currentTarget
                                                                    ) }
                                                                >
                                                                    { barcodeLoading
                                                                        && barcodeCategoryTarget.code === itemCategory.code
                                                                        ? <CircularProgress size={ 18 } />
                                                                        : <Printer aria-hidden="true" size={ 18 } /> }
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>

                                                        <Tooltip title="Ubah kategori" arrow>
                                                            <IconButton
                                                                component={ Link }
                                                                to={ `/item-categories/${ itemCategory.code }/edit` }
                                                                className="table-action__edit"
                                                                aria-label={ `Ubah kategori ${ itemCategory.name }` }
                                                                sx={ {
                                                                    width: 44,
                                                                    height: 44
                                                                } }
                                                            >
                                                                <PencilIcon aria-hidden="true" size={ 18 } />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Nonaktifkan kategori" arrow>
                                                            <span>
                                                                <IconButton
                                                                    color="error"
                                                                    aria-label={ `Nonaktifkan kategori ${ itemCategory.name }` }
                                                                    disabled={ Boolean(isLoadingItemCount) }
                                                                    sx={ {
                                                                        width: 44,
                                                                        height: 44
                                                                    } }
                                                                    onClick={ event => openDeleteItemCategoryConfirmationModal(
                                                                        itemCategory,
                                                                        event.currentTarget
                                                                    ) }
                                                                >
                                                                    { isLoadingItemCount === itemCategory.code
                                                                        ? <CircularProgress size={ 18 } />
                                                                        : <CircleOff
                                                                            aria-hidden="true"
                                                                            className="table-action__delete"
                                                                            size={ 18 }
                                                                        /> }
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }))
                                    : (
                                        <TableRow className="!block md:!table-row">
                                            <TableCell
                                                className="!block md:!table-cell !border-b-0 !text-center italic !text-gray-500"
                                                colSpan="4"
                                            >
                                                <div className="py-6">
                                                    <div className="font-semibold not-italic text-gray-700">
                                                        { filters ? 'Kategori tidak ditemukan' : 'Belum ada kategori aktif' }
                                                    </div>
                                                    <div className="mt-1 mb-3">
                                                        { filters
                                                            ? 'Ubah atau hapus filter untuk mencoba lagi.'
                                                            : 'Buat kategori agar barang dapat dikelompokkan.' }
                                                    </div>
                                                    { filters ? (
                                                        <Button onClick={ handleFilterClear }>Hapus filter</Button>
                                                    ) : (
                                                        <Button
                                                            component={ Link }
                                                            to="/item-categories/new"
                                                            variant="contained"
                                                        >
                                                            Buat kategori
                                                        </Button>
                                                    ) }
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
}
