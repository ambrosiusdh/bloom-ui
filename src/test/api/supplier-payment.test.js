import { expect, it, vi } from 'vitest';

const requestApi = vi.hoisted(() => vi.fn());
vi.mock('@api/index.js', () => ({ default: requestApi }));
import { getLegacyDomainErrorCode } from '@api/error-contract.js';
import { createSupplierPayment } from '@api/supplier-payment.js';

it('encodes one receipt and posts only the supplied payment intent and stable key', async () => {
    const request = { amount: '0.0001', paymentMethod: 'QRIS', paidAt: '2026-09-10T02:00:00Z' };
    await createSupplierPayment('GR/28', request, 'same-key');
    expect(requestApi).toHaveBeenCalledWith({ url: '/api/goods-receipts/GR%2F28/payments', method: 'POST',
        data: request, headers: { 'Idempotency-Key': 'same-key' }, timeout: 15000 });
    expect(getLegacyDomainErrorCode(409, { errorType: 'SupplierPaymentIdempotencyConflictException' })).toBe('supplier_payment_idempotency_conflict');
    expect(getLegacyDomainErrorCode(409, { errorType: 'SupplierPaymentConflictException' })).toBe('supplier_payment_conflict');
});
