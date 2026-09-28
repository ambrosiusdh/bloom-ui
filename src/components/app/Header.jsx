import { Link, useLocation } from "react-router-dom";
import { Breadcrumbs, Button, Typography, useMediaQuery } from "@mui/material";
import {
    ArrowLeftIcon,
    MenuIcon,
    PanelLeftCloseIcon,
    PanelLeftOpenIcon
} from "lucide-react";
import PropTypes from "prop-types";

import { useAppStore } from "@stores/index.js";

import AppearanceControl from "./AppearanceControl.jsx";
import { getRouteBreadcrumbs } from "./navigation.js";

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
                    <Typography
                        component="h1"
                        className="font-semibold"
                    >
                        Kasir
                    </Typography>

                    <div className="bloom-header__actions">
                        <Button
                            component={ Link }
                            to={ cashierReturnTo }
                            startIcon={ <ArrowLeftIcon /> }
                        >
                            Kembali ke menu utama
                        </Button>
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
