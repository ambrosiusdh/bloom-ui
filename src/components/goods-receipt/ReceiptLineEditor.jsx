import { Button, MenuItem, TextField } from '@mui/material';
import PropTypes from 'prop-types';

import BloomQuantityField from '@components/_ui/BloomQuantityField.jsx';
import { validateReceiptDecimal } from '@components/goods-receipt/receipt-create.js';
import { canDecrementQuantityByOne, formatUnitOfMeasure } from '@utils/quantity-utils.js';

export default function ReceiptLineEditor({ line, index, disabled, errors, onChange, onRemove, fieldRef }) {
    const { item } = line;
    const field = name => ({
        name: `items[${ index }].${ name }`,
        value: line[name],
        disabled,
        inputRef: fieldRef(name),
        error: !!errors[`items[${ index }].${ name }`],
        helperText: errors[`items[${ index }].${ name }`]
    });
    const quantityError = validateReceiptDecimal(line.quantity, item.fractionalQuantityAllowed);

    return (
        <article
            className="grid min-w-0 grid-cols-1 gap-3 border-t py-3 first:border-t-0 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.2fr)_minmax(190px,.8fr)_minmax(160px,.7fr)_minmax(190px,.8fr)_auto] xl:items-start"
            aria-label={ `Baris ${ index + 1 }: ${ item.name }` }
        >
            <div className="min-w-0 sm:col-span-2 xl:col-span-1 xl:pt-2">
                <h3 className="break-words font-semibold">
                    { index + 1 }. { item.name }
                </h3>
                <p className="break-all text-sm text-gray-600">
                    { item.sku } · { item.fractionalQuantityAllowed ? 'pecahan didukung' : 'jumlah utuh' }
                </p>
            </div>
            <BloomQuantityField
                { ...field('quantity') }
                label={ `Jumlah baris ${ index + 1 }` }
                unitOfMeasure={ item.baseUnitOfMeasure }
                helperText={ field('quantity').helperText || (item.fractionalQuantityAllowed
                    ? 'Boleh pecahan; maksimal 4 desimal.'
                    : 'Hanya jumlah utuh.') }
                decrementDisabled={ !!quantityError || !canDecrementQuantityByOne(line.quantity) }
                onChange={ value => onChange('quantity', value) }
                onStep={ value => {
                    if (!quantityError
                            && value !== null
                            && !validateReceiptDecimal(value, item.fractionalQuantityAllowed)) {
                        onChange('quantity', value);
                    }
                } }
            />
            <TextField
                { ...field('stockLocation') }
                select
                label={ `Lokasi baris ${ index + 1 }` }
                onChange={ event => onChange('stockLocation', event.target.value) }
            >
                <MenuItem value="STORE">Toko (STORE)</MenuItem>
                <MenuItem value="WAREHOUSE">Gudang (WAREHOUSE)</MenuItem>
            </TextField>
            <TextField
                { ...field('purchasePrice') }
                label={ `Harga beli baris ${ index + 1 } (Rp/${ formatUnitOfMeasure(item.baseUnitOfMeasure) })` }
                slotProps={ { htmlInput: { inputMode: 'decimal' } } }
                onChange={ event => onChange('purchasePrice', event.target.value) }
                helperText={ field('purchasePrice').helperText || 'Harga per satuan dasar; maksimal 4 desimal.' }
            />
            <Button
                type="button"
                color="error"
                disabled={ disabled }
                onClick={ onRemove }
                aria-label={ `Hapus baris ${ index + 1 }` }
                className="justify-self-start sm:col-span-2 xl:col-span-1 xl:mt-1"
            >
                Hapus
            </Button>
        </article>
    );
}

ReceiptLineEditor.propTypes = {
    line: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    disabled: PropTypes.bool,
    errors: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    fieldRef: PropTypes.func.isRequired
};
