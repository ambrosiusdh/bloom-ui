import {
    useEffect,
    useState
} from 'react';

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

import { BloomConfirmationModal } from "@components/_ui/BloomConfirmationModal.jsx";
import { ItemDetailModal } from "@components/item/ItemDetailModal.jsx";

export function ItemList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const itemList = useItemStore(state => state.itemList);
    const itemPaging = useItemStore(state => state.itemPaging);
    const getItemList = useItemStore(state => state.getItemList);
    const itemCategoryList = useItemCategoryStore(state => state.itemCategoryList);
    const getItemCategoryList = useItemCategoryStore(state => state.getItemCategoryList);

    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedItemDetailData, setSelectedItemDetailData] = useState({});
    const [selectedDeleteTarget, setSelectedDeleteTarget] = useState('');
    const [filters, setFilters] = useState('');
    const [selectedFilterKey, setSelectedFilterKey] = useState('sku');
    const filterKeyData = {
        "sku": "SKU",
        "name": "Nama",
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
    }
    const handleFilterClear = () => {
        setFilters('')
        setSelectedFilterKey('sku');
    }

    const filterItemList = async (page = currentPage) => {
        setLoadingTable(true);
        setCurrentPage(page);
        const payload = {
            params: {
                page,
                size: itemPerPage,
                [selectedFilterKey]: filters
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
        alert('hapus')
        setSelectedDeleteTarget({});
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
                selectedItemDetailData?.sku && (
                    <ItemDetailModal
                        itemData={ selectedItemDetailData }
                        onClose={ () => setSelectedItemDetailData({}) }
                    />
                )
            }

            {
                selectedDeleteTarget?.sku && (
                    <BloomConfirmationModal
                        onCancel={ () => setSelectedDeleteTarget({}) }
                        onConfirm={ handleDeleteItem }
                        title={ `Hapus ${ selectedDeleteTarget.name }?` }
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
                <h2 className="item-list__header-title font-bold text-2xl">Data Barang</h2>

                <div className="item-list__header-action">
                    <Link
                        to="/items/new"
                        className="item-list__header-action-create"
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

                {
                    selectedFilterKey === 'category'
                        ? (
                            <TextField
                                select
                                className="item-list__filter-value basis-1/3"
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
                                className="item-list__filter-value basis-1/3"
                                label={ `Filter by ${ filterKeyData[selectedFilterKey] }` }
                                variant="outlined"
                                size="small"
                                value={ filters }
                                onChange={ handleFilterChange }
                            />
                        )
                }

                <Button
                    className="item-list__filter-clear"
                    variant="text"
                    onClick={ handleFilterClear }
                >
                    Hapus filter
                </Button>
            </div>

            <div className="item-list__content il-content bg-white rounded-lg shadow-lg pb-2">
                <div className="il-content__pagination px-4 py-2 flex justify-between items-center">
                    <h3 className="il-content__pagination-title text-xl font-bold">Daftar barang</h3>

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
                            count={ itemPaging?.totalPages }
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
                                <TableCell>SKU</TableCell>
                                <TableCell>Nama barang</TableCell>
                                <TableCell>Kategori</TableCell>
                                <TableCell>Dibuat pada</TableCell>
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
                                : itemList?.length
                                    ? itemList?.map(((item, index) => {
                                        const isLastRow = index === itemList.length - 1
                                        const tableCellClass = isLastRow ? '!border-b-0' : ''
                                        return (
                                            <TableRow
                                                key={ item.sku }
                                                className="il-content__table-row"
                                            >
                                                <TableCell className={ `${ tableCellClass } whitespace-nowrap` }>
                                                    { item.sku }
                                                </TableCell>

                                                <TableCell className={ `${ tableCellClass } w-full` }>
                                                    { item.name }
                                                </TableCell>

                                                <TableCell className={ `${ tableCellClass } whitespace-nowrap` }>
                                                    { item.category?.name }
                                                </TableCell>

                                                <TableCell className={ `${ tableCellClass } whitespace-nowrap` }>
                                                    { formatDate(item.createdAt) }
                                                </TableCell>

                                                <TableCell
                                                    className={ `${ tableCellClass } il-content__table-row-action table-action` }>
                                                    <div
                                                        className="table-action__content flex justify-end items-center gap-1">
                                                        <IconButton
                                                            size="small"
                                                            onClick={ () => setSelectedItemDetailData(item) }
                                                        >
                                                            <EyeIcon className="table-action__detail"/>
                                                        </IconButton>

                                                        <Link
                                                            to={ `/items/${ item.sku }/edit` }
                                                            className="table-action__edit"
                                                        >
                                                            <IconButton size="small">
                                                                <PencilIcon/>
                                                            </IconButton>
                                                        </Link>


                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={ () => setSelectedDeleteTarget(item) }
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
