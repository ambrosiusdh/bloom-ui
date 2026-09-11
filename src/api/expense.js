import api from '@api/index.js';

export const EXPENSE_TIMEOUT_MS = 15000;

export const getExpenses = (page = 1, size = 10) => api({
    url: '/api/expenses', method: 'GET', params: { page, size }, timeout: EXPENSE_TIMEOUT_MS
});

export const createExpense = (request, key) => api({
    url: '/api/expenses', method: 'POST', data: request,
    headers: { 'Idempotency-Key': key }, timeout: EXPENSE_TIMEOUT_MS
});
