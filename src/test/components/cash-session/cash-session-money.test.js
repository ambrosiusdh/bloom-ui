import { describe, expect, it } from 'vitest';

import {
    formatRupiah,
    getMoneySign
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
});
