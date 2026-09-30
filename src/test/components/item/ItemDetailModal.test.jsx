import { describe, expect, it } from 'vitest';

import ItemDetailModal from '@components/item/ItemDetailModal.jsx';
import { render, screen } from '@/test/render.jsx';

describe('ItemDetailModal', () => {
    it('renders exact price, separate location balances, state, locks, and full item access', () => {
        render(
            <ItemDetailModal
                onClose={ () => {} }
                onOpenBarcode={ () => {} }
                itemData={ {
                    name: 'Kain katun',
                    sku: 'KAIN-00001',
                    price: '23456.7500',
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
        expect(screen.getByText('Rp 23.456,75')).toBeInTheDocument();
        expect(screen.getByText('Nonaktif')).toBeInTheDocument();
        expect(screen.getByText('Sudah ada')).toBeInTheDocument();
        expect(screen.getByText('Terkunci karena sudah ada pergerakan stok')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Riwayat stok' })).toHaveAttribute(
            'href',
            '/stock-movements?itemSku=KAIN-00001'
        );
        expect(screen.getByRole('button', { name: 'Barcode' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Ubah barang' })).toHaveAttribute(
            'href',
            '/items/KAIN-00001/edit'
        );
        expect(screen.queryByText('999')).not.toBeInTheDocument();
    });
});
