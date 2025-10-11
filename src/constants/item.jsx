import { DISMISS_ACTION } from "@constants/snackbar.jsx";

const ITEM_LIST_MESSAGES = {
    deleteItemSuccess: {
        message: itemName => `[${itemName}] berhasil dihapus`,
        options: {
            variant: 'success',
            action: DISMISS_ACTION
        }
    }
}

export {
    ITEM_LIST_MESSAGES
}