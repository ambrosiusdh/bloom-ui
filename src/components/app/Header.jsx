import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Breadcrumbs, Button, Typography, useMediaQuery } from "@mui/material";
import {
    ArrowLeftIcon,
    MenuIcon,
    PanelLeftCloseIcon,
    PanelLeftOpenIcon
} from "lucide-react";
import PropTypes from "prop-types";

import CashierSessionControl from "@components/cash-session/CashierSessionControl.jsx";
import { useAppStore } from "@stores/index.js";

import AppearanceControl from "./AppearanceControl.jsx";
import { getRouteBreadcrumbs } from "./navigation.js";

function CashierClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const interval = window.setInterval(() => setNow(new Date()), 60000);
        return () => window.clearInterval(interval);
    }, []);

    const date = new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(now);
    const time = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(now).replace('.', ':');

    return (
        <div className="bloom-header__cashier-clock" aria-label={ `${ date }, ${ time } WIB` }>
            <span>{ date }</span>
            <strong>{ time } WIB</strong>
        </div>
    );
}

export default function Header({ cashierMode = false, navigationToggleRef = null }) {
    const toggleExpand = useAppStore(state => state.toggleExpand);
    const isExpanded = useAppStore(state => state.isExpanded);
    const location = useLocation();
    const isNarrowViewport = useMediaQuery('(max-width: 767px)');
    const breadcrumbs = getRouteBreadcrumbs(location.pathname);
    const cashierReturnTo = location.state?.cashierReturnTo || '/dashboard';

    const doExpand = () => {
        toggleExpand();
    };

    const navigationLabel = isNarrowViewport
        ? (isExpanded ? 'Tutup navigasi utama' : 'Buka navigasi utama')
        : (isExpanded ? 'Ciutkan navigasi utama' : 'Bentangkan navigasi utama');

    const NavigationIcon = isNarrowViewport
        ? MenuIcon
        : (isExpanded ? PanelLeftCloseIcon : PanelLeftOpenIcon);

    return (
        <header className={ `bloom-header ${cashierMode ? 'bloom-header--cashier' : ''}` }>
            { cashierMode ? (
                <>
                    <div className="bloom-header__cashier-start">
                        <Button
                            component={ Link }
                            to={ cashierReturnTo }
                            className="bloom-header__cashier-back"
                            startIcon={ <ArrowLeftIcon /> }
                            aria-label="Kembali ke menu utama"
                        >
                            Menu utama
                        </Button>

                        <div className="bloom-header__cashier-brand">
                            <span className="bloom-header__cashier-mark" aria-hidden="true">B</span>
                            <div>
                                <Typography component="h1" className="font-semibold">
                                    Bloom Kasir
                                </Typography>
                                <span>Ruang transaksi</span>
                            </div>
                        </div>
                    </div>

                    <div className="bloom-header__actions bloom-header__actions--cashier">
                        <CashierSessionControl />
                        <CashierClock />
                        <AppearanceControl />
                    </div>
                </>
            ) : (
                <>
                    <div className="bloom-header__expand flex gap-4 items-center">
                        <Button
                            ref={ navigationToggleRef }
                            id="back-office-navigation-toggle"
                            aria-controls="back-office-navigation"
                            aria-expanded={ isExpanded }
                            aria-label={ navigationLabel }
                            className="bloom-header__navigation-toggle"
                            onClick={ doExpand }
                        >
                            <NavigationIcon aria-hidden="true" />
                        </Button>

                        <Breadcrumbs
                            aria-label="Lokasi halaman"
                            separator="/"
                            className="bloom-header__breadcrumbs"
                        >
                            { breadcrumbs.map((breadcrumb, index) =>
                                typeof breadcrumb === 'object' ? (
                                    <Link
                                        key={ breadcrumb.to }
                                        to={ breadcrumb.to }
                                    >
                                        { breadcrumb.label }
                                    </Link>
                                ) : (
                                    <Typography
                                        key={ `${breadcrumb}-${index}` }
                                        component="span"
                                    >
                                        { breadcrumb }
                                    </Typography>
                                )
                            ) }
                        </Breadcrumbs>
                    </div>

                    <div className="bloom-header__actions">
                        <AppearanceControl />
                    </div>
                </>
            ) }
        </header>
    );
}

Header.propTypes = {
    cashierMode: PropTypes.bool,
    navigationToggleRef: PropTypes.shape({ current: PropTypes.object }),
};
