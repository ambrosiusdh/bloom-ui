import {
    useEffect,
    useState
} from 'react';

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
    TextField,
} from '@mui/material';

import {
    EyeIcon,
    PencilIcon,
    Plus,
    TrashIcon
} from "lucide-react";

import {
    useBreadcrumbStore,
    useItemCategoryStore,
    useItemStore
} from "@stores/index.js";

import { formatDate } from "@utils/date-utils.js";
import { debounce } from "@utils/general-utils.js";

import BloomConfirmationModal from "@components/_ui/BloomConfirmationModal.jsx";

import { GENERIC_ERR_MESSAGE } from "@constants/general.js"
import { ITEM_CATEGORY_LIST_MESSAGES } from "@constants/item-category.jsx"

export default function ItemCategoryList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const itemCategoryList = useItemCategoryStore(state => state.itemCategoryList);
    const itemCategoryPaging = useItemCategoryStore(state => state.itemCategoryPaging);
    const itemCategoriesItemCount = useItemCategoryStore(state => state.itemCategoriesItemCount);
    const getItemCategoryList = useItemCategoryStore(state => state.getItemCategoryList);
    const deactivateItemCategory = useItemCategoryStore(state => state.deactivateItemCategory);
    const getItemCategoriesItemCount = useItemCategoryStore(state => state.getItemCategoriesItemCount);

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
    const [isLoadingTable, setLoadingTable] = useState(false);
    const [messageAlertData, setMessageAlertData] = useState({});

    const handleFilterKeyChange = e => {
        setSelectedFilterKey(e.target.value);
    }
    const handleFilterChange = e => {
        setFilters(e.target.value);
    }
    const handleFilterClear = () => {
        setFilters('')
        setSelectedFilterKey('code');
    }

    const filterItemCategoryList = async (page = currentPage) => {
        setLoadingTable(true);
        setCurrentPage(page);
        const payload = {
            params: {
                page,
                size: itemPerPage,
                [selectedFilterKey]: filters
            }
        }

        try {
            await getItemCategoryList(payload)
        } finally {
            setLoadingTable(false);
        }
    }

    const handleItemPerPageChange = (e) => {
        setItemPerPage(e.target.value)
        setCurrentPage(1)
    };

    const handlePageChange = (e, value) => {
        setCurrentPage(value);
    }

    const fetchItemCategoryList = async () => {
        setSearchParams({
            page: currentPage,
            itemPerPage: itemPerPage,
            q: filters,
            key: selectedFilterKey
        })
        await filterItemCategoryList();
    }

    const openDeleteItemCategoryConfirmationModal = async itemCategory => {
        try {
            await getItemCategoriesItemCount(itemCategory.code)
            setSelectedDeleteTarget(itemCategory)
        } catch (error) {
            enqueueSnackbar(JSON.stringify(error?.message) || GENERIC_ERR_MESSAGE, { variant: 'error' })
            console.error(error)
        }
    }

    const handleDeleteItemCategory = async () => {
        try {
            await deactivateItemCategory(selectedDeleteTarget.code, {
                useLoader: true
            })
            enqueueSnackbar(
                ITEM_CATEGORY_LIST_MESSAGES.deleteItemCategorySuccess.message(selectedDeleteTarget.name),
                ITEM_CATEGORY_LIST_MESSAGES.deleteItemCategorySuccess.options
            )
            setSelectedDeleteTarget({});
            filterItemCategoryList(1)
        } catch (error) {
            enqueueSnackbar(JSON.stringify(error?.message) || GENERIC_ERR_MESSAGE, { variant: 'error' })
            console.log(error)
        }
    }

    useEffect(() => {
        debounce(fetchItemCategoryList, 'fetchItemList', 500)
    }, [itemPerPage, filters, currentPage]);

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
                        onCancel={ () => setSelectedDeleteTarget({}) }
                        onConfirm={ handleDeleteItemCategory }
                        title={ `Hapus ${ selectedDeleteTarget.name }?` }
                        confirmButtonText="Hapus">
                        <div className="item-category-list__delete">
                            <div className="item-category-list__delete-description">
                                Apakah Anda yakin ingin menghapus kategori
                                <span className="font-bold"> { selectedDeleteTarget.name }</span>?
                            </div>

                            { !!itemCategoriesItemCount?.itemCount &&
                                <div className="item-category-list__delete-description">
                                    Saat ini ada
                                    <span className="font-bold"> { itemCategoriesItemCount?.itemCount } barang </span>
                                    yang terikat pada kategori ini.
                                </div>
                            }
                            Jika dihapus, data kategori dan barang tidak bisa dikembalikan lagi.
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

            <div className="item-category-list__header mb-4 flex justify-between items-center">
                <h2 className="item-category-list__header-title font-bold text-2xl">Kategori Barang</h2>

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
                items-center
                gap-2"
            >
                <TextField
                    select
                    className="item-category-list__filter-key basis-1/6"
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

                {
                    selectedFilterKey === 'category'
                        ? (
                            <TextField
                                select
                                className="item-category-list__filter-value basis-1/3"
                                label={ `Filter by ${ filterKeyData[selectedFilterKey] }` }
                                variant="outlined"
                                size="small"
                                value={ filters }
                                onChange={ handleFilterChange }
                            >
                                { itemCategoryList?.length ?
                                    itemCategoryList?.map(category => (
                                        <MenuItem key={ category.code } value={ category.code }>
                                            { category.name }
                                        </MenuItem>
                                    )) :
                                    <MenuItem value={ selectedFilterKey }>
                                        - Pilih kategori -
                                    </MenuItem>
                                }
                            </TextField>
                        )
                        : (
                            <TextField
                                className="item-category-list__filter-value basis-1/3"
                                label={ `Filter by ${ filterKeyData[selectedFilterKey] }` }
                                variant="outlined"
                                size="small"
                                value={ filters }
                                onChange={ handleFilterChange }
                            />
                        )
                }

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
                            count={ itemCategoryPaging?.totalPages }
                            onChange={ handlePageChange }
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
                                <TableCell></TableCell>
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
                                            Loading...
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
                                                        <Link
                                                            to={ `/item-categories/${ itemCategory.code }/edit` }
                                                            className="table-action__edit"
                                                        >
                                                            <IconButton size="small">
                                                                <PencilIcon/>
                                                            </IconButton>
                                                        </Link>


                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={ () => openDeleteItemCategoryConfirmationModal(itemCategory) }
                                                        >
                                                            <TrashIcon className="table-action__delete"/>
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