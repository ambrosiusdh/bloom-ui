import PropTypes from "prop-types";

import { Link } from "react-router-dom";

import { Breadcrumbs, Button, Typography } from "@mui/material";

import { AlignLeftIcon, ArrowLeftIcon } from "lucide-react";

import { useAppStore, useBreadcrumbStore } from "@stores/index.js";

export default function Header({ cashierMode = false }) {
    const toggleExpand = useAppStore(state => state.toggleExpand);
    const breadcrumbs = useBreadcrumbStore(state => state.breadcrumbs);
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
                        to="/dashboard"
                        startIcon={ <ArrowLeftIcon /> }
                    >
                        Kembali ke back office
                    </Button>
                </>
            ) : (
                <div className="bloom-header__expand flex gap-4 items-center">
                    <Button
                        variant="contained"
                        onClick={ doExpand }>
                        <AlignLeftIcon />
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
};
