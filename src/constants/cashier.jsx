import { DISMISS_ACTION } from "@constants/snackbar.jsx";

const CASHIER_ACTION_MESSAGE = {
    addItemToCartSuccess: {
        message: itemName => `[${itemName}] berhasil dimasukkan kedalam keranjang`,
        options: {
            variant: 'success',
            action: DISMISS_ACTION
        }
    },

    addItemCartWithMaxQuantity: {
        message: itemName => `[${itemName}] sudah mencapai quantity`,
        options: {
            variant: 'error',
            action: DISMISS_ACTION
        }
    },

    scanItemSuccess: {
        message: itemName => `[${itemName}] berhasil dimasukkan kedalam keranjang`,
        options: {
            variant: 'error',
            action: DISMISS_ACTION
        }
    },

    scanItemNotFound: {
        message: itemCode => `Kode barang [${itemCode}] tidak ditemukan `,
        options: {
            variant: 'error',
            action: DISMISS_ACTION
        }
    }
}

export {
    CASHIER_ACTION_MESSAGE
}