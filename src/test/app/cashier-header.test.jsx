import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import Header from '@/components/app/Header.jsx';
import theme from '@/themes/index.js';

describe('cashier header', () => {
    it('returns to the originating page with its query values by keyboard', async () => {
        const user = userEvent.setup();

        render(
            <ThemeProvider theme={ theme }>
                <MemoryRouter
                    initialEntries={ [{
                        pathname: '/cashier',
                        state: { cashierReturnTo: '/sales?period=today' }
                    }] }
                >
                    <Routes>
                        <Route
                            path="/cashier"
                            element={ <Header cashierMode /> }
                        />
                        <Route
                            path="/sales"
                            element={ <p>Riwayat penjualan</p> }
                        />
                    </Routes>
                </MemoryRouter>
            </ThemeProvider>
        );

        const returnLink = screen.getByRole('link', { name: 'Kembali ke menu utama' });

        await user.tab();

        expect(returnLink).toHaveFocus();
        expect(returnLink).toHaveAttribute('href', '/sales?period=today');

        await user.keyboard('{Enter}');

        expect(await screen.findByText('Riwayat penjualan')).toBeInTheDocument();
    });
});
