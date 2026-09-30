import { DISMISS_ACTION } from "@constants/snackbar.jsx";

const ITEM_LIST_MESSAGES = {
    deactivateItemSuccess: {
        message: itemName => `[${itemName}] berhasil dinonaktifkan`,
        options: {
            variant: 'success',
            action: DISMISS_ACTION
        }
    }
}

export {
    ITEM_LIST_MESSAGES
}
