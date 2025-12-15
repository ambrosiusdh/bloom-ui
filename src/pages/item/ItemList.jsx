import {
    useEffect,
    useState,
    lazy
} from "react";

import { enqueueSnackbar } from "notistack"

import {
    Link,
    useSearchParams
} from "react-router-dom";

import {
    Alert,
    Button,
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
} from "@mui/material";

import {
    PencilIcon,
    Plus,
    PrinterIcon,
    TrashIcon,
    HistoryIcon,
    SearchIcon,
    SquareArrowOutUpRightIcon
} from "lucide-react";

import { useBreadcrumbStore, useItemCategoryStore, useItemStore } from "@stores/index.js";

import { debounce } from "@utils/general-utils.js";

import BloomConfirmationModal from "@components/_ui/BloomConfirmationModal.jsx";
import ItemAuditLogModal from "@components/item/ItemAuditLogModal.jsx"; // Import Modal
import ItemBarcodeModal from "@components/item/ItemBarcodeModal.jsx";
import ItemDetailModal from "@components/item/ItemDetailModal.jsx";

import { GENERIC_ERR_MESSAGE } from "@constants/general.js"
import { ITEM_LIST_MESSAGES } from "@constants/item.jsx"

const ItemList = () => {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const itemList = useItemStore(state => state.itemList);
    const itemPaging = useItemStore(state => state.itemPaging);
    const getItemList = useItemStore(state => state.getItemList);
    const deactivateItem = useItemStore(state => state.deactivateItem);
    const itemCategoryList = useItemCategoryStore(state => state.itemCategoryList);
    const getItemCategoryList = useItemCategoryStore(state => state.getItemCategoryList);

    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedItemDetailData, setSelectedItemDetailData] = useState({});
    const [selectedDeleteTarget, setSelectedDeleteTarget] = useState({});
    const [selectedItemAuditLogData, setSelectedItemAuditLogData] = useState({}); // State for Audit Log
    const [selectedBarcodeItem, setSelectedBarcodeItem] = useState({}); // State for Barcode Modal
    const [filters, setFilters] = useState('');
    const [selectedFilterKey, setSelectedFilterKey] = useState('name');
    const filterKeyData = {
        "name": "Nama barang",
        "sku": "Kode barang",
        "category": "Kategori"
    }
    const [currentPage, setCurrentPage] = useState(1);
    const [itemPerPage, setItemPerPage] = useState(10);
    const itemPerPageOptions = [5, 10, 25, 50]
    const [isLoadingTable, setLoadingTable] = useState(false);
    const [messageAlertData, setMessageAlertData] = useState({});

    const handleFilterKeyChange = e => {
        setSelectedFilterKey(e.target.value);
    }
    const handleFilterChange = e => {
        setFilters(e.target.value);
        setCurrentPage(1)
    }
    const handleFilterClear = () => {
        setFilters('')
        setSelectedFilterKey('name');
    }

    const filterItemList = async (page = currentPage) => {
        setLoadingTable(true);
        setCurrentPage(page);
        const payload = {
            params: {
                page,
                size: itemPerPage,
                [selectedFilterKey]: filters,
                isRemoved: false
            }
        }

        await getItemList(payload)
        setLoadingTable(false);
    }

    const filterItemCategoryList = async () => {
        const payload = {
            params: {
                page: 1,
                size: 2000
            }
        }
        await getItemCategoryList(payload, {
            useLoader: true
        })
    }

    const handleItemPerPageChange = (e) => {
        setItemPerPage(e.target.value)
        setCurrentPage(1)
    };

    const handlePageChange = (e, value) => {
        setCurrentPage(value);
    }

    const fetchItemList = async () => {
        setSearchParams({
            page: currentPage,
            itemPerPage: itemPerPage,
            q: filters,
            key: selectedFilterKey
        })
        await filterItemList();
    }

    const handleDeleteItem = async () => {
        try {
            await deactivateItem(selectedDeleteTarget.sku, {
                useLoader: true
            })
            enqueueSnackbar(
                ITEM_LIST_MESSAGES.deleteItemSuccess.message(selectedDeleteTarget.name),
                ITEM_LIST_MESSAGES.deleteItemSuccess.options
            )
            setSelectedDeleteTarget({});
            filterItemList(1)
        } catch (error) {
            enqueueSnackbar(JSON.stringify(error?.message) || GENERIC_ERR_MESSAGE, { variant: 'error' })
            console.log(error)
        }
    }

    const handleCloseItemDetail = () => {
        setSelectedItemDetailData({});
    }

    const handleCloseAuditLog = () => {
        setSelectedItemAuditLogData({});
    }

    const handleCloseBarcodeModal = () => {
        setSelectedBarcodeItem({});
    }

    useEffect(() => {
        debounce(fetchItemList, 'fetchItemList', 500)
    }, [itemPerPage, filters, currentPage]);

    useEffect(() => {
        setFilters('');
    }, [selectedFilterKey]);

    useEffect(() => {
        setBreadcrumbs(['Data Barang'])
        filterItemCategoryList()

        setMessageAlertData({
            show: searchParams.has('message'),
            message: searchParams.get('message'),
            type: searchParams.get('messageType') || 'info'
        })
        const filterQueryParameterList = ['q', 'key', 'page', 'itemPerPage']
        if (filterQueryParameterList.some(key => searchParams.has(key))) {
            setSelectedFilterKey(searchParams.get('key') || 'sku');
            setFilters(searchParams.get('q') || '');
            setItemPerPage(Number(searchParams.get('itemPerPage')) || 10)
            setCurrentPage(Number(searchParams.get('page')) || 1)
        }
    }, []);

    return (
        <div className="item-list">
            {
                selectedBarcodeItem?.sku && (
                    <ItemBarcodeModal
                        itemData={ selectedBarcodeItem }
                        onClose={ handleCloseBarcodeModal }
                    />
                )
            }

            {
                selectedItemDetailData?.sku && (
                    <ItemDetailModal
                        itemData={ selectedItemDetailData }
                        onClose={ handleCloseItemDetail }
                    />
                )
            }

            {
                selectedItemAuditLogData?.sku && (
                    <ItemAuditLogModal
                        sku={ selectedItemAuditLogData.sku }
                        onClose={ handleCloseAuditLog }
                    />
                )
            }

            {
                selectedDeleteTarget?.sku && (
                    <BloomConfirmationModal
                        onCancel={ () => setSelectedDeleteTarget({}) }
                        onConfirm={ handleDeleteItem }
                        title={ `Hapus ${selectedDeleteTarget.name}?` }
                        confirmButtonText="Hapus">
                        <div className="item-list__delete">
                            <div className="item-list__delete-description">
                                Apakah Anda yakin ingin menghapus
                                <span className="font-bold"> { selectedDeleteTarget.name }</span>?
                            </div>

                            Jika dihapus, data barang tidak bisa dikembalikan lagi.
                        </div>
                    </BloomConfirmationModal>
                )
            }

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

            <div className="item-list__header mb-4 flex justify-between items-center">
                <h2 className="item-list__header-title font-bold text-2xl">Daftar Barang</h2>

                <div className="item-list__header-action">
                    <Link
                        to="/items/new"
                        className="item-list__header-action-create"
                    >
                        <Button
                            variant="contained"
                            endIcon={ <Plus className="w-5" /> }>
                            Buat Barang
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="
                item-list__filter
                card
                mb-4
                flex
                items-center
                gap-2"
            >
                <TextField
                    select
                    className="item-list__filter-key basis-1/6"
                    label="Filter by"
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

                { selectedFilterKey === 'category'
                    ? (
                        <TextField
                            select
                            className="item-list__filter-value basis-1/3"
                            label={ `Filter by ${filterKeyData[selectedFilterKey]}` }
                            variant="outlined"
                            size="small"
                            value={ filters }
                            onChange={ handleFilterChange }
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            { itemCategoryList?.map(category => (
                                <MenuItem key={ category.code } value={ category.code }>
                                    [{ category.code }] { category.name }
                                </MenuItem>
                            )) }
                        </TextField>
                    )
                    : (
                        <TextField
                            className="item-list__filter-value basis-1/3"
                            label={ `Filter by ${filterKeyData[selectedFilterKey]}` }
                            variant="outlined"
                            size="small"
                            value={ filters }
                            onChange={ handleFilterChange }
                        />
                    ) }


                <Button
                    className="item-list__filter-clear"
                    variant="text"
                    onClick={ handleFilterClear }
                >
                    Hapus filter
                </Button>
            </div>

            <div className="item-list__content bg-white rounded-lg shadow-lg pb-2">
                <div className="item-list__content-pagination px-4 py-2 flex justify-between items-center">
                    <h3 className="item-list__content-pagination-title text-xl font-bold">Daftar Barang</h3>

                    <div className="item-list__content-pagination-inputs flex gap-2 items-center">
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
                            count={ itemPaging?.totalPages }
                            onChange={ handlePageChange }
                        />
                    </div>
                </div>

                <TableContainer
                    component={ Paper }
                    elevation={ 0 }
                    className="item-list__content-table"
                >
                    <Table>
                        <TableHead className="item-list__content-table-header bg-gray-100">
                            <TableRow className="text-xs font-semibold tracking-wider">
                                <TableCell className="whitespace-nowrap">Nama Barang</TableCell>
                                <TableCell className="whitespace-nowrap">Kategori</TableCell>
                                <TableCell className="whitespace-nowrap">Kode Barang</TableCell>
                                <TableCell className="whitespace-nowrap text-right">Harga</TableCell>
                                <TableCell className="whitespace-nowrap text-right">Stok</TableCell>
                                <TableCell className="whitespace-nowrap w-[1%]">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            { isLoadingTable
                                ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan="6"
                                            className="!border-b-0 !text-center italic !text-gray-500"
                                        >
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                )
                                : itemList?.length
                                    ? itemList?.map(((item, index) => {
                                        const isLastRow = index === itemList.length - 1
                                        const tableCellClass = isLastRow ? '!border-b-0' : ''
                                        return (
                                            <TableRow
                                                key={ item.sku }
                                                className="item-list__content-table-row hover:bg-gray-50 cursor-pointer"
                                                onClick={ (e) => {
                                                    // Prevent opening detail modal when clicking action buttons
                                                    if (e.target.closest('button') || e.target.closest('a')) return;
                                                    setSelectedItemDetailData(item);
                                                } }
                                            >
                                                <TableCell className={ `${tableCellClass} whitespace-nowrap w-full` }>
                                                    { item.name }
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                                    { item.category?.name || '-' }
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                                    { item.sku }
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} whitespace-nowrap text-right` }>
                                                    { new Intl.NumberFormat('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR'
                                                    }).format(item.price) }
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} whitespace-nowrap text-right` }>
                                                    { item.stockQuantity || 0 }
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                                    <div className="flex gap-2">
                                                        <Link
                                                            to={ `/items/${item.sku}/edit` }
                                                            className="table-action__edit"
                                                        >
                                                            <IconButton size="small">
                                                                <PencilIcon className="table-action__edit-icon text-gray-500" />
                                                            </IconButton>
                                                        </Link>

                                                        <IconButton
                                                            size="small"
                                                            title="Riwayat Stok"
                                                            onClick={ (e) => {
                                                                e.stopPropagation();
                                                                setSelectedItemAuditLogData(item);
                                                            } }
                                                        >
                                                            <HistoryIcon className="text-blue-500 w-5 h-5" />
                                                        </IconButton>

                                                        <IconButton
                                                            size="small"
                                                            title="Cetak Barcode"
                                                            onClick={ (e) => {
                                                                e.stopPropagation();
                                                                setSelectedBarcodeItem(item);
                                                            } }
                                                        >
                                                            <PrinterIcon className="text-gray-700 w-5 h-5" />
                                                        </IconButton>

                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={ (e) => {
                                                                e.stopPropagation();
                                                                setSelectedDeleteTarget(item);
                                                            } }
                                                        >
                                                            <TrashIcon className="table-action__delete" />
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
                                                colSpan="6"
                                            >
                                                Data tidak ditemukan
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

export default ItemList;
