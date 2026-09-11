import {
    getMoneySign,
    validateCashAmount
} from '@components/cash-session/cash-session-money.js';

export const EXPENSE_CATEGORIES = {
    STORE_OPERATIONAL: 'Operasional toko',
    FOOD_AND_DRINK: 'Makanan dan minuman',
    CHARITY: 'Amal',
    EMERGENCY_PURCHASE: 'Pembelian mendesak',
    OWNER_WITHDRAWAL: 'Penarikan pemilik',
    OTHER: 'Lainnya'
};

export const canVoidExpense = record => record?.canVoid === true && record.voidBlockReason === null && record.voided === false;
export const expenseVoidEligibility = record => {
    if (canVoidExpense(record)) {
        return 'Dapat dibatalkan menurut server.';
    }

    if (record?.voidBlockReason === 'ALREADY_VOIDED') {
        return 'Sudah dibatalkan. Catatan audit tetap tersimpan.';
    }

    if (record?.voidBlockReason === 'CASH_SESSION_CLOSED') {
        return 'Sesi kas sudah ditutup. Pembatalan setelah tutup kas tidak tersedia.';
    }

    return 'Kelayakan pembatalan belum dapat dipastikan. Muat ulang data.';
};

// Compare decimal representations without floating-point arithmetic or rounding.
const canonicalExpenseAmount = value => {
    const text = String(value ?? '').trim();
    if (!/^\d+(?:\.\d+)?$/.test(text)) {
        return null;
    }

    const [whole, fraction = ''] = text.split('.');
    return `${ whole.replace(/^0+(?=\d)/, '') }.${ fraction.replace(/0+$/, '') }`;
};

export const validExpenseVoidRecord = (record, original) => {
    const amount = canonicalExpenseAmount(record?.amount);

    return record?.id === original.id
        && record.cashSessionId === original.cashSessionId
        && amount !== null
        && amount === canonicalExpenseAmount(original.amount)
        && !!record.category
        && record.category === original.category
        && (record.description ?? null) === (original.description ?? null)
        && record.operationalExpense === original.operationalExpense
        && !!record.createdAt
        && record.createdAt === original.createdAt
        && !!record.createdBy
        && record.createdBy === original.createdBy
        && typeof record.voided === 'boolean'
        && (!record.voided || (!!record.voidedReason && !!record.voidedAt && !!record.voidedBy))
        && (!original.voided || (record.voided
            && record.voidedReason === original.voidedReason
            && record.voidedAt === original.voidedAt
            && record.voidedBy === original.voidedBy));
};

export const validateExpenseVoidReason = reason => !reason.trim() ? 'Alasan pembatalan wajib diisi.'
    : reason.length > 255 ? 'Alasan pembatalan maksimal 255 karakter.' : '';

export const hasExpectedExpenseSession = request => Number.isSafeInteger(request?.expectedCashSessionId)
    && request.expectedCashSessionId > 0;

export const expenseRequest = (draft, expectedCashSessionId) => ({
    expectedCashSessionId,
    amount: draft.amount.trim(),
    category: draft.category,
    description: draft.description.trim() || null
});

export const validateExpense = draft => ({
    amount: validateCashAmount(draft.amount, 'Nominal pengeluaran')
        || (getMoneySign(draft.amount) <= 0 ? 'Nominal harus lebih dari nol.' : ''),
    category: Object.hasOwn(EXPENSE_CATEGORIES, draft.category) ? '' : 'Pilih kategori pengeluaran.',
    description: (draft.description || '').trim().length > 255 ? 'Alasan / catatan maksimal 255 karakter.'
        : draft.category === 'OTHER' && !draft.description?.trim() ? 'Alasan / catatan wajib untuk kategori Lainnya.' : ''
});
