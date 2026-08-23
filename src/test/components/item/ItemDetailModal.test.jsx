import { describe, expect, it } from 'vitest';

import ItemDetailModal from '@components/item/ItemDetailModal.jsx';
import { render, screen } from '@/test/render.jsx';

describe('ItemDetailModal', () => {
    it('renders separate Indonesian location balances, state, and lock information', () => {
        render(
            <ItemDetailModal
                onClose={ () => {} }
                itemData={ {
                    name: 'Kain katun',
                    sku: 'KAIN-00001',
                    price: 15000,
                    stockQuantity: 999,
                    stockStore: '12.5000',
                    stockWarehouse: '0.0001',
                    baseUnitOfMeasure: 'METER',
                    fractionalQuantityAllowed: true,
                    active: false,
                    hasStockMovements: true,
                    baseUnitOfMeasureLocked: true,
                    fractionalQuantityAllowedLocked: true,
                    category: {}
                } }
            />
        );

        expect(screen.getByText('12,5 meter')).toBeInTheDocument();
        expect(screen.getByText('0,0001 meter')).toBeInTheDocument();
        expect(screen.getByText('Nonaktif')).toBeInTheDocument();
        expect(screen.getByText('Sudah ada')).toBeInTheDocument();
        expect(screen.getByText('Terkunci karena sudah ada pergerakan stok')).toBeInTheDocument();
        expect(screen.queryByText('999')).not.toBeInTheDocument();
    });
});
