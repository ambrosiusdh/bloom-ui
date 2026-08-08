import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useAppStore from '@stores/modules/app.js';
import useAuthStore from '@stores/modules/auth.js';
import Header from '@/components/app/Header.jsx';
import Sidebar from '@/components/app/Sidebar.jsx';
import { render } from '@/test/render.jsx';

const originalMatchMedia = window.matchMedia;

const setNarrowViewport = matches => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn()
    }));
};

function LocationProbe() {
    const location = useLocation();

    return <output aria-label="Current path">{ location.pathname }</output>;
}

function NavigationShell() {
    const navigationToggleRef = useRef(null);

    return (
        <>
            <Sidebar navigationToggleRef={ navigationToggleRef } />
            <Header navigationToggleRef={ navigationToggleRef } />
        </>
    );
}

describe('back-office navigation', () => {
    beforeEach(() => {
        setNarrowViewport(false);
        useAppStore.setState({ isExpanded: true });
        useAuthStore.setState({
            currentUser: { name: 'Budi', role: 'ADMIN' },
            authStatus: 'authenticated'
        });
    });

    afterEach(() => {
        window.matchMedia = originalMatchMedia;
        useAppStore.setState({ isExpanded: true });
        useAuthStore.setState({ currentUser: null, authStatus: 'checking' });
        vi.clearAllMocks();
    });

    it('groups and labels only destinations backed by existing routes', () => {
        render(<Sidebar />, { route: '/dashboard' });

        const navigation = screen.getByRole('navigation', { name: 'Destinasi back office' });

        expect(within(navigation).getByRole('heading', { name: 'Ringkasan' })).toBeInTheDocument();
        expect(within(navigation).getByRole('heading', { name: 'Persediaan' })).toBeInTheDocument();
        expect(within(navigation).getByRole('heading', { name: 'Penjualan' })).toBeInTheDocument();

        expect(within(navigation).getAllByRole('link').map(link => link.getAttribute('href'))).toEqual([
            '/dashboard',
            '/items',
            '/item-categories',
            '/goods-receipts',
            '/stock-adjustments',
            '/sales'
        ]);
        expect(screen.getByRole('link', { name: 'Kasir' })).toHaveAttribute('href', '/cashier');
        expect(screen.getByRole('button', { name: 'Keluar' })).toBeInTheDocument();
        expect(screen.queryByText(/supplier|utang|pengeluaran/i)).not.toBeInTheDocument();
    });

    it('marks a destination active throughout its existing child routes', () => {
        render(<Sidebar />, { route: '/items/BRG-001/edit' });

        expect(screen.getByRole('link', { name: 'Data Barang' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    });

    it('keeps collapsed destinations named and keyboard operable', async () => {
        const user = userEvent.setup();
        useAppStore.setState({ isExpanded: false });

        render(
            <>
                <Sidebar />
                <LocationProbe />
            </>,
            { route: '/dashboard' }
        );

        const salesLink = screen.getByRole('link', { name: 'Riwayat Penjualan' });

        expect(salesLink).toHaveAttribute('title', 'Riwayat Penjualan');
        expect(screen.getByRole('button', { name: 'Keluar' })).toHaveAttribute('title', 'Keluar');

        salesLink.focus();
        await user.keyboard('{Enter}');

        expect(screen.getByRole('status', { name: 'Current path' })).toHaveTextContent('/sales');
    });

    it('opens and closes the narrow drawer with focus containment and restoration', async () => {
        const user = userEvent.setup();
        setNarrowViewport(true);

        render(
            <NavigationShell />,
            { route: '/dashboard' }
        );

        const sidebar = document.querySelector('#back-office-navigation');

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Buka navigasi back office' })).toHaveAttribute('aria-expanded', 'false');
        });
        expect(sidebar).toHaveAttribute('aria-hidden', 'true');
        expect(sidebar).toHaveAttribute('inert');
        expect(sidebar).toHaveClass('bloom__sidebar--collapsed');

        await user.click(screen.getByRole('button', { name: 'Buka navigasi back office' }));

        const dashboardLink = await screen.findByRole('link', { name: 'Dashboard' });
        await waitFor(() => expect(dashboardLink).toHaveFocus());
        expect(sidebar).not.toHaveClass('bloom__sidebar--collapsed');
        expect(screen.getByRole('dialog', { name: 'Navigasi back office' })).toBeInTheDocument();

        const logoutButton = screen.getByRole('button', { name: 'Keluar' });
        const drawerCloseButton = within(sidebar).getByRole('button', { name: 'Tutup navigasi back office' });

        logoutButton.focus();
        await user.tab();
        expect(drawerCloseButton).toHaveFocus();

        await user.keyboard('{Escape}');

        const openButton = screen.getByRole('button', { name: 'Buka navigasi back office' });
        expect(openButton).toHaveFocus();
        expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    });
});
