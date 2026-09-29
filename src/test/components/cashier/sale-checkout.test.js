import { describe, expect, it } from 'vitest';

import {
    createSaleRequest,
    getAdvisoryCashChange,
    getAdvisoryCashShortcuts,
    getAdvisorySaleEstimate
} from '@components/cashier/sale-checkout.js';

describe('cashier sale preparation', () => {
    it('calculates advisory line, subtotal, discount, and total values with exact decimal scaling', () => {
        expect(getAdvisorySaleEstimate([
            {
                sku: 'KAIN-1',
                price: '12345.6789',
                quantity: '0.1250'
            },
            {
                sku: 'PCS-1',
                price: '10000',
                quantity: '2'
            }
        ], '500')).toEqual({
            lineAmounts: {
                'KAIN-1': '1543.2099',
                'PCS-1': '20000'
            },
            subtotalAmount: '21543.2099',
            totalAmount: '21043.2099',
            hasInvalidLine: false
        });
    });

    it('maps discount and its reason to existing backend fields without changing cart intent', () => {
        expect(createSaleRequest([
            {
                sku: 'KAIN-1',
                quantity: '0.125'
            }
        ], 'QRIS', '21043.2099', '500', '  Harga langganan  ')).toEqual({
            discountAmount: '500',
            paidAmount: '21043.2099',
            description: 'Harga langganan',
            paymentType: 'QRIS',
            saleItemList: [
                {
                    itemSku: 'KAIN-1',
                    quantity: '0.125',
                    stockLocation: 'STORE'
                }
            ]
        });
    });

    it('calculates only non-negative advisory cash change with exact decimal scaling', () => {
        expect(getAdvisoryCashChange('20000', '18750')).toBe('1250');
        expect(getAdvisoryCashChange('18750.1250', '18750.125')).toBe('0');
        expect(getAdvisoryCashChange('18000', '18750')).toBeNull();
        expect(getAdvisoryCashChange('not-money', '18750')).toBeNull();
    });

    it('suggests exact and useful rounded CASH amounts without changing the official total', () => {
        expect(getAdvisoryCashShortcuts('18750')).toEqual([
            '18750',
            '20000',
            '30000'
        ]);
        expect(getAdvisoryCashShortcuts('3999996')).toEqual([
            '3999996',
            '4000000',
            '4100000'
        ]);
        expect(getAdvisoryCashShortcuts('not-money')).toEqual([]);
    });
});
