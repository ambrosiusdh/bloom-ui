import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Route, Routes } from 'react-router-dom';

import Header from '@/components/app/Header.jsx';
import { render, screen } from '@/test/render.jsx';

describe('cashier header', () => {
    it('provides a keyboard-reachable route back to the back office', async () => {
        const user = userEvent.setup();

        render(
            <Routes>
                <Route
                    path="/cashier"
                    element={ <Header cashierMode /> }
                />
                <Route
                    path="/dashboard"
                    element={ <p>Dashboard</p> }
                />
            </Routes>,
            { route: '/cashier' }
        );

        const backOfficeLink = screen.getByRole('link', { name: 'Kembali ke back office' });

        await user.tab();

        expect(backOfficeLink).toHaveFocus();

        await user.keyboard('{Enter}');

        expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    });
});
