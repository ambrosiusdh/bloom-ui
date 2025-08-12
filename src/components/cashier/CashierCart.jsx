import PropTypes from "prop-types";
import { BloomInputNumber } from "@components/_ui/BloomInputNumber.jsx";
import { useState } from "react";

const propTypes = {
    itemList: PropTypes.array
}

export function CashierCart(props) {
    const { itemList } = props;
    function setItemQuantity(quantity, sku) {
        console.log(quantity);
    }

    return (
        <div className="cashier-cart card w-full">
            <div className="cashier-cart__header mb-6">
                <h2 className="cashier-cart__header-title text-lg font-bold">
                    Detail pesanan
                </h2>
            </div>

            <div className="cashier-cart__content">
                { itemList.map(((item, index) => (
                    <div className="cashier-cart__content-item flex items-center gap-6 mb-4" key={ item.sku }>
                        <div className="cashier-cart__content-item-number text-gray-500">
                            { index + 1 }
                        </div>

                        <div className="cashier-cart__content-item-value cashier-cart-item flex-grow flex items-center justify-between gap-2">
                            <div className="cashier-cart-item__name break-all">
                                { item.name }

                                <div className="cashier-cart-item__details-price font-bold">
                                    Rp. { item.price }
                                </div>
                            </div>

                            <div className="cashier-cart-item__details flex justify-between items-center">

                                <div className="cashier-cart-item__details-quantity">
                                    <BloomInputNumber
                                        value={ item.quantity }
                                        onChange={ newQuantity => setItemQuantity(newQuantity, item.sku) }
                                        max={ item.stockQuantity }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))) }
            </div>

            <div className="cashier-cart__footer">
                <div className="cashier-cart__footer-input">

                </div>

                <div className="cashier-cart__footer-submit">

                </div>
            </div>
        </div>
    )
}

CashierCart.propTypes = propTypes