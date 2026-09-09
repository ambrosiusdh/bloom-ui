import { describe, expect, it } from 'vitest';

import { isValidDateInput } from '@utils/date-utils.js';

describe('date input validation', () => {
    it.each([
        ['2026-02-28', true],
        ['2026-02-29', false],
        ['2028-02-29', true],
        ['2026-02-31', false]
    ])('validates %s as %s without calendar normalization', (value, expected) => {
        expect(isValidDateInput(value)).toBe(expected);
    });
});
