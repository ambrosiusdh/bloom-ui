import React, { useState, useEffect } from 'react';
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
        onChange = () => {},
        min = 0,
        max = Number.MAX_SAFE_INTEGER,
        step = 1,
        disabled = false,
        className = '',
        inputClassName = '',
        buttonClassName = ''
    } = props;

    const [inputValue, setInputValue] = useState(String(value));

    useEffect(() => {
        setInputValue(String(value));
    }, [value]);

    const handleDecrement = () => {
        if (disabled) return;
        const newValue = Math.max(min, Number(value || 0) - step);
        setInputValue(String(newValue));
        onChange(newValue);
    };

    const handleIncrement = () => {
        if (disabled) return;
        const newValue = Math.min(max, Number(value || 0) + step);
        setInputValue(String(newValue));
        onChange(newValue);
    };

    const handleOnChange = e => {
        // allow only digits while typing (you can extend to allow negative/decimals if needed)
        const raw = e.target.value;
        const sanitized = raw.replace(/[^0-9]/g, '');
        setInputValue(sanitized);
    }

    const handleOnBlur = () => {
        // when leaving the field, clamp and emit numeric value
        const parsed = Number(inputValue || 0);
        const clamped = Math.min(max, Math.max(min, Number.isNaN(parsed) ? 0 : parsed));
        setInputValue(String(clamped));
        onChange(clamped);
    }

    const handleOnKeyDown = e => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    }

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
                value={ inputValue }
                disabled={ disabled }
                className={ `number-input w-16 text-center ${inputClassName}` }
                onChange={ handleOnChange }
                onBlur={ handleOnBlur }
                onKeyDown={ handleOnKeyDown }
                inputProps={ { inputMode: 'numeric' } }
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