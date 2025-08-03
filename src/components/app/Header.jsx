import { useAppStore } from "@stores/index.js";
import { Button } from "@mui/material";
import { AlignLeftIcon } from "lucide-react";

export default function Header() {
    const toggleExpand = useAppStore(state => state.toggleExpand);

    const doExpand = () => {
        toggleExpand();
    }

    return (
        <header className="bloom-header h-12 border-b pl-4 flex justify-between items-center">
            <div className="bloom-header__expand">
                <Button
                    variant="contained"
                    onClick={ doExpand }>
                    <AlignLeftIcon />
                </Button>
            </div>
        </header>
    )
}