import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "@mui/material";
import {
    ClipboardCheckIcon,
    HandCoinsIcon,
    HistoryIcon,
    LayoutDashboardIcon,
    LogOutIcon,
    PackageSearchIcon,
    ReceiptTextIcon,
    TagsIcon,
    TruckIcon,
    UserIcon,
    XIcon
} from "lucide-react";
import PropTypes from "prop-types";

import { useAppStore, useAuthStore } from "@stores/index.js";

import SidebarItem from "./sidebar/SidebarItem.jsx";

const navigationGroups = [
    {
        id: 'navigation-summary',
        label: 'Ringkasan',
        items: [
            { to: '/dashboard', icon: LayoutDashboardIcon, label: 'Dashboard', end: true }
        ]
    },
    {
        id: 'navigation-inventory',
        label: 'Persediaan',
        items: [
            { to: '/items', icon: PackageSearchIcon, label: 'Data Barang' },
            { to: '/item-categories', icon: TagsIcon, label: 'Kategori Barang' },
            { to: '/goods-receipts', icon: TruckIcon, label: 'Penerimaan Barang' },
            { to: '/stock-adjustments', icon: ClipboardCheckIcon, label: 'Penyesuaian Stok' },
            { to: '/stock-movements', icon: HistoryIcon, label: 'Riwayat Pergerakan Stok' }
        ]
    },
    {
        id: 'navigation-sales',
        label: 'Penjualan',
        items: [
            { to: '/sales', icon: ReceiptTextIcon, label: 'Riwayat Penjualan' }
        ]
    }
];

export default function Sidebar({ navigationToggleRef = null }) {
    const isExpanded = useAppStore(state => state.isExpanded);
    const closeNavigation = useAppStore(state => state.closeNavigation);
    const currentUser = useAuthStore(state => state.currentUser);
    const doLogout = useAuthStore(state => state.doLogout);
    const location = useLocation();
    const isNarrowViewport = useMediaQuery('(max-width: 767px)');
    const previousIsNarrowViewport = useRef(false);
    const previousIsExpanded = useRef(isExpanded);
    const firstNavigationItemRef = useRef(null);

    useEffect(() => {
        if (isNarrowViewport && !previousIsNarrowViewport.current) {
            closeNavigation();
        }

        previousIsNarrowViewport.current = isNarrowViewport;
    }, [closeNavigation, isNarrowViewport]);

    useEffect(() => {
        if (isNarrowViewport && isExpanded && !previousIsExpanded.current) {
            firstNavigationItemRef.current?.focus();
        }

        previousIsExpanded.current = isExpanded;
    }, [isExpanded, isNarrowViewport]);

    const handleClose = () => {
        closeNavigation();
        navigationToggleRef?.current?.focus();
    };

    const handleNavigate = () => {
        if (isNarrowViewport) {
            closeNavigation();
        }
    };

    const handleKeyDown = event => {
        if (!isNarrowViewport || !isExpanded) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            handleClose();
            return;
        }

        if (event.key !== 'Tab') {
            return;
        }

        const focusableElements = [...event.currentTarget.querySelectorAll('a, button:not([disabled])')];
        const firstElement = focusableElements[0];
        const lastElement = focusableElements.at(-1);

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
        }
    };

    const handleLogout = async () => {
        await doLogout();
    };

    return (
        <>
            { isExpanded && (
                <button
                    type="button"
                    className="bloom__navigation-backdrop"
                    aria-label="Tutup navigasi back office"
                    onClick={ handleClose }
                />
            ) }

            <aside
                id="back-office-navigation"
                className={ `bloom__sidebar ${isExpanded ? '' : 'bloom__sidebar--collapsed'} min-h-screen bg-maroon-600 text-white flex flex-col justify-between border-r border-gray-300 transition-all duration-300` }
                role={ isNarrowViewport ? 'dialog' : undefined }
                aria-modal={ isNarrowViewport && isExpanded ? 'true' : undefined }
                aria-labelledby="back-office-navigation-title"
                aria-hidden={ isNarrowViewport && !isExpanded ? 'true' : undefined }
                inert={ isNarrowViewport && !isExpanded ? true : undefined }
                onKeyDown={ handleKeyDown }
            >
                <div>
                    <div className="flex items-center gap-3 px-4 h-16 border-b mb-4 pb-2">
                        <UserIcon
                            aria-hidden="true"
                            className="w-10 h-10 rounded-full shrink-0"
                        />

                        <div className={ isExpanded ? 'min-w-0' : 'sr-only' }>
                            <div className="font-semibold truncate">{ currentUser?.name }</div>
                            <div className="text-xs truncate">{ currentUser?.role }</div>
                        </div>

                        <button
                            type="button"
                            className="ml-auto p-2 rounded text-white hover:bg-maroon-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
                            aria-label="Tutup navigasi back office"
                            onClick={ handleClose }
                        >
                            <XIcon aria-hidden="true" />
                        </button>
                    </div>

                    <h2
                        id="back-office-navigation-title"
                        className="sr-only"
                    >
                        Navigasi back office
                    </h2>

                    <nav
                        className="px-4 space-y-5"
                        aria-label="Destinasi back office"
                    >
                        { navigationGroups.map((group, groupIndex) => (
                            <section
                                key={ group.id }
                                aria-labelledby={ group.id }
                            >
                                <h3
                                    id={ group.id }
                                    className={ `${isExpanded ? 'px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-white/80' : 'sr-only'}` }
                                >
                                    { group.label }
                                </h3>

                                <div className="space-y-2">
                                    { group.items.map((item, itemIndex) => (
                                        <SidebarItem
                                            key={ item.to }
                                            { ...item }
                                            itemRef={ groupIndex === 0 && itemIndex === 0 ? firstNavigationItemRef : null }
                                            isExpanded={ isExpanded }
                                            onClick={ handleNavigate }
                                        />
                                    )) }
                                </div>
                            </section>
                        )) }
                    </nav>
                </div>

                <div className="px-4 py-4 space-y-2 border-t border-white/20">
                    <SidebarItem
                        to="/cashier"
                        state={ { cashierReturnTo: `${location.pathname}${location.search}${location.hash}` } }
                        icon={ HandCoinsIcon }
                        label="Kasir"
                        isExpanded={ isExpanded }
                        onClick={ handleNavigate }
                        end
                    />

                    <SidebarItem
                        onClick={ handleLogout }
                        icon={ LogOutIcon }
                        label="Keluar"
                        isExpanded={ isExpanded }
                    />
                </div>
            </aside>
        </>
    );
}

Sidebar.propTypes = {
    navigationToggleRef: PropTypes.shape({ current: PropTypes.object }),
};
