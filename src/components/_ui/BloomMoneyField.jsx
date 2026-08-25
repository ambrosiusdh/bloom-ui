import {
    useLayoutEffect,
    useRef
} from 'react';
import { InputAdornment, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const countMeaningfulCharacters = (value, groupSeparator) => Array.from(value)
    .filter(character => character !== groupSeparator).length;

const getCaretPosition = (value, meaningfulCharacterCount, groupSeparator) => {
    if (meaningfulCharacterCount <= 0) return 0;

    let seenCharacters = 0;
    for (let index = 0; index < value.length; index += 1) {
        if (value[index] !== groupSeparator) {
            seenCharacters += 1;
        }
        if (seenCharacters === meaningfulCharacterCount) {
            return index + 1;
        }
    }
    return value.length;
};

export const parseGroupedMoney = (
    displayValue,
    groupSeparator = ',',
    decimalSeparator = '.'
) => {
    const ungroupedValue = groupSeparator
        ? displayValue.split(groupSeparator).join('')
        : displayValue;
    const permittedValue = Array.from(ungroupedValue)
        .filter(character => /\d/.test(character) || character === decimalSeparator)
        .join('');
    const decimalIndex = permittedValue.indexOf(decimalSeparator);

    if (decimalIndex < 0) {
        return permittedValue.replace(/^0+(?=\d)/, '');
    }

    const integerPart = permittedValue
        .slice(0, decimalIndex)
        .replace(/^0+(?=\d)/, '');
    const fractionPart = permittedValue
        .slice(decimalIndex + decimalSeparator.length)
        .split(decimalSeparator)
        .join('');

    return `${ integerPart || '0' }.${ fractionPart }`;
};

export const formatGroupedMoney = (
    value,
    groupSeparator = ',',
    decimalSeparator = '.'
) => {
    if (value === '') return '';

    const canonicalValue = String(value);
    const decimalIndex = canonicalValue.indexOf('.');
    const integerPart = decimalIndex < 0
        ? canonicalValue
        : canonicalValue.slice(0, decimalIndex);
    const fractionPart = decimalIndex < 0
        ? null
        : canonicalValue.slice(decimalIndex + 1);
    const groupedInteger = groupSeparator
        ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
        : integerPart;

    return fractionPart === null
        ? groupedInteger
        : `${ groupedInteger }${ decimalSeparator }${ fractionPart }`;
};

export default function BloomMoneyField({
    value,
    onValueChange,
    groupSeparator = ',',
    decimalSeparator = '.',
    currencySymbol = 'Rp',
    inputRef,
    slotProps,
    ...textFieldProps
}) {
    const internalInputRef = useRef(null);
    const pendingCaretRef = useRef(null);
    const displayValue = formatGroupedMoney(value, groupSeparator, decimalSeparator);

    const assignInputRef = node => {
        internalInputRef.current = node;
        if (typeof inputRef === 'function') {
            inputRef(node);
        } else if (inputRef) {
            inputRef.current = node;
        }
    };

    useLayoutEffect(() => {
        if (pendingCaretRef.current === null || !internalInputRef.current) return;

        const caretPosition = getCaretPosition(
            displayValue,
            pendingCaretRef.current,
            groupSeparator
        );
        internalInputRef.current.setSelectionRange(caretPosition, caretPosition);
        pendingCaretRef.current = null;
    }, [displayValue, groupSeparator]);

    const changeValue = event => {
        const caretPosition = event.target.selectionStart ?? event.target.value.length;
        pendingCaretRef.current = countMeaningfulCharacters(
            event.target.value.slice(0, caretPosition),
            groupSeparator
        );
        onValueChange(
            parseGroupedMoney(event.target.value, groupSeparator, decimalSeparator),
            event
        );
    };

    return (
        <TextField
            { ...textFieldProps }
            value={ displayValue }
            onChange={ changeValue }
            inputRef={ assignInputRef }
            slotProps={ {
                ...slotProps,
                input: {
                    ...slotProps?.input,
                    startAdornment: slotProps?.input?.startAdornment ?? (currencySymbol ? (
                        <InputAdornment position="start">{ currencySymbol }</InputAdornment>
                    ) : undefined)
                },
                htmlInput: {
                    inputMode: 'decimal',
                    ...slotProps?.htmlInput
                }
            } }
        />
    );
}

BloomMoneyField.propTypes = {
    value: PropTypes.string.isRequired,
    onValueChange: PropTypes.func.isRequired,
    groupSeparator: PropTypes.string,
    decimalSeparator: PropTypes.string,
    currencySymbol: PropTypes.node,
    inputRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({ current: PropTypes.any })
    ]),
    slotProps: PropTypes.object
};
