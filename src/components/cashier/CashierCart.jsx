import { useEffect, useRef, useState } from 'react';
import {
    Button,
    IconButton
} from '@mui/material';
import {
    ShoppingBasketIcon,
    Trash2Icon
} from 'lucide-react';
import PropTypes from 'prop-types';

import BloomQuantityField from '@components/_ui/BloomQuantityField.jsx';
import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import {
    canDecrementQuantityByOne,
    formatQuantity,
    formatUnitOfMeasure,
    isQuantityAboveAvailability,
    normalizeQuantity,
    validateQuantity
} from '@utils/quantity-utils.js';

function QuantityField({
    item,
    disabled,
    onQuantityUpdate,
    onValidityChange,
    onEditComplete
}) {
    const [draft, setDraft] = useState(item.quantity);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    const skipBlurRef = useRef(false);

    useEffect(() => setDraft(item.quantity), [item.quantity]);

    const commit = () => {
        const validationError = validateQuantity(draft, item.fractionalQuantityAllowed);
        setError(validationError);
        onValidityChange(item.sku, !validationError);
        if (validationError) {
            inputRef.current?.focus();
            return false;
        }

        const normalized = normalizeQuantity(draft);
        setDraft(normalized);
        onQuantityUpdate(normalized, item.sku);
        return true;
    };

    const adjustByOne = nextQuantity => {
        const validationError = validateQuantity(draft, item.fractionalQuantityAllowed);
        setError(validationError);
        onValidityChange(item.sku, !validationError);
        if (validationError) {
            inputRef.current?.focus();
            return;
        }

        setDraft(nextQuantity);
        onQuantityUpdate(nextQuantity, item.sku);
        onValidityChange(item.sku, true);
    };

    return (
        <div className="cashier-cart__quantity-control">
            <BloomQuantityField
                unitOfMeasure={ item.baseUnitOfMeasure }
                decrementDisabled={ !!validateQuantity(draft, item.fractionalQuantityAllowed)
                    || !canDecrementQuantityByOne(draft) }
                onStep={ adjustByOne }
                label={ `Jumlah ${ item.name }` }
                hideVisibleLabel
                size="small"
                value={ draft }
                inputRef={ inputRef }
                disabled={ disabled }
                error={ Boolean(error) }
                helperText={ error || undefined }
                onChange={ value => {
                    setDraft(value);
                    setError('');
                    onValidityChange(
                        item.sku,
                        !validateQuantity(value, item.fractionalQuantityAllowed)
                    );
                } }
                onBlur={ () => {
                    if (skipBlurRef.current) {
                        skipBlurRef.current = false;
                        return;
                    }
                    commit();
                } }
                onKeyDown={ event => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        if (commit()) {
                            skipBlurRef.current = true;
                            onEditComplete();
                        }
                    }
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        skipBlurRef.current = true;
                        setDraft(item.quantity);
                        setError('');
                        onValidityChange(item.sku, true);
                        onEditComplete();
                    }
                } }
            />
        </div>
    );
}

QuantityField.propTypes = {
    item: PropTypes.object.isRequired,
    disabled: PropTypes.bool.isRequired,
    onQuantityUpdate: PropTypes.func.isRequired,
    onValidityChange: PropTypes.func.isRequired,
    onEditComplete: PropTypes.func.isRequired
};

export default function CashierCart({
    itemList,
    disabled = false,
    onQuantityUpdate,
    onQuantityValidityChange = () => undefined,
    onRemove,
    onEditComplete,
    onCancel
}) {
    return (
        <section className="cashier-cart w-full" aria-labelledby="cashier-cart-title">
            <div className="flex items-start justify-between gap-3 border-b pb-4">
                <div>
                    <h2 id="cashier-cart-title" className="text-lg font-bold">Transaksi saat ini</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        { itemList.length } jenis barang dipilih
                    </p>
                </div>
                <Button
                    type="button"
                    color="error"
                    size="small"
                    disabled={ disabled || !itemList.length }
                    onClick={ onCancel }
                >
                    Batalkan
                </Button>
            </div>

            { itemList.length ? (
                <div className="cashier-cart__items divide-y">
                    { itemList.map(item => {
                        const aboveAvailability = isQuantityAboveAvailability(item.quantity, item.stockStore);

                        return (
                            <article className="cashier-cart__item" key={ item.sku }>
                                <div className="cashier-cart__item-main">
                                    <div className="cashier-cart__item-identity">
                                        <strong>{ item.name }</strong>
                                        <small>
                                            { formatRupiah(item.price) }/{ formatUnitOfMeasure(item.baseUnitOfMeasure) }
                                        </small>
                                    </div>
                                    <QuantityField
                                        item={ item }
                                        disabled={ disabled }
                                        onQuantityUpdate={ onQuantityUpdate }
                                        onValidityChange={ onQuantityValidityChange }
                                        onEditComplete={ onEditComplete }
                                    />
                                    <IconButton
                                        aria-label={ `Hapus ${ item.name } dari keranjang` }
                                        size="small"
                                        color="error"
                                        disabled={ disabled }
                                        onClick={ () => onRemove(item.sku) }
                                    >
                                        <Trash2Icon aria-hidden="true" />
                                    </IconButton>
                                </div>

                                <div className={ `cashier-cart__stock text-sm ${ aboveAvailability ? 'rounded border border-amber-300 bg-amber-50 p-2 text-amber-900' : 'text-gray-600' }` }>
                                    <span>
                                        Tersedia di STORE: { formatQuantity(item.stockStore, item.baseUnitOfMeasure) }
                                        { aboveAvailability && ' — jumlah keranjang melebihi informasi stok saat ini.' }
                                    </span>
                                    { aboveAvailability && Number(item.stockStore) > 0 && (
                                        <Button
                                            type="button"
                                            color="warning"
                                            size="small"
                                            className="mt-1"
                                            disabled={ disabled }
                                            onClick={ () => {
                                                const normalizedStock = normalizeQuantity(item.stockStore);
                                                onQuantityUpdate(normalizedStock, item.sku);
                                                onQuantityValidityChange(item.sku, true);
                                            } }
                                        >
                                            Ubah ke stok tercatat
                                        </Button>
                                    ) }
                                </div>
                            </article>
                        );
                    }) }
                </div>
            ) : (
                <div className="flex min-h-64 w-full flex-col items-center justify-center gap-4 py-8">
                    <ShoppingBasketIcon className="h-20 w-20 text-gray-300" aria-hidden="true" />
                    <div className="text-center text-base text-gray-500">
                        Cari barang lalu tambahkan ke keranjang
                    </div>
                </div>
            ) }
        </section>
    );
}

CashierCart.propTypes = {
    itemList: PropTypes.array.isRequired,
    disabled: PropTypes.bool,
    onQuantityUpdate: PropTypes.func.isRequired,
    onQuantityValidityChange: PropTypes.func,
    onRemove: PropTypes.func.isRequired,
    onEditComplete: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};
