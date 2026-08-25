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
    const [rawIntegerPart, ...fractionParts] = permittedValue.split(decimalSeparator);
    const integerPart = rawIntegerPart.replace(/^0+(?=\d)/, '');

    if (!fractionParts.length) {
        return integerPart;
    }

    return [integerPart || '0', ...fractionParts].join('.');
};

export const formatGroupedMoney = (
    value,
    groupSeparator = ',',
    decimalSeparator = '.'
) => {
    if (value === '') return '';

    const canonicalValue = String(value);
    const [integerPart, ...fractionParts] = canonicalValue.split('.');
    const groupedInteger = groupSeparator
        ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
        : integerPart;

    return !fractionParts.length
        ? groupedInteger
        : `${ groupedInteger }${ decimalSeparator }${ fractionParts.join(decimalSeparator) }`;
};

export default function BloomMoneyField({
    value,
    onValueChange,
    groupSeparator = ',',
    decimalSeparator = '.',
    currencySymbol = 'Rp',
    inputRef,
    onKeyDown,
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

    const handleKeyDown = event => {
        onKeyDown?.(event);
        if (event.defaultPrevented
                || event.key !== 'Backspace'
                || !groupSeparator
                || event.target.selectionStart !== event.target.selectionEnd) {
            return;
        }

        const caretPosition = event.target.selectionStart;
        if (caretPosition < 2 || displayValue[caretPosition - 1] !== groupSeparator) {
            return;
        }

        event.preventDefault();
        const removalIndex = caretPosition - 2;
        const nextDisplayValue = `${ displayValue.slice(0, removalIndex) }${
            displayValue.slice(removalIndex + 1)
        }`;
        pendingCaretRef.current = countMeaningfulCharacters(
            nextDisplayValue.slice(0, removalIndex),
            groupSeparator
        );
        onValueChange(
            parseGroupedMoney(nextDisplayValue, groupSeparator, decimalSeparator),
            event
        );
    };

    return (
        <TextField
            { ...textFieldProps }
            value={ displayValue }
            onChange={ changeValue }
            onKeyDown={ handleKeyDown }
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
    onKeyDown: PropTypes.func,
    inputRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({ current: PropTypes.any })
    ]),
    slotProps: PropTypes.object
};
