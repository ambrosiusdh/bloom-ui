import api from '@api/index.js';
import { EXPENSE } from '@api/path/index.js';

export const EXPENSE_TIMEOUT_MS = 15000;

const getExpenseList = async (params = { page: 1, size: 10 }, config, options) => {
    return api({
        ...config,
        url: EXPENSE.list,
        method: 'GET',
        params,
        timeout: EXPENSE_TIMEOUT_MS
    }, options);
};

const createExpense = async (payload, idempotencyKey, options) => {
    return api({
        url: EXPENSE.create,
        method: 'POST',
        data: payload,
        headers: { 'Idempotency-Key': idempotencyKey },
        timeout: EXPENSE_TIMEOUT_MS
    }, options);
};

export default {
    getExpenseList,
    createExpense
};
