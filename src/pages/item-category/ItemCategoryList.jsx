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
} from '@mui/material';
import {
    PencilIcon,
    Plus,
    TrashIcon
} from "lucide-react";
import { enqueueSnackbar } from "notistack"

import BloomConfirmationModal from "@components/_ui/BloomConfirmationModal.jsx";
import { ITEM_CATEGORY_LIST_MESSAGES } from "@constants/item-category.jsx"
import {
    useBreadcrumbStore,
    useItemCategoryStore
} from "@stores/index.js";
import { formatDate } from "@utils/date-utils.js";

export default function ItemCategoryList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const {
        itemCategoryList,
        itemCategoryPaging,
        itemCategoriesItemCount,
        getItemCategoryList,
        deactivateItemCategory,
        getItemCategoriesItemCount
    } = useItemCategoryStore();

    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedDeleteTarget, setSelectedDeleteTarget] = useState({});
    const [filters, setFilters] = useState('');
    const [selectedFilterKey, setSelectedFilterKey] = useState('code');
    const filterKeyData = {
        "code": "Kode",
        "name": "Nama"
    }
    const [currentPage, setCurrentPage] = useState(1);
    const [itemPerPage, setItemPerPage] = useState(10);
    const itemPerPageOptions = [5, 10, 25, 50]
    const [isLoadingTable, setLoadingTable] = useState(true);
    const [isLoadingItemCount, setIsLoadingItemCount] = useState('');
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [listError, setListError] = useState('');
    const [deactivationError, setDeactivationError] = useState('');
    const [messageAlertData, setMessageAlertData] = useState({});
    const deactivationInProgressRef = useRef(false);
    const deactivationTriggerRef = useRef(null);
    const listHeadingRef = useRef(null);

    const handleFilterKeyChange = e => {
        setSelectedFilterKey(e.target.value);
        setCurrentPage(1);
    }
    const handleFilterChange = e => {
        setFilters(e.target.value);
        setCurrentPage(1);
    }
    const handleFilterClear = () => {
        setFilters('')
        setSelectedFilterKey('code');
    }

    const filterItemCategoryList = async (page = currentPage, signal) => {
        setLoadingTable(true);
        setListError('');
        const payload = {
            signal,
            params: {
                page,
                size: itemPerPage,
                [selectedFilterKey]: filters
            }
        }

        try {
            await getItemCategoryList(payload)
        } catch (error) {
            if (!signal?.aborted) {
                setListError(error?.message || 'Daftar kategori gagal dimuat. Silakan coba lagi.')
            }
        } finally {
            if (!signal?.aborted) {
                setLoadingTable(false);
            }
        }
    }

    const handleItemPerPageChange = (e) => {
        setItemPerPage(e.target.value)
        setCurrentPage(1)
    };

    const handlePageChange = (e, value) => {
        setCurrentPage(value);
    }

    const openDeleteItemCategoryConfirmationModal = async (itemCategory, trigger) => {
        if (isLoadingItemCount) {
            return;
        }

        setIsLoadingItemCount(itemCategory.code);
        setDeactivationError('');
        deactivationTriggerRef.current = trigger;
        try {
            await getItemCategoriesItemCount(itemCategory.code)
            setSelectedDeleteTarget(itemCategory)
        } catch (error) {
            setListError(error?.message || 'Jumlah barang kategori gagal dimuat. Silakan coba lagi.')
        } finally {
            setIsLoadingItemCount('');
        }
    }

    const closeDeactivationDialog = () => {
        setSelectedDeleteTarget({});
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
            enqueueSnackbar(
                ITEM_CATEGORY_LIST_MESSAGES.deactivateItemCategorySuccess.message(selectedDeleteTarget.name),
                ITEM_CATEGORY_LIST_MESSAGES.deactivateItemCategorySuccess.options
            )
            setSelectedDeleteTarget({});
            if (currentPage === 1) {
                await filterItemCategoryList(1)
            } else {
                setCurrentPage(1)
            }
            setTimeout(() => listHeadingRef.current?.focus(), 0);
        } catch (error) {
            setDeactivationError(error?.category === 'not_found'
                ? 'Kategori ini tidak lagi tersedia. Tutup dialog lalu muat ulang daftar.'
                : error?.message || 'Kategori gagal dinonaktifkan. Silakan coba lagi.')
        } finally {
            deactivationInProgressRef.current = false;
            setIsDeactivating(false);
        }
    }

    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            setSearchParams({
                page: currentPage,
                itemPerPage,
                q: filters,
                key: selectedFilterKey
            })
            filterItemCategoryList(currentPage, controller.signal)
        }, 500);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [itemPerPage, filters, currentPage, selectedFilterKey]);

    useEffect(() => {
        setFilters('');
    }, [selectedFilterKey]);

    useEffect(() => {
        setBreadcrumbs(['Kategori Barang'])

        setMessageAlertData({
            show: searchParams.has('message'),
            message: searchParams.get('message'),
            type: searchParams.get('messageType') || 'info'
        })
        const filterQueryParameterList = ['q', 'key', 'page', 'itemPerPage']
        if (filterQueryParameterList.some(key => searchParams.has(key))) {
            setSelectedFilterKey(searchParams.get('key') || 'code');
            setFilters(searchParams.get('q') || '');
            setItemPerPage(Number(searchParams.get('itemPerPage')) || 10)
            setCurrentPage(Number(searchParams.get('page')) || 1)
        }
    }, []);

    return (
        <div className="item-category-list">
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

                            { !!itemCategoriesItemCount?.itemCount &&
                                <div className="item-category-list__delete-description">
                                    Tindakan ini juga menonaktifkan
                                    <span className="font-bold"> { itemCategoriesItemCount?.itemCount } barang </span>
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
                    className="item-category-list__alert mb-4"
                    variant="filled"
                    severity={ messageAlertData.type }
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
                            onClick={ () => filterItemCategoryList() }
                        >
                            Coba lagi
                        </Button>
                    }
                >
                    { listError }
                </Alert>
            ) }

            <div className="item-category-list__header mb-4 flex justify-between items-center">
                <h2
                    ref={ listHeadingRef }
                    className="item-category-list__header-title font-bold text-2xl"
                    tabIndex={ -1 }
                >
                    Kategori Barang
                </h2>

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
                    { Object.keys(filterKeyData).map(filterKey => (
                        <MenuItem key={ filterKey } value={ filterKey }>
                            { filterKeyData[filterKey] }
                        </MenuItem>
                    )) }
                </TextField>

                <TextField
                    className="item-category-list__filter-value flex-1 min-w-60"
                    label={ `Cari berdasarkan ${ filterKeyData[selectedFilterKey] }` }
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

            <div className="item-category-list__content il-content bg-white rounded-lg shadow-lg pb-2">
                <div className="il-content__pagination px-4 py-2 flex justify-between items-center">
                    <h3 className="il-content__pagination-title text-xl font-bold">Daftar kategori barang</h3>

                    <div className="il-content__pagination-inputs flex gap-2 items-center">
                        <span className="text-sm text-gray-700">Data per halaman:</span>
                        <TextField
                            select
                            value={ itemPerPage }
                            onChange={ handleItemPerPageChange }
                            size="small"
                            className="w-20 mr-2"
                        >
                            { itemPerPageOptions.map(option => (
                                <MenuItem key={ option } value={ option }>
                                    { option }
                                </MenuItem>
                            )) }
                        </TextField>
                        <Pagination
                            page={ currentPage }
                            count={ Math.max(itemCategoryPaging?.totalPages || 1, 1) }
                            onChange={ handlePageChange }
                            disabled={ isLoadingTable || !itemCategoryPaging?.totalPages }
                        />
                    </div>
                </div>

                <TableContainer
                    component={ Paper }
                    elevation={ 0 }
                    className="il-content__table"
                >
                    <Table>
                        <TableHead className="il-content__table-header bg-gray-100">
                            <TableRow className="text-xs font-semibold tracking-wider">
                                <TableCell>Kode kategori</TableCell>
                                <TableCell>Nama kategori</TableCell>
                                <TableCell>Diperbarui oleh</TableCell>
                                <TableCell>Diperbarui pada</TableCell>
                                <TableCell align="right">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            { isLoadingTable
                                ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan="5"
                                            className="!border-b-0 !text-center italic !text-gray-500"
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
                                : listError && !itemCategoryList?.length
                                    ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan="5"
                                                className="!border-b-0 !text-center !text-gray-500"
                                            >
                                                Data kategori belum dapat ditampilkan.
                                            </TableCell>
                                        </TableRow>
                                    )
                                : itemCategoryList?.length
                                    ? itemCategoryList?.map(((itemCategory, index) => {
                                        const isLastRow = index === itemCategoryList.length - 1
                                        const tableCellClass = isLastRow ? '!border-b-0' : ''
                                        return (
                                            <TableRow
                                                key={ itemCategory.code }
                                                className="il-content__table-row"
                                            >
                                                <TableCell className={ `${ tableCellClass } whitespace-nowrap` }>
                                                    { itemCategory.code }
                                                </TableCell>

                                                <TableCell className={ `${ tableCellClass } w-full` }>
                                                    { itemCategory.name }
                                                </TableCell>

                                                <TableCell className={ `${ tableCellClass } whitespace-nowrap` }>
                                                    { itemCategory.updatedBy }
                                                </TableCell>

                                                <TableCell className={ `${ tableCellClass } whitespace-nowrap` }>
                                                    { formatDate(itemCategory.updatedAt) }
                                                </TableCell>

                                                <TableCell
                                                    className={ `${ tableCellClass } il-content__table-row-action table-action` }>
                                                    <div
                                                        className="table-action__content flex justify-end items-center gap-1">
                                                        <IconButton
                                                            component={ Link }
                                                            to={ `/item-categories/${ itemCategory.code }/edit` }
                                                            className="table-action__edit"
                                                            size="small"
                                                            aria-label={ `Ubah kategori ${ itemCategory.name }` }
                                                        >
                                                            <PencilIcon/>
                                                        </IconButton>


                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            aria-label={ `Nonaktifkan kategori ${ itemCategory.name }` }
                                                            disabled={ Boolean(isLoadingItemCount) }
                                                            onClick={ event => openDeleteItemCategoryConfirmationModal(
                                                                itemCategory,
                                                                event.currentTarget
                                                            ) }
                                                        >
                                                            { isLoadingItemCount === itemCategory.code
                                                                ? <CircularProgress size={ 18 } />
                                                                : <TrashIcon className="table-action__delete"/> }
                                                        </IconButton>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }))
                                    : (
                                        <TableRow>
                                            <TableCell
                                                className="!border-b-0 !text-center italic !text-gray-500"
                                                colSpan="5"
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
