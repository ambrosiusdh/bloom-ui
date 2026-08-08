import { create } from "zustand/react";

const useAppStore = create((set) => ({
    isExpanded: true,
    closeNavigation: () => set({ isExpanded: false }),
    toggleExpand: () => set(state => ({ isExpanded: !state.isExpanded }))
}))

export default useAppStore
