import React from 'react';
import PropTypes from "prop-types";
import { IconButton, TextField } from "@mui/material";
import { MinusIcon, PlusIcon } from "lucide-react";

const propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    inputClassName: PropTypes.string,
    buttonClassName: PropTypes.string
}

export function BloomInputNumber (props) {
    const {
        value,
        onChange,
        min = 0,
        max = Number.MAX_SAFE_INTEGER,
        step = 1,
        disabled = false,
        className,
        inputClassName,
        buttonClassName
    } = props;

    const handleDecrement = () => {
        if (disabled) return;
        const newValue = Math.max(min, Number(value || 0) - step);
        onChange(newValue);
    };

    const handleIncrement = () => {
        if (disabled) return;
        const newValue = Math.min(max, Number(value || 0) + step);
        onChange(newValue);
    };

    return (
        <div className={ `bloom-input-number flex items-center gap-2 ${className}` }>
            <IconButton
                size="small"
                onClick={ handleDecrement }
                disabled={ disabled || Number(value) <= min }
                className={ `decrement-button ${buttonClassName}` }
            >
                <MinusIcon />
            </IconButton>

            <TextField
                size="small"
                value={ value }
                disabled={ disabled }
                className={ `number-input w-16 text-center ${inputClassName}` }
                slotProps={ { input: { readOnly: true } } }
            />

            <IconButton
                size="small"
                onClick={ handleIncrement }
                disabled={ disabled || Number(value) >= max }
                className={ `increment-button ${buttonClassName}` }
            >
                <PlusIcon />
            </IconButton>
        </div>
    );
}

BloomInputNumber.propTypes = propTypes;