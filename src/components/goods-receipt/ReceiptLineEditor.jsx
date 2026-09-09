import { Button, MenuItem, TextField } from '@mui/material';
import PropTypes from 'prop-types';

import BloomQuantityField from '@components/_ui/BloomQuantityField.jsx';
import { validateReceiptDecimal } from '@components/goods-receipt/receipt-create.js';
import { canDecrementQuantityByOne, formatUnitOfMeasure } from '@utils/quantity-utils.js';

export default function ReceiptLineEditor({ line, index, disabled, errors, onChange, onRemove, fieldRef }) {
    const { item } = line;
    const field = name => ({
        name: `items[${ index }].${ name }`, value: line[name], disabled,
        inputRef: fieldRef(name), error: !!errors[`items[${ index }].${ name }`],
        helperText: errors[`items[${ index }].${ name }`]
    });
    const quantityError = validateReceiptDecimal(line.quantity, item.fractionalQuantityAllowed);
    return (
        <article className="min-w-0 rounded border p-3 space-y-4" aria-label={ `Baris ${ index + 1 }: ${ item.name }` }>
            <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 break-words font-semibold">{ index + 1 }. { item.name } · { item.sku }</h3>
                <Button type="button" color="error" disabled={ disabled } onClick={ onRemove } aria-label={ `Hapus baris ${ index + 1 }` }>Hapus</Button>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <BloomQuantityField { ...field('quantity') }
                    label={ `Jumlah baris ${ index + 1 }` }
                    unitOfMeasure={ item.baseUnitOfMeasure }
                    helperText={ field('quantity').helperText || (item.fractionalQuantityAllowed ? 'Boleh pecahan; maksimal 4 desimal.' : 'Hanya jumlah utuh.') }
                    decrementDisabled={ !!quantityError || !canDecrementQuantityByOne(line.quantity) }
                    onChange={ value => onChange('quantity', value) }
                    onStep={ value => { if (!quantityError && value !== null && !validateReceiptDecimal(value, item.fractionalQuantityAllowed)) onChange('quantity', value); } } />
                <TextField { ...field('purchasePrice') }
                    label={ `Harga beli baris ${ index + 1 } (Rp/${ formatUnitOfMeasure(item.baseUnitOfMeasure) })` }
                    slotProps={ { htmlInput: { inputMode: 'decimal' } } }
                    onChange={ event => onChange('purchasePrice', event.target.value) }
                    helperText={ field('purchasePrice').helperText || 'Harga per satuan dasar; maksimal 4 desimal.' } />
                <TextField { ...field('stockLocation') }
                    select
                    label={ `Lokasi baris ${ index + 1 }` }
                    onChange={ event => onChange('stockLocation', event.target.value) }>
                    <MenuItem value="STORE">Toko (STORE)</MenuItem><MenuItem value="WAREHOUSE">Gudang (WAREHOUSE)</MenuItem>
                </TextField>
            </div>
        </article>
    );
}

ReceiptLineEditor.propTypes = {
    line: PropTypes.object.isRequired, index: PropTypes.number.isRequired, disabled: PropTypes.bool,
    errors: PropTypes.object.isRequired, onChange: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired, fieldRef: PropTypes.func.isRequired
};
