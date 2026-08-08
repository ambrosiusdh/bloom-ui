import { Link, useLocation } from "react-router-dom";
import { Breadcrumbs, Button, Typography } from "@mui/material";
import { AlignLeftIcon, ArrowLeftIcon } from "lucide-react";
import PropTypes from "prop-types";

import { useAppStore, useBreadcrumbStore } from "@stores/index.js";

export default function Header({ cashierMode = false, navigationToggleRef = null }) {
    const toggleExpand = useAppStore(state => state.toggleExpand);
    const isExpanded = useAppStore(state => state.isExpanded);
    const breadcrumbs = useBreadcrumbStore(state => state.breadcrumbs);
    const location = useLocation();
    const cashierReturnTo = location.state?.cashierReturnTo || '/dashboard';
    const doExpand = () => {
        toggleExpand();
    }

    return (
        <header className={ `bloom-header h-12 border-b flex justify-between items-center ${cashierMode ? 'px-4' : 'pl-4'}` }>
            { cashierMode ? (
                <>
                    <Typography
                        component="h1"
                        className="font-semibold"
                    >
                        Kasir
                    </Typography>

                    <Button
                        component={ Link }
                        to={ cashierReturnTo }
                        startIcon={ <ArrowLeftIcon /> }
                    >
                        Kembali ke menu utama
                    </Button>
                </>
            ) : (
                <div className="bloom-header__expand flex gap-4 items-center">
                    <Button
                        ref={ navigationToggleRef }
                        id="back-office-navigation-toggle"
                        variant="contained"
                        aria-controls="back-office-navigation"
                        aria-expanded={ isExpanded }
                        aria-label={ isExpanded ? 'Tutup navigasi back office' : 'Buka navigasi back office' }
                        onClick={ doExpand }
                    >
                        <AlignLeftIcon aria-hidden="true" />
                    </Button>

                    <Breadcrumbs aria-label="breadcrumb">
                        { breadcrumbs.map((breadcrumb, index) =>
                            breadcrumb?.to ? (
                                <Link
                                    key={ index }
                                    underline="hover"
                                    color="inherit"
                                    to={ breadcrumb.to }
                                >
                                    { breadcrumb.label }
                                </Link>
                            ) : (
                                <Typography
                                    key={ index }
                                >
                                    { breadcrumb }
                                </Typography>
                            )
                        ) }
                    </Breadcrumbs>
                </div>
            ) }
        </header>
    )
}

Header.propTypes = {
    cashierMode: PropTypes.bool,
    navigationToggleRef: PropTypes.shape({ current: PropTypes.object }),
};
