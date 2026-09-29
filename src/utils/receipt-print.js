import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import { API_ERROR_CATEGORY } from '@api/index.js';
import { RECEIPT_PRINT_STATUS } from '@constants/receipt-print.js';

export {
    EMPTY_RECEIPT_PRINT_STATE,
    RECEIPT_PRINT_STATUS
} from '@constants/receipt-print.js';

export const getReceiptPrintErrorMessage = error => {
    if (error?.domainCode === API_DOMAIN_ERROR_CODE.PRINTER_NOT_FOUND) {
        return 'Layanan cetak tidak menemukan printer yang dikonfigurasi. Periksa printer lalu coba lagi.';
    }

    if (error?.domainCode === API_DOMAIN_ERROR_CODE.SALE_NOT_FOUND) {
        return 'Layanan cetak tidak menemukan penjualan ini sehingga permintaan belum dapat diproses.';
    }

    if (error?.category === API_ERROR_CATEGORY.NETWORK) {
        return 'Status permintaan cetak tidak dapat dipastikan karena koneksi ke server terputus. Periksa printer sebelum mencoba lagi.';
    }

    return 'Layanan cetak tidak mengonfirmasi permintaan. Penjualan tidak diubah; periksa printer lalu coba lagi.';
};

export const getReceiptPrintMessage = printState => {
    if (printState.status === RECEIPT_PRINT_STATUS.PENDING) {
        return 'Struk sedang dikirim ke layanan cetak.';
    }

    if (printState.status === RECEIPT_PRINT_STATUS.SUCCESS) {
        return 'Permintaan cetak diterima oleh layanan. Periksa hasil pada printer.';
    }

    if (printState.status === RECEIPT_PRINT_STATUS.ERROR) {
        return getReceiptPrintErrorMessage(printState.error);
    }

    return '';
};
