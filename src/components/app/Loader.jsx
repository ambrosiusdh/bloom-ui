import { Backdrop, CircularProgress } from "@mui/material";

import { useLoaderStore } from "@stores/index.js";

export default function Loader() {
    const loaderCount = useLoaderStore(state => state.loaderCount);

    return (
        <Backdrop
            className="bloom-loader z-50 text-white"
            open={ !!loaderCount }
        >
            <CircularProgress color="inherit" />
        </Backdrop>
    )
}