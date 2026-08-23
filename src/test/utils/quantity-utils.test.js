import { describe, expect, it } from 'vitest';

import { formatQuantity, formatUnitOfMeasure } from '@utils/quantity-utils.js';

describe('quantity formatting', () => {
    it('uses Indonesian decimal separators and preserves meaningful fractional digits', () => {
        expect(formatQuantity('12.5000', 'METER')).toBe('12,5 meter');
        expect(formatQuantity('0.0001', 'KILOGRAM')).toBe('0,0001 kg');
    });

    it('does not force four trailing zeros for whole quantities', () => {
        expect(formatQuantity('4.0000', 'PIECE')).toBe('4 pcs');
        expect(formatUnitOfMeasure('LITER')).toBe('liter');
    });
});
