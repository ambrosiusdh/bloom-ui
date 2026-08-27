import { describe, expect, it } from 'vitest';

import {
    formatQuantity,
    formatUnitOfMeasure,
    incrementQuantityByOne,
    isQuantityAboveAvailability,
    normalizeQuantity,
    validateQuantity
} from '@utils/quantity-utils.js';

describe('quantity formatting', () => {
    it('uses Indonesian decimal separators and preserves meaningful fractional digits', () => {
        expect(formatQuantity('12.5000', 'METER')).toBe('12,5 meter');
        expect(formatQuantity('0.0001', 'KILOGRAM')).toBe('0,0001 kg');
    });

    it('does not force four trailing zeros for whole quantities', () => {
        expect(formatQuantity('4.0000', 'PIECE')).toBe('4 pcs');
        expect(formatUnitOfMeasure('LITER')).toBe('liter');
    });

    it('keeps a missing backend value visibly distinct from an actual zero', () => {
        expect(formatQuantity(null, 'PIECE')).toBe('-');
        expect(formatQuantity('0.0000', 'PIECE')).toBe('0 pcs');
    });

    it('validates and normalizes whole and fractional editing strings without floating-point math', () => {
        expect(validateQuantity('0,1250', true)).toBe('');
        expect(normalizeQuantity('0,1250')).toBe('0.125');
        expect(validateQuantity('1.5', false)).toBe('Barang ini hanya dapat dijual dalam jumlah utuh.');
        expect(validateQuantity('1.0000', false)).toBe('');
        expect(validateQuantity('0', true)).toBe('Masukkan jumlah lebih dari 0.');
        expect(validateQuantity('1.12345', true)).toBe('Jumlah maksimal memiliki 4 angka desimal.');
    });

    it('increments duplicates and compares advisory availability as scaled decimal strings', () => {
        expect(incrementQuantityByOne('0.125')).toBe('1.125');
        expect(incrementQuantityByOne('999999999999999999.9999')).toBe('1000000000000000000.9999');
        expect(isQuantityAboveAvailability('1.0001', '1.0000')).toBe(true);
        expect(isQuantityAboveAvailability('0.5', '0.5000')).toBe(false);
    });
});
