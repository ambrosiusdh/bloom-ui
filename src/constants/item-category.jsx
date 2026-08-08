import { DISMISS_ACTION } from "@constants/snackbar.jsx";

const ITEM_CATEGORY_LIST_MESSAGES = {
    deactivateItemCategorySuccess: {
        message: itemCategoryName => `[${itemCategoryName}] berhasil dinonaktifkan`,
        options: {
            variant: 'success',
            action: DISMISS_ACTION
        }
    }
}

export {
    ITEM_CATEGORY_LIST_MESSAGES
}
