import { create } from "zustand/react";

const useLoaderStore = create((set) => ({
    loaderCount: 0,
    showLoader: () => set(state => ({ loaderCount: state.loaderCount + 1 })),
    hideLoader: () => set(state => ({ loaderCount: Math.max(state.loaderCount - 1, 0) }))
}))

export default useLoaderStore