import { expect, it, vi } from 'vitest';

const requestApi = vi.hoisted(() => vi.fn());
vi.mock('@api/index.js', () => ({ default: requestApi }));
import { getLegacyDomainErrorCode } from '@api/error-contract.js';
import supplierPaymentApi from '@api/supplier-payment.js';

it('encodes one receipt and posts only the supplied payment intent and stable key', async () => {
    const request = { amount: '0.0001', paymentMethod: 'QRIS', paidAt: '2026-09-10T02:00:00Z' };
    const response = { data: { data: { id: 28, receiptCode: 'GR/28' } } };
    const options = { useLoader: false };
    requestApi.mockResolvedValueOnce(response);

    await expect(supplierPaymentApi.createSupplierPayment('GR/28', request, 'same-key', options)).resolves.toBe(response);
    expect(requestApi).toHaveBeenLastCalledWith({
        url: '/api/goods-receipts/GR%2F28/payments',
        method: 'POST',
        data: request,
        headers: { 'Idempotency-Key': 'same-key' },
        timeout: 15000
    }, options);
    expect(getLegacyDomainErrorCode(409, { errorType: 'SupplierPaymentIdempotencyConflictException' })).toBe('supplier_payment_idempotency_conflict');
    expect(getLegacyDomainErrorCode(409, { errorType: 'SupplierPaymentConflictException' })).toBe('supplier_payment_conflict');
});

it('propagates an uncertain submission error without retrying or replacing the request key', async () => {
    requestApi.mockClear();
    const error = Object.assign(new Error('Uncertain'), { category: 'network' });
    const request = { amount: '25', paymentMethod: 'BANK_TRANSFER', paidAt: '2026-09-10T02:00:00Z' };
    requestApi.mockRejectedValueOnce(error);

    await expect(supplierPaymentApi.createSupplierPayment('GR-28', request, 'same-key')).rejects.toBe(error);
    expect(requestApi).toHaveBeenCalledTimes(1);
    expect(requestApi).toHaveBeenLastCalledWith({
        url: '/api/goods-receipts/GR-28/payments',
        method: 'POST',
        data: request,
        headers: { 'Idempotency-Key': 'same-key' },
        timeout: 15000
    }, undefined);
});
