import { closeSnackbar } from "notistack";

import { IconButton } from "@mui/material";

import { XIcon } from "lucide-react";

const DISMISS_ACTION = snackbarId => (
    <>
        <IconButton onClick={ () => { closeSnackbar(snackbarId) } }>
            <XIcon className="text-white"/>
        </IconButton>
    </>
)

export {
    DISMISS_ACTION
}