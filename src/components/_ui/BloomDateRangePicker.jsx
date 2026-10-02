import {
    useEffect,
    useId,
    useState
} from 'react';
import {
    Button,
    InputAdornment,
    Popover,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarRange } from 'lucide-react';
import PropTypes from 'prop-types';
import { DateRange } from 'react-date-range';

import { isValidDateInput } from '@utils/date-utils.js';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const toCalendarDate = value => {
    if (!isValidDateInput(value)) return null;

    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
};

const toCanonicalDate = value => {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${ year }-${ month }-${ day }`;
};

const formatDisplayDate = value => {
    const date = toCalendarDate(value);

    return date ? format(date, 'dd MMM yyyy', { locale: id }) : '';
};

const formatRange = (startDate, endDate) => {
    if (startDate && endDate) {
        if (startDate === endDate) return formatDisplayDate(startDate);

        return `${ formatDisplayDate(startDate) } – ${ formatDisplayDate(endDate) }`;
    }
    if (startDate) return `Mulai ${ formatDisplayDate(startDate) }`;
    if (endDate) return `Sampai ${ formatDisplayDate(endDate) }`;

    return '';
};

const createSelection = (startDate, endDate) => {
    const fallback = new Date();
    const start = toCalendarDate(startDate) || toCalendarDate(endDate) || fallback;
    const end = toCalendarDate(endDate) || toCalendarDate(startDate) || start;

    return {
        startDate: start,
        endDate: end,
        key: 'selection'
    };
};

export default function BloomDateRangePicker({
    endDate,
    fullWidth = true,
    helperText = 'Pilih tanggal awal dan akhir.',
    label = 'Rentang tanggal',
    onChange,
    startDate
}) {
    const theme = useTheme();
    const popoverId = useId();
    const [anchorEl, setAnchorEl] = useState(null);
    const [selection, setSelection] = useState(() => createSelection(startDate, endDate));
    const open = Boolean(anchorEl);

    useEffect(() => {
        if (!open) {
            setSelection(createSelection(startDate, endDate));
        }
    }, [endDate, open, startDate]);

    const openPicker = event => {
        setSelection(createSelection(startDate, endDate));
        setAnchorEl(event.currentTarget);
    };

    const closePicker = () => {
        setSelection(createSelection(startDate, endDate));
        setAnchorEl(null);
    };

    const applyRange = () => {
        onChange({
            startDate: toCanonicalDate(selection.startDate),
            endDate: toCanonicalDate(selection.endDate)
        });
        setAnchorEl(null);
    };

    const clearRange = () => {
        onChange({
            startDate: '',
            endDate: ''
        });
        setAnchorEl(null);
    };

    return (
        <>
            <TextField
                fullWidth={ fullWidth }
                label={ label }
                value={ formatRange(startDate, endDate) }
                placeholder="Pilih rentang tanggal"
                helperText={ helperText }
                onClick={ openPicker }
                onKeyDown={ event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openPicker(event);
                    }
                } }
                slotProps={ {
                    input: {
                        readOnly: true,
                        endAdornment: (
                            <InputAdornment position="end">
                                <CalendarRange size={ 20 } aria-hidden="true" />
                            </InputAdornment>
                        )
                    },
                    htmlInput: {
                        'aria-haspopup': 'dialog',
                        'aria-expanded': open,
                        'aria-controls': open ? popoverId : undefined
                    }
                } }
            />
            <Popover
                id={ popoverId }
                open={ open }
                anchorEl={ anchorEl }
                onClose={ closePicker }
                anchorOrigin={ {
                    vertical: 'bottom',
                    horizontal: 'left'
                } }
                transformOrigin={ {
                    vertical: 'top',
                    horizontal: 'left'
                } }
                slotProps={ {
                    paper: {
                        role: 'dialog',
                        'aria-label': `Pilih ${ label.toLowerCase() }`,
                        sx: {
                            mt: 1,
                            maxWidth: 'calc(100vw - 32px)',
                            overflow: 'hidden',
                            border: `1px solid ${ theme.palette.divider }`,
                            backgroundColor: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                            '& .rdrCalendarWrapper': {
                                maxWidth: '100%',
                                backgroundColor: theme.palette.background.paper,
                                color: theme.palette.text.primary
                            },
                            '& .rdrMonth': {
                                width: '20rem',
                                maxWidth: '100%'
                            },
                            '& .rdrMonths': {
                                width: '100%'
                            },
                            '& .rdrMonthAndYearPickers select': {
                                color: theme.palette.text.primary,
                                backgroundColor: theme.palette.background.paper
                            },
                            '& .rdrNextPrevButton': {
                                backgroundColor: theme.palette.action.hover
                            },
                            '& .rdrPprevButton i': {
                                borderRightColor: theme.palette.text.secondary
                            },
                            '& .rdrNextButton i': {
                                borderLeftColor: theme.palette.text.secondary
                            },
                            '& .rdrWeekDay': {
                                color: theme.palette.text.secondary
                            },
                            '& .rdrDayNumber span': {
                                color: theme.palette.text.primary
                            },
                            '& .rdrDayPassive .rdrDayNumber span': {
                                color: theme.palette.text.secondary,
                                opacity: 0.5
                            },
                            '& .rdrDayToday .rdrDayNumber span::after': {
                                backgroundColor: theme.palette.primary.main
                            },
                            '& .rdrDayStart .rdrDayNumber span, & .rdrDayInRange .rdrDayNumber span, & .rdrDayEnd .rdrDayNumber span': {
                                color: theme.palette.primary.contrastText
                            },
                            '& .rdrDayStartPreview, & .rdrDayInPreview, & .rdrDayEndPreview': {
                                borderColor: theme.palette.primary.main
                            }
                        }
                    }
                } }
            >
                <DateRange
                    ranges={ [selection] }
                    locale={ id }
                    rangeColors={ [theme.palette.primary.main] }
                    months={ 1 }
                    direction="horizontal"
                    showDateDisplay={ false }
                    moveRangeOnFirstSelection={ false }
                    onChange={ ranges => setSelection(ranges.selection) }
                />
                <Stack
                    direction={ {
                        xs: 'column',
                        sm: 'row'
                    } }
                    spacing={ 1 }
                    justifyContent="space-between"
                    alignItems={ {
                        xs: 'stretch',
                        sm: 'center'
                    } }
                    sx={ {
                        borderTop: `1px solid ${ theme.palette.divider }`,
                        px: 1.5,
                        py: 1
                    } }
                >
                    <Button type="button" onClick={ clearRange }>Hapus tanggal</Button>
                    <Stack direction="row" spacing={ 1 }>
                        <Button type="button" onClick={ closePicker }>Batal</Button>
                        <Button type="button" variant="contained" onClick={ applyRange }>
                            Pilih rentang
                        </Button>
                    </Stack>
                </Stack>
                <Typography className="sr-only" aria-live="polite">
                    { formatRange(
                        toCanonicalDate(selection.startDate),
                        toCanonicalDate(selection.endDate)
                    ) }
                </Typography>
            </Popover>
        </>
    );
}

BloomDateRangePicker.propTypes = {
    endDate: PropTypes.string,
    fullWidth: PropTypes.bool,
    helperText: PropTypes.string,
    label: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    startDate: PropTypes.string
};
