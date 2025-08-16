import { CashierCart } from "@components/cashier/CashierCart.jsx";
import { useEffect, useState } from "react";
import { useItemStore } from "@stores/index.js";
import { TextField } from "@mui/material";

export function Cashier() {
    const itemList = useItemStore(state => state.itemList);
    const itemDetails = useItemStore(state => state.itemDetails);
    const getItemList = useItemStore(state => state.getItemList);
    const getItemDetails = useItemStore(state => state.getItemDetails);

    const [localItemList, setLocalItemList] = useState([]);
    const [selectedItemList, setSelectedItemList] = useState([]);

    const [searchValue, setSearchValue] = useState("");
    function handleSearchChange (e) {
        setSearchValue(e.target.value);
    }
    async function handleSearchKeyup (e) {
        if (e.key !== "Enter") {
            return
        }

        try {
            await getItemDetails(searchValue, { useLoader: true });
        } catch (error) {
            console.error(error);
        }
    }

    const filterItemList = async () => {
        const payload = {
            params: {
                page: 1,
                size: 5
            }
        }

        await getItemList(payload)
    }

    const handleQuantityUpdate = (quantity, sku) => {
        setLocalItemList(prevState => prevState.map(item => ({
            ...item,
            quantity: item.sku === sku ? quantity : item.quantity
        })))
    }

    useEffect(() => {
        console.log(itemList);

        if (itemList?.content?.length) {
            setLocalItemList(itemList.content.map(item => ({
                quantity: 1,
                ...item
            })));
        }
    }, [itemList]);

    useEffect(() => {
        filterItemList()
    }, [])

    return (
        <div className="cashier flex gap-4">
            <div className="cashier__content flex-grow">
                <div className="cashier__content-filter card mb-4">
                    <TextField
                        className="cashier__content-filter-value w-full"
                        label="Cari atau scan produk"
                        variant="outlined"
                        size="small"
                        value={ searchValue }
                        onKeyUp={ handleSearchKeyup }
                        onChange={ handleSearchChange }
                    />
                </div>

                <div className="cashier__content-data card">

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