import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import BloomQuantityField from '@components/_ui/BloomQuantityField.jsx';
import { fireEvent, render, screen } from '@/test/render.jsx';

it('preserves raw decimal drafts and steps exactly without floating point or a zero policy', async () => {
    const user = userEvent.setup();
    const step = vi.fn();
    const Harness = () => {
        const [value, setValue] = useState('0,50');
        return <BloomQuantityField label="Jumlah kain"
            value={ value }
            unitOfMeasure="METER"
            onChange={ setValue }
            onStep={ next => { step(next); if (next !== null) setValue(next); } } />;
    };
    render(<Harness />);
    const input = screen.getByRole('textbox', { name: 'Jumlah kain' });
    expect(input).toHaveValue('0,50');
    await user.click(screen.getByRole('button', { name: 'Tambah jumlah kain sebesar 1 meter' }));
    expect(input).toHaveValue('1.5');
    fireEvent.change(input, { target: { value: '999999999999998,9999' } });
    await user.click(screen.getByRole('button', { name: /Tambah/ }));
    expect(step).toHaveBeenLastCalledWith('999999999999999.9999');
    fireEvent.change(input, { target: { value: '1.0000' } });
    await user.click(screen.getByRole('button', { name: /Kurangi/ }));
    expect(step).toHaveBeenLastCalledWith('0');
    fireEvent.change(input, { target: { value: '0,' } });
    await user.click(screen.getByRole('button', { name: /Tambah/ }));
    expect(input).toHaveValue('0,');
    expect(step).toHaveBeenLastCalledWith(null);
    await user.click(screen.getByRole('button', { name: /Kurangi/ }));
    screen.getByRole('button', { name: /Kurangi/ }).focus();
    await user.tab();
    expect(input).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: /Tambah/ })).toHaveFocus();
});
