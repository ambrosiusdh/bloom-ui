import { useEffect } from "react";

import { useBreadcrumbStore } from "@stores/index.js";

export default function Dashboard() {
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