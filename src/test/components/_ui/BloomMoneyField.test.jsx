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
});
