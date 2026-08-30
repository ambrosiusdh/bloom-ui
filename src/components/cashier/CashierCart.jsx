import { useEffect, useRef, useState } from 'react';
import { IconButton, TextField } from '@mui/material';
import {
    MinusIcon,
    PlusIcon,
    ShoppingBasketIcon,
    Trash2Icon
} from 'lucide-react';
import PropTypes from 'prop-types';

import {
    canDecrementQuantityByOne,
    decrementQuantityByOne,
    formatQuantity,
    formatUnitOfMeasure,
    incrementQuantityByOne,
    isQuantityAboveAvailability,
    normalizeQuantity,
    validateQuantity
} from '@utils/quantity-utils.js';

const formatPrice = value => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 4
}).format(Number(value || 0));

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

    const adjustByOne = operation => {
        const validationError = validateQuantity(draft, item.fractionalQuantityAllowed);
        setError(validationError);
        onValidityChange(item.sku, !validationError);
        if (validationError) {
            inputRef.current?.focus();
            return;
        }

        const nextQuantity = operation(normalizeQuantity(draft));
        setDraft(nextQuantity);
        onQuantityUpdate(nextQuantity, item.sku);
        onValidityChange(item.sku, true);
    };

    return (
        <div className="flex items-start gap-1">
            <IconButton
                aria-label={ `Kurangi jumlah ${ item.name } sebesar 1 ${ formatUnitOfMeasure(item.baseUnitOfMeasure) }` }
                disabled={ disabled || !canDecrementQuantityByOne(item.quantity) }
                onClick={ () => adjustByOne(decrementQuantityByOne) }
            >
                <MinusIcon aria-hidden="true" />
            </IconButton>

            <TextField
                className="min-w-0 flex-grow"
                label={ `Jumlah ${ item.name }` }
                size="small"
                value={ draft }
                inputRef={ inputRef }
                disabled={ disabled }
                error={ Boolean(error) }
                helperText={ error || (item.fractionalQuantityAllowed
                    ? 'Boleh pecahan, maksimal 4 desimal.'
                    : 'Hanya jumlah utuh.') }
                onChange={ event => {
                    setDraft(event.target.value);
                    setError('');
                    onValidityChange(
                        item.sku,
                        !validateQuantity(event.target.value, item.fractionalQuantityAllowed)
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
                slotProps={ {
                    htmlInput: {
                        inputMode: item.fractionalQuantityAllowed ? 'decimal' : 'numeric'
                    }
                } }
            />

            <IconButton
                aria-label={ `Tambah jumlah ${ item.name } sebesar 1 ${ formatUnitOfMeasure(item.baseUnitOfMeasure) }` }
                disabled={ disabled }
                onClick={ () => adjustByOne(incrementQuantityByOne) }
            >
                <PlusIcon aria-hidden="true" />
            </IconButton>
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
    onEditComplete
}) {
    return (
        <section className="cashier-cart card w-full" aria-labelledby="cashier-cart-title">
            <h2 id="cashier-cart-title" className="text-lg font-bold">Keranjang</h2>
            <p className="mt-1 text-sm text-gray-600">
                Menambah barang yang sama menaikkan jumlahnya tepat 1 satuan dasar.
                Tombol +/− juga mengubah tepat 1; jumlah pecahan tetap dapat diketik.
            </p>

            { itemList.length ? (
                <div className="mt-4 max-h-[55vh] overflow-y-auto scrollbar-thin">
                    { itemList.map((item, index) => {
                        const aboveAvailability = isQuantityAboveAvailability(item.quantity, item.stockStore);

                        return (
                            <article className="mb-4 rounded border p-3" key={ item.sku }>
                                <div className="flex items-start gap-3">
                                    <span className="text-gray-500">{ index + 1 }</span>
                                    <div className="min-w-0 flex-grow">
                                        <div className="font-semibold break-words">{ item.name }</div>
                                        <div className="text-sm text-gray-600">
                                            { item.sku } · { formatPrice(item.price) }/{ formatUnitOfMeasure(item.baseUnitOfMeasure) }
                                        </div>
                                    </div>
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

                                <div className="mt-3">
                                    <QuantityField
                                        item={ item }
                                        disabled={ disabled }
                                        onQuantityUpdate={ onQuantityUpdate }
                                        onValidityChange={ onQuantityValidityChange }
                                        onEditComplete={ onEditComplete }
                                    />
                                </div>

                                <p className={ `mt-2 text-sm ${ aboveAvailability ? 'text-amber-700' : 'text-gray-600' }` }>
                                    Tersedia di STORE: { formatQuantity(item.stockStore, item.baseUnitOfMeasure) }
                                    { aboveAvailability && ' — jumlah keranjang melebihi informasi stok saat ini.' }
                                    { ' ' }Stok ini bersifat informasi; server memeriksa kembali saat checkout.
                                </p>
                            </article>
                        );
                    }) }
                </div>
            ) : (
                <div className="flex h-[55vh] w-full flex-col items-center justify-center gap-4">
                    <ShoppingBasketIcon className="h-[20vh] w-[20vh] text-gray-300" aria-hidden="true" />
                    <div className="text-center text-lg text-gray-500">
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
    onEditComplete: PropTypes.func.isRequired
};
