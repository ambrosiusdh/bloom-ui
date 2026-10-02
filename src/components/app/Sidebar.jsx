import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "@mui/material";
import {
    LogOutIcon,
    ShoppingCartIcon,
    XIcon
} from "lucide-react";
import PropTypes from "prop-types";

import { useAppStore, useAuthStore } from "@stores/index.js";

import {
    isNavigationItemSelected,
    navigationGroups
} from "./navigation.js";
import SidebarItem from "./sidebar/SidebarItem.jsx";

const getInitials = currentUser => {
    const accountName = currentUser?.name || currentUser?.username || 'Bloom';

    return accountName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('');
};

const getRoleLabel = role => {
    if (role === 'ADMIN') {
        return 'Administrator';
    }

    return role || 'Pengguna';
};

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

    const currentUserName = currentUser?.name || currentUser?.username || 'Pengguna Bloom';

    return (
        <>
            { isExpanded && (
                <button
                    type="button"
                    className="bloom__navigation-backdrop"
                    aria-label="Tutup navigasi utama"
                    onClick={ handleClose }
                />
            ) }

            <aside
                id="back-office-navigation"
                className={ `bloom__sidebar ${isExpanded ? '' : 'bloom__sidebar--collapsed'}` }
                role={ isNarrowViewport ? 'dialog' : undefined }
                aria-modal={ isNarrowViewport && isExpanded ? 'true' : undefined }
                aria-labelledby="back-office-navigation-title"
                aria-hidden={ isNarrowViewport && !isExpanded ? 'true' : undefined }
                inert={ isNarrowViewport && !isExpanded ? true : undefined }
                onKeyDown={ handleKeyDown }
            >
                <div className="bloom__sidebar-brand">
                    <div className="bloom__sidebar-mark" aria-hidden="true">
                        <img
                            src="/bloom-mark.png"
                            alt=""
                            width="42"
                            height="42"
                        />
                    </div>
                    <div className={ isExpanded ? 'bloom__sidebar-brand-copy' : 'sr-only' }>
                        <span className="bloom__sidebar-brand-name">Bloom</span>
                    </div>

                    <button
                        type="button"
                        className="bloom__sidebar-close"
                        aria-label="Tutup navigasi utama"
                        onClick={ handleClose }
                    >
                        <XIcon aria-hidden="true" />
                    </button>
                </div>

                <div className="bloom__sidebar-navigation">
                    <h2
                        id="back-office-navigation-title"
                        className="sr-only"
                    >
                        Navigasi utama
                    </h2>

                    <nav
                        aria-label="Destinasi utama"
                    >
                        { navigationGroups.map((group, groupIndex) => (
                            <section
                                key={ group.id }
                                aria-labelledby={ group.id }
                            >
                                <h3
                                    id={ group.id }
                                    className={ isExpanded ? 'bloom__sidebar-group-title' : 'sr-only' }
                                >
                                    { group.label }
                                </h3>

                                <div className="bloom__sidebar-group-items">
                                    { group.items.map((item, itemIndex) => (
                                        <SidebarItem
                                            key={ item.to }
                                            { ...item }
                                            itemRef={ groupIndex === 0 && itemIndex === 0 ? firstNavigationItemRef : null }
                                            isExpanded={ isExpanded }
                                            isSelected={ isNavigationItemSelected(item, location.pathname) }
                                            onClick={ handleNavigate }
                                        />
                                    )) }
                                </div>
                            </section>
                        )) }
                    </nav>
                </div>

                <div className="bloom__sidebar-footer">
                    <SidebarItem
                        to="/cashier"
                        state={ { cashierReturnTo: `${location.pathname}${location.search}${location.hash}` } }
                        icon={ ShoppingCartIcon }
                        label="Buka Kasir"
                        isExpanded={ isExpanded }
                        isSelected={ false }
                        onClick={ handleNavigate }
                    />

                    <div className="bloom__sidebar-account" role="group" aria-label="Akun saat ini">
                        <div className="bloom__sidebar-avatar" aria-hidden="true">
                            { getInitials(currentUser) }
                        </div>

                        <div className={ isExpanded ? 'bloom__sidebar-account-copy' : 'sr-only' }>
                            <span className="bloom__sidebar-account-name">{ currentUserName }</span>
                            <span className="bloom__sidebar-account-role">{ getRoleLabel(currentUser?.role) }</span>
                        </div>

                        <button
                            type="button"
                            className="bloom__sidebar-logout"
                            aria-label="Keluar akun"
                            title={ isExpanded ? undefined : 'Keluar akun' }
                            onClick={ handleLogout }
                        >
                            <LogOutIcon aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

Sidebar.propTypes = {
    navigationToggleRef: PropTypes.shape({ current: PropTypes.object }),
};
