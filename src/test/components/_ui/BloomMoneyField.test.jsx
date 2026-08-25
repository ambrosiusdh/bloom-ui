import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import PropTypes from 'prop-types';
import { describe, expect, it, vi } from 'vitest';

import BloomMoneyField from '@components/_ui/BloomMoneyField.jsx';
import { render, screen } from '@/test/render.jsx';

function ControlledMoneyField({ onRawValue = () => {}, ...props }) {
    const [value, setValue] = useState('');
    const changeValue = (nextValue, event) => {
        setValue(nextValue);
        onRawValue(nextValue, event);
    };

    return (
        <BloomMoneyField
            label="Nominal"
            value={ value }
            onValueChange={ changeValue }
            { ...props }
        />
    );
}

ControlledMoneyField.propTypes = {
    onRawValue: PropTypes.func,
    groupSeparator: PropTypes.string,
    decimalSeparator: PropTypes.string
};

describe('BloomMoneyField', () => {
    it('adds grouping while keeping a canonical decimal string', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(
            <ControlledMoneyField onRawValue={ onValueChange } />
        );
        const input = screen.getByLabelText('Nominal');

        await user.type(input, '1000000.50');

        expect(input).toHaveValue('1,000,000.50');
        expect(onValueChange).toHaveBeenLastCalledWith('1000000.50', expect.anything());
    });

    it('supports reusable Indonesian separator options without Number conversion', async () => {
        const user = userEvent.setup();
        render(
            <ControlledMoneyField
                groupSeparator="."
                decimalSeparator=","
            />
        );
        const input = screen.getByLabelText('Nominal');

        await user.type(input, '1000000,50');

        expect(input).toHaveValue('1.000.000,50');
    });

    it('preserves multiple decimal separators so validation cannot miss a changed amount', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<ControlledMoneyField onRawValue={ onValueChange } />);
        const input = screen.getByLabelText('Nominal');

        await user.type(input, '500.50.1');

        expect(input).toHaveValue('500.50.1');
        expect(onValueChange).toHaveBeenLastCalledWith('500.50.1', expect.anything());
    });

    it('deletes the preceding digit when Backspace is pressed after a group separator', async () => {
        const user = userEvent.setup();
        render(<ControlledMoneyField />);
        const input = screen.getByLabelText('Nominal');
        await user.type(input, '12345');
        expect(input).toHaveValue('12,345');

        input.setSelectionRange(3, 3);
        await user.keyboard('{Backspace}');

        expect(input).toHaveValue('1,345');
        expect(input.selectionStart).toBe(1);
    });
});
