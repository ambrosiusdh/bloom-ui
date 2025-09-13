import { useBreadcrumbStore } from "@stores/index.js";
import { useEffect } from "react";

export function Dashboard() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);

    useEffect(() => {
        setBreadcrumbs(['Dashboard']);
    }, [])

    return (
        <div className="dashboard">
            dashboard
        </div>
    )
}