import { DISMISS_ACTION } from "@constants/snackbar.jsx";

const ITEM_CATEGORY_LIST_MESSAGES = {
    deleteItemCategorySuccess: {
        message: itemCategoryName => `[${itemCategoryName}] berhasil dihapus`,
        options: {
            variant: 'success',
            action: DISMISS_ACTION
        }
    }
}

export {
    ITEM_CATEGORY_LIST_MESSAGES
}