import PropTypes from "prop-types";
import { BloomInputNumber } from "@components/_ui/BloomInputNumber.jsx";
import { useMemo, useState } from "react";
import { Button, FormControl, Input, InputAdornment, InputLabel, TextField } from "@mui/material";

const propTypes = {
    itemList: PropTypes.array,
    onQuantityUpdate: PropTypes.func
}

export function CashierCart(props) {
    const {
        itemList,
        onQuantityUpdate
    } = props;

    const [discount, setDiscount] = useState(0);
    const handleDiscountChange = e => {
        let value = +e.target.value.replace(/[^0-9]/g, '')
        setDiscount(value > subtotal ? subtotal : value);
    }
    const subtotal = useMemo(
        () => itemList.reduce((tot, item) => tot + (item.price * item.quantity), 0),
        [itemList]
    )

    return (
        <div className="cashier-cart card w-full flex flex-col">
            <div className="cashier-cart__header mb-6">
                <h2 className="cashier-cart__header-title text-lg font-bold">
                    Detail pesanan
                </h2>
            </div>

            <div className="cashier-cart__content">
                { itemList.length ? itemList.map(((item, index) => (
                    <div className="cashier-cart__content-item flex items-center gap-6 mb-4" key={ item.sku }>
                        <div className="cashier-cart__content-item-number text-gray-500">
                            { index + 1 }
                        </div>

                        <div className="cashier-cart__content-item-value cashier-cart-item flex-grow flex items-center justify-between gap-2">
                            <div className="cashier-cart-item__name break-all">
                                { item.name }

                                <div className="cashier-cart-item__details-price font-bold">
                                    Rp. { item.price * item.quantity }
                                </div>
                            </div>

                            <div className="cashier-cart-item__details flex justify-between items-center">

                                <div className="cashier-cart-item__details-quantity">
                                    <BloomInputNumber
                                        value={ item.quantity }
                                        onChange={ newQuantity => onQuantityUpdate(newQuantity, item.sku) }
                                        max={ item.stockQuantity }
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))) : (
                    <div className="cashier-cart__content-empty">

                    </div>
                ) }
            </div>

            <div className="cashier-cart__footer mt-auto">
                <div className="cashier-cart__footer-details cart-details card shadow-2xl mb-4">
                    <div className="cart-details__subtotal flex items-center justify-between mb-2">
                        <div className="cart-details__subtotal-name">
                            Subtotal:
                        </div>

                        <div className="cart-details__subtotal-value">
                            Rp. { subtotal }
                        </div>
                    </div>

                    <div className="cart-details__discount text-maroon-600 flex items-center justify-between mb-4">
                        <div className="cart-details__discount-name">
                            Diskon:
                        </div>

                        <div className="cart-details__discount-value">
                            <TextField
                                className="cart-details__discount-value-input"
                                size="small"
                                value={ discount }
                                onChange={ handleDiscountChange }
                                slotProps={ {
                                    input: {
                                        startAdornment: <InputAdornment position="start">Rp.</InputAdornment>,
                                    },
                                } }
                            />
                        </div>
                    </div>

                    <div className="cart-details__total font-bold border-t mx-[-16px] pt-4 px-4 flex items-center justify-between text-lg">
                        <div className="cart-details__total-name">
                            Total:
                        </div>

                        <div className="cart-details__total-value">
                            Rp. { subtotal - discount }
                        </div>
                    </div>
                </div>

                <div className="cashier-cart__footer-submit">
                    <Button
                        className="cashier-cart__footer-submit-btn"
                        variant="contained"
                        fullWidth
                    >
                        BAYAR
                    </Button>
                </div>
            </div>
        </div>
    )
}

CashierCart.propTypes = propTypes