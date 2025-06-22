import { create } from "zustand/react";

const useAppStore = create((set) => ({
    isExpanded: false,
    toggleExpanded: () => set(state => state.isExpanded = !state.isExpanded)
}))

export default useAppStore