import { expect, it, vi } from 'vitest';

const requestApi = vi.hoisted(() => vi.fn());
vi.mock('@api/index.js', () => ({ default: requestApi }));
import { getLegacyDomainErrorCode } from '@api/error-contract.js';
import { createExpense, getExpenses } from '@api/expense.js';

it('uses only supported paging and create fields, with a stable key and bounded requests', async () => {
    await getExpenses(2, 25);
    expect(requestApi).toHaveBeenLastCalledWith({ url: '/api/expenses', method: 'GET', params: { page: 2, size: 25 }, timeout: 15000 });
    const request = { expectedCashSessionId: 15, amount: '0.0001', category: 'OTHER', description: 'Darurat' };
    await createExpense(request, 'expense-same-key');
    expect(requestApi).toHaveBeenLastCalledWith({ url: '/api/expenses', method: 'POST', data: request,
        headers: { 'Idempotency-Key': 'expense-same-key' }, timeout: 15000 });
    expect(getLegacyDomainErrorCode(409, { errorType: 'ExpenseIdempotencyConflictException' })).toBe('expense_idempotency_conflict');
});
