import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { expect, it, vi } from 'vitest';

import BloomDateRangePicker from '@components/_ui/BloomDateRangePicker.jsx';
import theme, { getBloomTheme } from '@/themes/index.js';
import {
    render,
    screen,
    within
} from '@/test/render.jsx';

const dateRangeProps = vi.hoisted(() => ({ current: null }));

vi.mock('react-date-range', () => ({
    DateRange: props => {
        dateRangeProps.current = props;

        return (
            <button
                type="button"
                onClick={ () => props.onChange({
                    selection: {
                        startDate: new Date(2026, 8, 3),
                        endDate: new Date(2026, 8, 5),
                        key: 'selection'
                    }
                }) }
            >
                Pilih 3–5 September
            </button>
        );
    }
}));

function RangeHarness({ onChange }) {
    const [range, setRange] = useState({
        startDate: '2026-09-01',
        endDate: '2026-09-12'
    });

    return (
        <BloomDateRangePicker
            label="Rentang tanggal"
            startDate={ range.startDate }
            endDate={ range.endDate }
            onChange={ nextRange => {
                onChange(nextRange);
                setRange(nextRange);
            } }
        />
    );
}

RangeHarness.propTypes = {
    onChange: PropTypes.func.isRequired
};

it('uses one read-only, themed range control with explicit cancel, apply, and clear actions', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<RangeHarness onChange={ onChange } />);

    const input = screen.getByRole('textbox', { name: 'Rentang tanggal' });
    expect(input).toHaveValue('01 Sep 2026 – 12 Sep 2026');
    expect(input).toHaveAttribute('readonly');

    await user.click(input);
    let dialog = screen.getByRole('dialog', { name: 'Pilih rentang tanggal' });
    expect(dateRangeProps.current.rangeColors).toEqual([theme.palette.primary.main]);
    expect(dateRangeProps.current.locale.code).toBe('id');

    await user.click(within(dialog).getByRole('button', { name: 'Pilih 3–5 September' }));
    await user.click(within(dialog).getByRole('button', { name: 'Batal' }));
    expect(input).toHaveValue('01 Sep 2026 – 12 Sep 2026');
    expect(onChange).not.toHaveBeenCalled();

    await user.click(input);
    dialog = screen.getByRole('dialog', { name: 'Pilih rentang tanggal' });
    await user.click(within(dialog).getByRole('button', { name: 'Pilih 3–5 September' }));
    await user.click(within(dialog).getByRole('button', { name: 'Pilih rentang' }));
    expect(onChange).toHaveBeenLastCalledWith({
        startDate: '2026-09-03',
        endDate: '2026-09-05'
    });
    expect(input).toHaveValue('03 Sep 2026 – 05 Sep 2026');

    await user.click(input);
    dialog = screen.getByRole('dialog', { name: 'Pilih rentang tanggal' });
    await user.click(within(dialog).getByRole('button', { name: 'Hapus tanggal' }));
    expect(onChange).toHaveBeenLastCalledWith({
        startDate: '',
        endDate: ''
    });
    expect(input).toHaveValue('');
});

it('uses the active dark-mode primary color for calendar selection', async () => {
    const user = userEvent.setup();
    const darkTheme = getBloomTheme('dark');

    render(
        <ThemeProvider theme={ darkTheme }>
            <RangeHarness onChange={ vi.fn() } />
        </ThemeProvider>
    );

    await user.click(screen.getByRole('textbox', { name: 'Rentang tanggal' }));

    expect(dateRangeProps.current.rangeColors).toEqual([darkTheme.palette.primary.main]);
});
