import { useState, useEffect } from 'react';
import {
    Button,
    Pagination,
    MenuItem,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper, IconButton,
} from '@mui/material';
import { useItemStore } from "@stores/index.js";
import { debounce } from "@utils/general-utils.js";
import { EyeIcon, PencilIcon, Plus, TrashIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "@utils/date-utils.js";

export function ItemList() {
    const itemList = useItemStore(state => state.itemList);
    const getItemList = useItemStore(state => state.getItemList);

    const [filters, setFilters] = useState('');
    const [selectedFilterKey, setSelectedFilterKey] = useState('sku');
    const filterKeyData = {
        "sku": "SKU" ,
        "name": "Nama" ,
        "category": "Kategori"
    }
    const [currentPage, setCurrentPage] = useState(1);
    const [itemPerPage, setItemPerPage] = useState(10);
    const itemPerPageOptions = [5, 10, 25, 50]
    const [isLoadingTable, setLoadingTable] = useState(false);

    const handleFilterKeyChange = e => {
        setSelectedFilterKey(e.target.value);
    }
    const handleFilterChange = e => {
        setFilters(e.target.value);
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

    const handleItemPerPageChange = (e) => {
        setItemPerPage(e.target.value)
        setCurrentPage(1)
    };

    const handlePageChange = (e, value) => {
        setCurrentPage(value);
    }

    const fetchItemList = async () => {
        await filterItemList();
    }

    useEffect(() => {
        debounce(fetchItemList, 'fetchItemList', 500)
    }, [itemPerPage, filters, currentPage]);

    useEffect(() => {
        setFilters('');
    }, [selectedFilterKey]);

    useEffect(() => {
        console.log(itemList);
    }, [itemList]);

    return (
        <div className="item-list">
            <div className="item-list__header mb-4 flex justify-between items-center">
                <h2 className="item-list__header-title font-bold text-2xl">Data Barang</h2>

                <div className="item-list__header-action">
                    <Link
                        to="/items/create"
                        className="item-list__header-action-create"
                    >
                        <Button
                            variant="contained"
                            type="submit"
                            endIcon={ <Plus className="w-5" /> }>
                            Buat baru
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="
                item-list__filter
                bg-white
                rounded-lg
                shadow-lg
                p-4
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

                <TextField
                    className="item-list__filter-value basis-1/3"
                    label={ `Filter by ${filterKeyData[selectedFilterKey]}` }
                    variant="outlined"
                    size="small"
                    value={ filters }
                    onChange={ handleFilterChange }
                />
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
                            count={ itemList?.totalPages }
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
                                : itemList?.content?.length
                                    ? itemList?.content?.map(((item, index) => {
                                        const isLastRow = index === itemList.content.length - 1
                                        const tableCellClass = isLastRow ? '!border-b-0' : ''
                                        return (
                                            <TableRow
                                                key={ item.sku }
                                                className="il-content__table-row"
                                            >
                                                <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                                    { item.sku }
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} w-full` }>
                                                    { item.name }
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                                    { item.category?.name }
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                                    { formatDate(item.createdAt) }
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} il-content__table-row-action table-action` }>
                                                    <div className="table-action__content flex justify-end items-center gap-1">
                                                        <IconButton size="small">
                                                            <EyeIcon className="table-action__content-button" />
                                                        </IconButton>

                                                        <IconButton size="small">
                                                            <PencilIcon />
                                                        </IconButton>

                                                        <IconButton size="small" color="error">
                                                            <TrashIcon />
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
