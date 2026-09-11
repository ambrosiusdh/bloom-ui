import { expect, it, vi } from 'vitest';

const requestApi = vi.hoisted(() => vi.fn());
vi.mock('@api/index.js', () => ({ default: requestApi }));
import { getLegacyDomainErrorCode } from '@api/error-contract.js';
import expenseApi from '@api/expense.js';

it('uses only supported paging and create fields, with a stable key and bounded requests', async () => {
    await expenseApi.getExpenseList({ page: 2, size: 25 });
    expect(requestApi).toHaveBeenLastCalledWith({
        url: '/api/expenses',
        method: 'GET',
        params: { page: 2, size: 25 },
        timeout: 15000
    }, undefined);
    const request = { expectedCashSessionId: 15, amount: '0.0001', category: 'OTHER', description: 'Darurat' };
    await expenseApi.createExpense(request, 'expense-same-key');
    expect(requestApi).toHaveBeenLastCalledWith({
        url: '/api/expenses',
        method: 'POST',
        data: request,
        headers: { 'Idempotency-Key': 'expense-same-key' },
        timeout: 15000
    }, undefined);
    expect(getLegacyDomainErrorCode(409, { errorType: 'ExpenseIdempotencyConflictException' })).toBe('expense_idempotency_conflict');
});

it('forwards read cancellation and loader options separately and returns the backend response', async () => {
    const response = { data: { data: { content: [], totalPages: 0 } } };
    const { signal } = new AbortController();
    const options = { useLoader: false };
    requestApi.mockResolvedValueOnce(response);

    await expect(expenseApi.getExpenseList(undefined, { signal }, options)).resolves.toBe(response);
    expect(requestApi).toHaveBeenLastCalledWith({
        url: '/api/expenses',
        method: 'GET',
        params: { page: 1, size: 10 },
        signal,
        timeout: 15000
    }, options);
});

it('preserves the same payload/key and normalized error when posting with loader options', async () => {
    const request = { expectedCashSessionId: 15, amount: '25', category: 'CHARITY', description: null };
    const options = { useLoader: false };
    const error = Object.assign(new Error('Uncertain'), { category: 'network' });
    requestApi.mockRejectedValueOnce(error);

    await expect(expenseApi.createExpense(request, 'same-key', options)).rejects.toBe(error);
    expect(requestApi).toHaveBeenLastCalledWith({
        url: '/api/expenses',
        method: 'POST',
        data: request,
        headers: { 'Idempotency-Key': 'same-key' },
        timeout: 15000
    }, options);
});
