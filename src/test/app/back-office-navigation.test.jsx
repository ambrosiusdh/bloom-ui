import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useAppStore from '@stores/modules/app.js';
import useAuthStore from '@stores/modules/auth.js';
import useBreadcrumbStore from '@stores/modules/breadcrumb.js';
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
        useBreadcrumbStore.setState({ breadcrumbs: [] });
        useAuthStore.setState({
            currentUser: { name: 'Budi', role: 'ADMIN' },
            authStatus: 'authenticated'
        });
    });

    afterEach(() => {
        window.matchMedia = originalMatchMedia;
        useAppStore.setState({ isExpanded: true });
        useBreadcrumbStore.setState({ breadcrumbs: [] });
        useAuthStore.setState({ currentUser: null, authStatus: 'checking' });
        vi.clearAllMocks();
    });

    it('groups and labels only destinations backed by existing routes', () => {
        render(<Sidebar />, { route: '/dashboard' });

        const navigation = screen.getByRole('navigation', { name: 'Destinasi utama' });

        expect(within(navigation).getByRole('heading', { name: 'Ringkasan' })).toBeInTheDocument();
        expect(within(navigation).getByRole('heading', { name: 'Persediaan' })).toBeInTheDocument();
        expect(within(navigation).getByRole('heading', { name: 'Pembelian' })).toBeInTheDocument();
        expect(within(navigation).getByRole('heading', { name: 'Penjualan' })).toBeInTheDocument();
        expect(within(navigation).getByRole('heading', { name: 'Kas' })).toBeInTheDocument();

        expect(within(navigation).getAllByRole('link').map(link => link.getAttribute('href'))).toEqual([
            '/dashboard',
            '/items',
            '/item-categories',
            '/goods-receipts',
            '/stock-adjustments',
            '/stock-movements',
            '/suppliers',
            '/payables',
            '/sales',
            '/cash-sessions',
            '/expenses'
        ]);
        expect(within(navigation).getByRole('link', { name: 'Pergerakan stok' }))
            .toHaveAttribute('href', '/stock-movements');
        expect(within(navigation).getByRole('link', { name: 'Sesi kas' }))
            .toHaveAttribute('href', '/cash-sessions');
        expect(within(navigation).queryByRole('link', { name: 'Buat transfer stok' }))
            .not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Buka Kasir' })).toHaveAttribute('href', '/cashier');
        expect(screen.getByRole('button', { name: 'Keluar akun' })).toBeInTheDocument();
        expect(within(navigation).getByRole('link', { name: 'Utang Pemasok' }))
            .toHaveAttribute('href', '/payables');
        expect(within(navigation).getByRole('link', { name: 'Pengeluaran' }))
            .toHaveAttribute('href', '/expenses');
        expect(screen.getByRole('group', { name: 'Akun saat ini' })).toHaveTextContent('BudiAdministrator');
        expect(screen.queryByText('Back office', { exact: false })).not.toBeInTheDocument();
    });

    it('marks a destination active throughout its existing child routes', () => {
        render(<Sidebar />, { route: '/items/BRG-001/edit' });

        expect(screen.getByRole('link', { name: 'Data Barang' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    });

    it('selects the combined stock navigation destination from each existing route', () => {
        const view = render(<Sidebar />, { route: '/stock-movements' });

        expect(screen.getByRole('link', { name: 'Pergerakan stok' }))
            .toHaveAttribute('aria-current', 'page');

        view.unmount();
        render(<Sidebar />, { route: '/stock-transfers/new' });

        expect(screen.getByRole('link', { name: 'Pergerakan stok' }))
            .toHaveAttribute('aria-current', 'page');
    });

    it('derives breadcrumbs from the current route instead of retained page state', () => {
        useBreadcrumbStore.setState({ breadcrumbs: ['Cashier'] });

        render(<Header />, { route: '/stock-transfers/new' });

        const breadcrumbs = screen.getByRole('navigation', { name: 'Lokasi halaman' });

        expect(screen.getByRole('button', { name: 'Tampilan aplikasi: Terang' }))
            .toBeInTheDocument();
        expect(within(breadcrumbs).getByText('Persediaan')).toBeInTheDocument();
        expect(within(breadcrumbs).getByRole('link', { name: 'Pergerakan stok' }))
            .toHaveAttribute('href', '/stock-movements');
        expect(within(breadcrumbs).getByText('Buat transfer stok')).toBeInTheDocument();
        expect(within(breadcrumbs).queryByText('Cashier')).not.toBeInTheDocument();
    });

    it('links item-category create and edit breadcrumbs back to the category list', () => {
        const createView = render(<Header />, { route: '/item-categories/new' });
        let breadcrumbs = screen.getByRole('navigation', { name: 'Lokasi halaman' });

        expect(within(breadcrumbs).getByRole('link', { name: 'Kategori Barang' }))
            .toHaveAttribute('href', '/item-categories');
        expect(within(breadcrumbs).getByText('Tambah kategori')).toBeInTheDocument();

        createView.unmount();
        render(<Header />, { route: '/item-categories/KAIN/edit' });
        breadcrumbs = screen.getByRole('navigation', { name: 'Lokasi halaman' });

        expect(within(breadcrumbs).getByRole('link', { name: 'Kategori Barang' }))
            .toHaveAttribute('href', '/item-categories');
        expect(within(breadcrumbs).getByText('Ubah kategori')).toBeInTheDocument();
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
        expect(screen.getByRole('button', { name: 'Keluar akun' })).toHaveAttribute('title', 'Keluar akun');

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
            expect(screen.getByRole('button', { name: 'Buka navigasi utama' })).toHaveAttribute('aria-expanded', 'false');
        });
        expect(sidebar).toHaveAttribute('aria-hidden', 'true');
        expect(sidebar).toHaveAttribute('inert');
        expect(sidebar).toHaveClass('bloom__sidebar--collapsed');

        await user.click(screen.getByRole('button', { name: 'Buka navigasi utama' }));

        const dashboardLink = await screen.findByRole('link', { name: 'Dashboard' });
        await waitFor(() => expect(dashboardLink).toHaveFocus());
        expect(sidebar).not.toHaveClass('bloom__sidebar--collapsed');
        expect(screen.getByRole('dialog', { name: 'Navigasi utama' })).toBeInTheDocument();

        const logoutButton = screen.getByRole('button', { name: 'Keluar akun' });
        const drawerCloseButton = within(sidebar).getByRole('button', { name: 'Tutup navigasi utama' });

        logoutButton.focus();
        await user.tab();
        expect(drawerCloseButton).toHaveFocus();

        await user.keyboard('{Escape}');

        const openButton = screen.getByRole('button', { name: 'Buka navigasi utama' });
        expect(openButton).toHaveFocus();
        expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    });

    it('collapses the wide shell without hiding destination names', async () => {
        const user = userEvent.setup();

        render(<NavigationShell />, { route: '/dashboard' });

        await user.click(screen.getByRole('button', { name: 'Ciutkan navigasi utama' }));

        expect(document.querySelector('#back-office-navigation'))
            .toHaveClass('bloom__sidebar--collapsed');
        expect(screen.getByRole('button', { name: 'Bentangkan navigasi utama' }))
            .toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('link', { name: 'Riwayat Penjualan' }))
            .toHaveAttribute('title', 'Riwayat Penjualan');
    });
});
