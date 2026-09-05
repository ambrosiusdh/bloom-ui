import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import { API_ERROR_CATEGORY } from '@api/index.js';
import { RECEIPT_PRINT_STATUS } from '@constants/receipt-print.js';

export {
    EMPTY_RECEIPT_PRINT_STATE,
    RECEIPT_PRINT_STATUS
} from '@constants/receipt-print.js';

export const getReceiptPrintErrorMessage = error => {
    if (error?.domainCode === API_DOMAIN_ERROR_CODE.PRINTER_NOT_FOUND) {
        return 'Printer yang dikonfigurasi pada server tidak ditemukan. Periksa printer lalu coba lagi.';
    }

    if (error?.domainCode === API_DOMAIN_ERROR_CODE.SALE_NOT_FOUND) {
        return 'Penjualan tidak ditemukan oleh server sehingga struk belum dapat dicetak.';
    }

    if (error?.category === API_ERROR_CATEGORY.NETWORK) {
        return 'Status pencetakan tidak dapat dipastikan karena koneksi ke server terputus. Periksa printer sebelum mencoba lagi.';
    }

    return 'Struk gagal dicetak. Penjualan tidak diubah. Periksa printer lalu coba lagi.';
};

export const getReceiptPrintMessage = printState => {
    if (printState.status === RECEIPT_PRINT_STATUS.PENDING) {
        return 'Permintaan cetak sedang diproses oleh server.';
    }

    if (printState.status === RECEIPT_PRINT_STATUS.SUCCESS) {
        return 'Struk berhasil dicetak.';
    }

    if (printState.status === RECEIPT_PRINT_STATUS.ERROR) {
        return getReceiptPrintErrorMessage(printState.error);
    }

    return '';
};
