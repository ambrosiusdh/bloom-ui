import { describe, expect, it } from 'vitest';

import {
    createSaleRequest,
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
});
