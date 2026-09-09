import { IconButton, TextField } from '@mui/material';
import { MinusIcon, PlusIcon } from 'lucide-react';
import PropTypes from 'prop-types';

import { formatUnitOfMeasure } from '@utils/quantity-utils.js';

// Editing mechanics only. The caller decides whether the resulting value is allowed.
const stepDecimal = (draft, direction) => {
    const value = draft.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,4})?$/.test(value)) return null;
    const [whole, fraction = ''] = value.split('.');
    const scaled = BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, '0'))
        + BigInt(direction) * 10000n;
    const absolute = scaled < 0n ? -scaled : scaled;
    const tail = String(absolute % 10000n).padStart(4, '0').replace(/0+$/, '');
    return `${ scaled < 0n ? '-' : '' }${ absolute / 10000n }${ tail ? `.${ tail }` : '' }`;
};

export default function BloomQuantityField({
    value, onChange, onStep, unitOfMeasure, decrementDisabled = false, ...fieldProps
}) {
    const unit = formatUnitOfMeasure(unitOfMeasure);
    const actionLabel = fieldProps.label.replace(/^Jumlah/, 'jumlah');
    const stepButton = direction => (
        <IconButton
            type="button"
            aria-label={ `${ direction === 1 ? 'Tambah' : 'Kurangi' } ${ actionLabel } sebesar 1 ${ unit }` }
            disabled={ fieldProps.disabled || (direction === -1 && decrementDisabled) }
            onMouseDown={ event => event.preventDefault() }
            onClick={ () => onStep(stepDecimal(value, direction)) }
        >
            { direction === 1 ? <PlusIcon aria-hidden="true" /> : <MinusIcon aria-hidden="true" /> }
        </IconButton>
    );
    return (
        <div className="flex min-w-0 items-start gap-1">
            { stepButton(-1) }
            <TextField
                { ...fieldProps }
                className="min-w-0 flex-grow"
                size="small"
                value={ value }
                onChange={ event => onChange(event.target.value) }
                slotProps={ { htmlInput: { inputMode: 'decimal' }, input: { endAdornment: unit } } }
            />
            { stepButton(1) }
        </div>
    );
}

BloomQuantityField.propTypes = {
    value: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired,
    onStep: PropTypes.func.isRequired, unitOfMeasure: PropTypes.string,
    decrementDisabled: PropTypes.bool, label: PropTypes.string.isRequired,
    disabled: PropTypes.bool
};
