import { create } from "zustand/react";

const useBreadcrumbStore = create((set) => ({
    breadcrumbs: [],
    setBreadcrumbs: (newBreadcrumbs) => set({ breadcrumbs: newBreadcrumbs })
}))

export default useBreadcrumbStore