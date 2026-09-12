import { describe, expect, it } from 'vitest';

import {
    createStockAdjustmentPayload,
    hasStockAdjustmentErrors,
    validateAdjustmentQuantity,
    validateStockAdjustment
} from '@utils/stock-adjustment-utils.js';

const fractionalItem = {
    sku: 'KAIN-1',
    fractionalQuantityAllowed: true
};
const wholeItem = {
    sku: 'BENANG-1',
    fractionalQuantityAllowed: false
};

describe('stock adjustment request validation', () => {
    it('accepts zero only for CORRECTION and normalizes decimal commas', () => {
        expect(validateAdjustmentQuantity('0', fractionalItem, 'CORRECTION')).toBe('');
        expect(validateAdjustmentQuantity('0,0000', fractionalItem, 'ADD'))
            .toContain('lebih besar dari 0');

        expect(createStockAdjustmentPayload('  Hitung fisik  ', [{
            item: fractionalItem,
            stockLocation: 'WAREHOUSE',
            actionType: 'CORRECTION',
            changeQuantity: '1,2500'
        }])).toEqual({
            reason: 'Hitung fisik',
            items: [{
                itemSku: 'KAIN-1',
                changeQuantity: '1.2500',
                actionType: 'CORRECTION',
                stockLocation: 'WAREHOUSE'
            }]
        });
    });

    it('enforces the backend item quantity policy and decimal bounds', () => {
        expect(validateAdjustmentQuantity('1.5', wholeItem, 'ADD'))
            .toContain('jumlah utuh');
        expect(validateAdjustmentQuantity('1.0000', wholeItem, 'ADD')).toBe('');
        expect(validateAdjustmentQuantity('1.00001', fractionalItem, 'ADD'))
            .toContain('Maksimal 4');
        expect(validateAdjustmentQuantity('-1', fractionalItem, 'REMOVE'))
            .toContain('tanpa pemisah ribuan');
    });

    it('requires a reason, supported enums, and unique item SKUs', () => {
        const errors = validateStockAdjustment(' ', [{
            item: fractionalItem,
            stockLocation: 'STORE',
            actionType: 'ADD',
            changeQuantity: '1'
        }, {
            item: fractionalItem,
            stockLocation: 'SHELF',
            actionType: 'SET',
            changeQuantity: '1'
        }]);

        expect(errors.reason).toBeTruthy();
        expect(errors.lines[1].itemSku).toContain('sama');
        expect(errors.lines[1].stockLocation).toBeTruthy();
        expect(errors.lines[1].actionType).toBeTruthy();
        expect(hasStockAdjustmentErrors(errors)).toBe(true);
    });
});
