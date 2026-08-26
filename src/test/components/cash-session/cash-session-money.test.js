import { describe, expect, it } from 'vitest';

import {
    formatRupiah,
    getMoneySign,
    getVariancePresentation
} from '@components/cash-session/cash-session-money.js';

describe('cash-session money presentation', () => {
    it.each([
        ['0.0000', 0],
        ['-0.0000', 0],
        ['5.0000', 1],
        ['-5.0000', -1]
    ])('reads the sign of %s without floating-point conversion', (value, expectedSign) => {
        expect(getMoneySign(value)).toBe(expectedSign);
    });

    it('keeps signed server variance formatting', () => {
        expect(formatRupiah('-5000.0000')).toBe('-Rp 5.000');
    });

    it.each([
        ['-5.0000', 'Selisih kurang', 'Kurang', 'text-red-700'],
        ['5.0000', 'Selisih lebih', 'Lebih', 'text-amber-700'],
        ['0.0000', 'Selisih (seimbang)', 'Seimbang', 'text-green-700']
    ])('keeps the variance terminology and tone consistent for %s', (
        value,
        label,
        shortLabel,
        amountClass
    ) => {
        expect(getVariancePresentation(value)).toMatchObject({
            label,
            shortLabel,
            amountClass
        });
    });
});
