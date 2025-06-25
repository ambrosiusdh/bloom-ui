import { create } from "zustand/react";

const useAppStore = create((set) => ({
    isExpanded: true,
    toggleExpanded: () => set(state => state.isExpanded = !state.isExpanded)
}))

export default useAppStore