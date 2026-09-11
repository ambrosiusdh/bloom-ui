import { getMoneySign, validateCashAmount } from '@components/cash-session/cash-session-money.js';

export const EXPENSE_CATEGORIES = {
    STORE_OPERATIONAL: 'Operasional toko', FOOD_AND_DRINK: 'Makanan dan minuman',
    CHARITY: 'Amal', EMERGENCY_PURCHASE: 'Pembelian mendesak',
    OWNER_WITHDRAWAL: 'Penarikan pemilik', OTHER: 'Lainnya'
};

export const hasExpectedExpenseSession = request => Number.isSafeInteger(request?.expectedCashSessionId)
    && request.expectedCashSessionId > 0;

export const expenseRequest = (draft, expectedCashSessionId) => ({
    expectedCashSessionId,
    amount: draft.amount.trim(), category: draft.category, description: draft.description.trim() || null
});

export const validateExpense = draft => ({
    amount: validateCashAmount(draft.amount, 'Nominal pengeluaran')
        || (getMoneySign(draft.amount) <= 0 ? 'Nominal harus lebih dari nol.' : ''),
    category: Object.hasOwn(EXPENSE_CATEGORIES, draft.category) ? '' : 'Pilih kategori pengeluaran.',
    description: (draft.description || '').trim().length > 255 ? 'Alasan / catatan maksimal 255 karakter.'
        : draft.category === 'OTHER' && !draft.description?.trim() ? 'Alasan / catatan wajib untuk kategori Lainnya.' : ''
});
