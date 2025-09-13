import { useAppStore, useBreadcrumbStore } from "@stores/index.js";
import { Breadcrumbs, Button, Typography } from "@mui/material";
import { AlignLeftIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
    const toggleExpand = useAppStore(state => state.toggleExpand);
    const breadcrumbs = useBreadcrumbStore(state => state.breadcrumbs);
    const doExpand = () => {
        toggleExpand();
    }

    return (
        <header className="bloom-header h-12 border-b pl-4 flex justify-between items-center">
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
        </header>
    )
}