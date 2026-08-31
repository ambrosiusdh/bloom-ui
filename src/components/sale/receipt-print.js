import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import { API_ERROR_CATEGORY } from '@api/index.js';

export const RECEIPT_PRINT_STATUS = Object.freeze({
    IDLE: 'idle',
    PENDING: 'pending',
    SUCCESS: 'success',
    ERROR: 'error'
});

export const getReceiptPrintErrorMessage = error => {
    if (error?.domainCode === API_DOMAIN_ERROR_CODE.PRINTER_NOT_FOUND) {
        return 'Printer yang dikonfigurasi pada server tidak ditemukan. Periksa printer lalu coba lagi.';
    }

    if (error?.domainCode === API_DOMAIN_ERROR_CODE.SALE_NOT_FOUND) {
        return 'Penjualan tidak ditemukan oleh server. Muat ulang detail penjualan sebelum mencoba lagi.';
    }

    if (error?.category === API_ERROR_CATEGORY.NETWORK) {
        return 'Status pencetakan tidak dapat dipastikan karena koneksi ke server terputus. Periksa printer sebelum mencoba lagi.';
    }

    return 'Struk gagal dicetak. Penjualan tidak diubah. Periksa printer lalu coba lagi.';
};
