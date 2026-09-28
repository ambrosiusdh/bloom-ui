import { matchPath } from "react-router-dom";
import {
    ClipboardCheckIcon,
    HandCoinsIcon,
    HistoryIcon,
    LayoutDashboardIcon,
    PackageSearchIcon,
    ReceiptTextIcon,
    TagsIcon,
    TruckIcon,
    UsersIcon,
    WalletCardsIcon
} from "lucide-react";

export const navigationGroups = [
    {
        id: 'navigation-summary',
        label: 'Ringkasan',
        items: [
            {
                to: '/dashboard',
                icon: LayoutDashboardIcon,
                label: 'Dashboard',
                matchPaths: ['/dashboard']
            }
        ]
    },
    {
        id: 'navigation-inventory',
        label: 'Persediaan',
        items: [
            {
                to: '/items',
                icon: PackageSearchIcon,
                label: 'Data Barang',
                matchPaths: ['/items', '/items/*']
            },
            {
                to: '/item-categories',
                icon: TagsIcon,
                label: 'Kategori Barang',
                matchPaths: ['/item-categories', '/item-categories/*']
            },
            {
                to: '/goods-receipts',
                icon: TruckIcon,
                label: 'Penerimaan Barang',
                matchPaths: ['/goods-receipts', '/goods-receipts/*']
            },
            {
                to: '/stock-adjustments',
                icon: ClipboardCheckIcon,
                label: 'Penyesuaian Stok',
                matchPaths: ['/stock-adjustments', '/stock-adjustments/*']
            },
            {
                to: '/stock-movements',
                icon: HistoryIcon,
                label: 'Pergerakan stok',
                matchPaths: ['/stock-movements', '/stock-transfers/new']
            }
        ]
    },
    {
        id: 'navigation-procurement',
        label: 'Pembelian',
        items: [
            {
                to: '/suppliers',
                icon: UsersIcon,
                label: 'Pemasok',
                matchPaths: ['/suppliers', '/suppliers/*']
            },
            {
                to: '/payables',
                icon: HandCoinsIcon,
                label: 'Utang Pemasok',
                matchPaths: ['/payables']
            }
        ]
    },
    {
        id: 'navigation-sales',
        label: 'Penjualan',
        items: [
            {
                to: '/sales',
                icon: ReceiptTextIcon,
                label: 'Riwayat Penjualan',
                matchPaths: ['/sales', '/sales/*']
            }
        ]
    },
    {
        id: 'navigation-cash',
        label: 'Kas',
        items: [
            {
                to: '/cash-sessions',
                icon: HistoryIcon,
                label: 'Riwayat Sesi Kas',
                matchPaths: ['/cash-sessions', '/cash-sessions/*']
            },
            {
                to: '/expenses',
                icon: WalletCardsIcon,
                label: 'Pengeluaran',
                matchPaths: ['/expenses', '/expenses/*']
            }
        ]
    }
];

const routeBreadcrumbs = [
    {
        path: '/dashboard',
        breadcrumbs: ['Ringkasan', 'Dashboard']
    },
    {
        path: '/items/new',
        breadcrumbs: ['Persediaan', { to: '/items', label: 'Data Barang' }, 'Tambah barang']
    },
    {
        path: '/items/:sku/edit',
        breadcrumbs: ['Persediaan', { to: '/items', label: 'Data Barang' }, 'Ubah barang']
    },
    {
        path: '/items',
        breadcrumbs: ['Persediaan', 'Data Barang']
    },
    {
        path: '/item-categories/new',
        breadcrumbs: ['Persediaan', { to: '/item-categories', label: 'Kategori Barang' }, 'Tambah kategori']
    },
    {
        path: '/item-categories/:code/edit',
        breadcrumbs: ['Persediaan', { to: '/item-categories', label: 'Kategori Barang' }, 'Ubah kategori']
    },
    {
        path: '/item-categories',
        breadcrumbs: ['Persediaan', 'Kategori Barang']
    },
    {
        path: '/goods-receipts/new',
        breadcrumbs: ['Persediaan', { to: '/goods-receipts', label: 'Penerimaan Barang' }, 'Buat penerimaan']
    },
    {
        path: '/goods-receipts/:code',
        breadcrumbs: ['Persediaan', { to: '/goods-receipts', label: 'Penerimaan Barang' }, 'Detail penerimaan']
    },
    {
        path: '/goods-receipts',
        breadcrumbs: ['Persediaan', 'Penerimaan Barang']
    },
    {
        path: '/stock-adjustments/new',
        breadcrumbs: ['Persediaan', { to: '/stock-adjustments', label: 'Penyesuaian Stok' }, 'Buat penyesuaian']
    },
    {
        path: '/stock-adjustments/:code',
        breadcrumbs: ['Persediaan', { to: '/stock-adjustments', label: 'Penyesuaian Stok' }, 'Detail penyesuaian']
    },
    {
        path: '/stock-adjustments',
        breadcrumbs: ['Persediaan', 'Penyesuaian Stok']
    },
    {
        path: '/stock-transfers/new',
        breadcrumbs: ['Persediaan', { to: '/stock-movements', label: 'Pergerakan stok' }, 'Buat transfer stok']
    },
    {
        path: '/stock-movements',
        breadcrumbs: ['Persediaan', 'Pergerakan stok']
    },
    {
        path: '/suppliers/maintenance/new',
        breadcrumbs: ['Pembelian', { to: '/suppliers', label: 'Pemasok' }, 'Tambah pemasok']
    },
    {
        path: '/suppliers/:code/edit',
        breadcrumbs: ['Pembelian', { to: '/suppliers', label: 'Pemasok' }, 'Ubah pemasok']
    },
    {
        path: '/suppliers/:code',
        breadcrumbs: ['Pembelian', { to: '/suppliers', label: 'Pemasok' }, 'Detail pemasok']
    },
    {
        path: '/suppliers',
        breadcrumbs: ['Pembelian', 'Pemasok']
    },
    {
        path: '/payables',
        breadcrumbs: ['Pembelian', 'Utang Pemasok']
    },
    {
        path: '/sales/:code',
        breadcrumbs: ['Penjualan', { to: '/sales', label: 'Riwayat Penjualan' }, 'Detail penjualan']
    },
    {
        path: '/sales',
        breadcrumbs: ['Penjualan', 'Riwayat Penjualan']
    },
    {
        path: '/cash-sessions/:sessionId',
        breadcrumbs: ['Kas', { to: '/cash-sessions', label: 'Riwayat Sesi Kas' }, 'Detail sesi kas']
    },
    {
        path: '/cash-sessions',
        breadcrumbs: ['Kas', 'Riwayat Sesi Kas']
    },
    {
        path: '/expenses/new',
        breadcrumbs: ['Kas', { to: '/expenses', label: 'Pengeluaran' }, 'Catat pengeluaran']
    },
    {
        path: '/expenses',
        breadcrumbs: ['Kas', 'Pengeluaran']
    }
];

export const getRouteBreadcrumbs = pathname => {
    const route = routeBreadcrumbs.find(candidate => matchPath({
        path: candidate.path,
        end: true
    }, pathname));

    return route?.breadcrumbs || ['Halaman tidak ditemukan'];
};

export const isNavigationItemSelected = (item, pathname) => item.matchPaths.some(path => matchPath({
    path,
    end: true
}, pathname));
