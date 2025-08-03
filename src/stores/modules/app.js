import { create } from "zustand/react";

const useAppStore = create((set) => ({
    isExpanded: true,
    toggleExpand: () => set(state => ({ isExpanded: !state.isExpanded }))
}))

export default useAppStore