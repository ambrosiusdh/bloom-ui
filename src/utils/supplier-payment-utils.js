import {
    getMoneySign,
    validateCashAmount
} from '@components/cash-session/cash-session-money.js';

export const SUPPLIER_PAYMENT_METHODS = {
    BANK_TRANSFER: 'Transfer bank',
    QRIS: 'QRIS',
    CASH: 'Tunai (CASH)'
};

export const paymentRequest = (draft, paidAt) => ({
    amount: draft.amount.trim(),
    paymentMethod: draft.paymentMethod,
    paidAt,
    reference: draft.reference?.trim() || null,
    note: draft.note?.trim() || null
});

export const validatePayment = draft => validateCashAmount(draft.amount, 'Nominal pembayaran')
    || (getMoneySign(draft.amount) <= 0 ? 'Nominal pembayaran harus lebih dari nol.' : '')
    || (!Object.hasOwn(SUPPLIER_PAYMENT_METHODS, draft.paymentMethod) ? 'Pilih metode pembayaran.' : '')
    || (draft.reference?.trim().length > 255 || draft.note?.trim().length > 255
        ? 'Referensi dan catatan maksimal 255 karakter.' : '');
