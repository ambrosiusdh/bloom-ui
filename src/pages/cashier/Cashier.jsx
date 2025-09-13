import { CashierCart } from "@components/cashier/CashierCart.jsx";
import { CASHIER_ACTION_MESSAGE } from "@constants/cashier.jsx";
import {
    Button,
    ButtonGroup,
    Chip,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from "@mui/material";
import { useBreadcrumbStore, useItemCategoryStore, useItemStore } from "@stores/index.js";
import { clearDebounce, debounce } from "@utils/general-utils.js";
import { LayoutGridIcon, LayoutListIcon, ShoppingCartIcon } from "lucide-react";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";

export function Cashier() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const itemList = useItemStore(state => state.itemList);
    const itemCategoryList = useItemCategoryStore(state => state.itemCategoryList);
    const getItemList = useItemStore(state => state.getItemList);
    const getItemDetails = useItemStore(state => state.getItemDetails);
    const getItemCategoryList = useItemCategoryStore(state => state.getItemCategoryList);

    const [dataDisplayMode, setDataDisplayMode] = useState('list');
    const handleDisplayModeChange = mode => {
        setDataDisplayMode(mode);
    }

    const [categoryFilter, setCategoryFilter] = useState('');
    const handleCategoryFilterChange = (value) => {
        setCategoryFilter(value);
    }

    const [isLoadingData, setIsLoadingData] = useState(false);
    const [localItemList, setLocalItemList] = useState([]);
    const addItemToCart = item => {
        setLocalItemList(prev => {
            const existingItem = prev.find(({ sku }) => sku === item.sku);

            if (existingItem) {
                if (existingItem.stockQuantity === existingItem.quantity) {
                    enqueueSnackbar(
                        CASHIER_ACTION_MESSAGE.addItemCartWithMaxQuantity.message(existingItem.name),
                        CASHIER_ACTION_MESSAGE.addItemCartWithMaxQuantity.options
                    );
                    return prev
                }

                enqueueSnackbar(
                    CASHIER_ACTION_MESSAGE.addItemToCartSuccess.message(existingItem.name),
                    CASHIER_ACTION_MESSAGE.addItemToCartSuccess.options
                );
                return prev.map(existingItem =>
                    existingItem.sku === item.sku
                        ? { ...existingItem, quantity: (existingItem.quantity ?? 0) + 1 }
                        : existingItem
                );
            }

            enqueueSnackbar(
                CASHIER_ACTION_MESSAGE.addItemToCartSuccess.message(item.name),
                CASHIER_ACTION_MESSAGE.addItemToCartSuccess.options
            );
            return [...prev, { ...item, quantity: 1 }];
        });
    }
    const handleQuantityUpdate = (quantity, sku) => {
        setLocalItemList(prevState => prevState.map(item => ({
            ...item,
            quantity: item.sku === sku ? quantity : item.quantity
        })))
    }

    const [searchValue, setSearchValue] = useState("");
    function handleSearchChange (e) {
        setSearchValue(e.target.value);
    }
    async function handleSearchKeyup (e) {
        if (e.key !== "Enter") {
            return
        }

        clearDebounce('filterItemList')
        try {
            const response = await getItemDetails(searchValue, { useLoader: true });
            addItemToCart(response.data)
        } catch (error) {
            enqueueSnackbar(
                CASHIER_ACTION_MESSAGE.scanItemNotFound.message(searchValue),
                CASHIER_ACTION_MESSAGE.scanItemNotFound.options
            );
        } finally {
            setSearchValue("");
        }
    }

    const filterItemList = async () => {
        setIsLoadingData(true);
        const payload = {
            params: {
                page: 1,
                size: 10,
                category: categoryFilter,
                skuOrName: searchValue
            }
        }

        try {
            await getItemList(payload)
        } finally {
            setIsLoadingData(false);
        }
    }

    const filterItemCategoryList = async () => {
        const payload = {
            params: {
                page: 1,
                size: 2000
            }
        }

        await getItemCategoryList(payload)
    }

    useEffect(() => {
        debounce(filterItemList, 'filterItemList', 500)
    }, [searchValue, categoryFilter]);
    useEffect(() => {
        setBreadcrumbs(['Cashier'])
        filterItemCategoryList()
    }, [])

    return (
        <div className="cashier flex gap-4">
            <div className="cashier__content basis-2/3 min-w-0">
                <div className="cashier__content-filter card mb-4">
                    <TextField
                        className="cashier__content-filter-value w-full"
                        label="Cari atau scan produk"
                        variant="outlined"
                        size="small"
                        value={ searchValue }
                        onKeyUp={ handleSearchKeyup }
                        onChange={ handleSearchChange }
                        autoFocus
                    />
                </div>

                <div className="cashier-products card">
                    <div className="cashier-products__header flex justify-between">
                        <h2 className="cashier-products__header-title text-lg font-bold text-black mb-4">Daftar produk</h2>

                        <div className="cashier-products__header-action">
                            <ButtonGroup
                                className="cashier-products__header-action-buttons"
                                size="small">
                                <Button
                                    className="cashier-products__header-action-list"
                                    variant={ dataDisplayMode === 'list' ? 'contained' : 'outlined' }
                                    onClick={ () => handleDisplayModeChange('list') }
                                >
                                    <LayoutListIcon/>
                                </Button>

                                <Button
                                    className="cashier-products__header-action-grid"
                                    variant={ dataDisplayMode === 'grid' ? 'contained' : 'outlined' }
                                    onClick={ () => handleDisplayModeChange('grid') }
                                >
                                    <LayoutGridIcon/>
                                </Button>
                            </ButtonGroup>
                        </div>
                    </div>

                    <div className="cashier-products__content">
                        <div className="cashier-products__content-categories flex gap-2 overflow-x-auto scrollbar-thin mb-4">
                            <Chip
                                label="Semua"
                                variant={ categoryFilter === '' ? 'contained' : 'outlined' }
                                color="primary"
                                clickable
                                onClick={ () => handleCategoryFilterChange('') }
                            />

                            {
                                itemCategoryList?.map(category => (
                                    <Chip
                                        key={ category.code }
                                        label={ category.name }
                                        variant={ categoryFilter === category.code ? "contained" : "outlined" }
                                        color="primary"
                                        clickable
                                        onClick={ () => handleCategoryFilterChange(category.code) }
                                    />
                                ))
                            }
                        </div>

                        {
                            dataDisplayMode === 'list' ? (
                                <TableContainer
                                    component={ Paper }
                                    elevation={ 0 }
                                    className="cashier-product-list"
                                >
                                    <Table>
                                        <TableHead className="cashier-product-list__header bg-gray-100">
                                            <TableRow className="text-xs font-semibold tracking-wider">
                                                <TableCell>SKU</TableCell>
                                                <TableCell>Nama barang</TableCell>
                                                <TableCell>Kategori</TableCell>
                                                <TableCell>Stock</TableCell>
                                                <TableCell>Harga</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            { isLoadingData
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
                                                                className={ `cashier-product-list__row ${!item.stockQuantity ? 'bg-red-100' : ''}` }
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

                                                                <TableCell className={ `${tableCellClass} whitespace-nowrap ${item.stockQuantity ? '' : '!text-red-600 !font-bold'}` }>
                                                                    { item.stockQuantity }
                                                                </TableCell>

                                                                <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                                                    Rp. { item.price }
                                                                </TableCell>

                                                                <TableCell className={ `${tableCellClass} cashier-product-list__row-action table-action` }>
                                                                    <div className="table-action__content flex justify-end items-center gap-1">
                                                                        <IconButton
                                                                            size="small"
                                                                            disabled={ !item.stockQuantity }
                                                                            onClick={ () => addItemToCart(item) }
                                                                        >
                                                                            <ShoppingCartIcon className="table-action__content-button" />
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
                            ) : (
                                <div className="cashier-products__content-grid">

                                </div>
                            )
                        }
                    </div>
                </div>
            </div>

            <div className="cashier__cart basis-1/3">
                <CashierCart
                    itemList={ localItemList }
                    onQuantityUpdate={ handleQuantityUpdate }
                />
            </div>
        </div>
    )
}