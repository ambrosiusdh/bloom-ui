import { describe, expect, it } from 'vitest';

import { validateTransferQuantity } from '@utils/stock-transfer-utils.js';

describe('stock transfer quantity rules', () => {
    it.each(['0', '0,0000', '-1', '-0.25'])('rejects nonpositive quantity %s with actionable guidance', value => {
        expect(validateTransferQuantity(value, { fractionalQuantityAllowed: true })).toBe('Jumlah transfer harus lebih besar dari 0.');
    });

    it.each(['0.00001', '1,23456'])('rejects excess precision %s without rounding', value => {
        expect(validateTransferQuantity(value, { fractionalQuantityAllowed: true })).toBe('Maksimal 4 angka di belakang tanda desimal.');
    });

    it('accepts exact fractional strings only for eligible items and permits whole quantities with zero fractional digits', () => {
        expect(validateTransferQuantity('0,0001', { fractionalQuantityAllowed: true })).toBe('');
        expect(validateTransferQuantity('1.0000', { fractionalQuantityAllowed: false })).toBe('');
        expect(validateTransferQuantity('0.0001', { fractionalQuantityAllowed: false })).toBe('Barang ini hanya dapat dipindahkan dalam jumlah utuh.');
    });
});
