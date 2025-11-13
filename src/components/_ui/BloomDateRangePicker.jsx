import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';

import { id } from "date-fns/locale"
import PropTypes from "prop-types"
import { DateRangePicker } from 'react-date-range';

import { TextField } from "@mui/material"

import { debounce } from "@utils/general-utils.js"
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

/**
 * https://www.npmjs.com/package/react-date-range
 * ranges
 * {
 *   startDate: PropTypes.object.isRequired,
 *   endDate: PropTypes.object.isRequired,
 *   color: PropTypes.string,
 *   key: PropTypes.string,
 *   autoFocus: PropTypes.bool,
 *   disabled: PropTypes.bool,
 *   showDateDisplay: PropTypes.bool,
 * }
 */

const propTypes = {
    ranges: PropTypes.object.isRequired,
    label: PropTypes.string,
    onChange: PropTypes.func,
};

export default function BloomDateRangePicker(props) {
    const {
        ranges,
        onChange,
        ...otherProps
    } = props;

    const [open, setOpen] = useState(false);
    const [internalRange, setInternalRange] = useState(ranges);

    const pickerRef = useRef(null);

    const toggleDropdown = () => setOpen(prev => !prev);

    const handleOnChange = useCallback((newRanges) => {
        const { selection: dateRangeValue } = newRanges;

        const adjustedEndDate = new Date(dateRangeValue.endDate);
        adjustedEndDate.setHours(23, 59, 59, 999);
        dateRangeValue.endDate = adjustedEndDate;

        setInternalRange(dateRangeValue);
        onChange?.(dateRangeValue);
    }, [onChange]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setInternalRange(ranges);
    }, [ranges]);

    return (
        <div className="bloom-date-range-picker relative inline-block">
            <TextField
                className="bloom-date-range-picker__input"
                label={ props?.label ?? 'Daterange picker' }
                size="small"
                value={ `${internalRange.startDate.toLocaleDateString()} - ${internalRange.endDate.toLocaleDateString()}` }
                slotProps={ {
                    input: {
                        readOnly: true,
                    },
                } }
                onFocus={ toggleDropdown }
            />

            { open && (
                <div
                    ref={ pickerRef }
                    className="absolute z-50 mt-2 shadow-lg border bg-white rounded-lg"
                >
                    <DateRangePicker
                        ranges={ [internalRange] }
                        locale={ id }
                        onChange={ handleOnChange }
                        { ...otherProps }
                    />
                </div>
            ) }
        </div>
    );
}

BloomDateRangePicker.propTypes = propTypes;
