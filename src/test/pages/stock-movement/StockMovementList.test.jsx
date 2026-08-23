import { beforeEach, describe, expect, it, vi } from 'vitest';

import StockMovementList from '@pages/stock-movement/StockMovementList.jsx';
import { fireEvent, render, screen, waitFor } from '@/test/render.jsx';

const stockMovementApi = vi.hoisted(() => ({
    getStockMovementList: vi.fn()
}));

vi.mock('@api/stock-movement.js', () => ({ default: stockMovementApi }));

const response = ({ content = [], totalPages = content.length ? 1 : 0 } = {}) => ({
    data: {
        data: {
            content,
            totalPages
        }
    }
});

const movement = {
    id: 14,
    item: {
        name: 'Kain katun',
        sku: 'KAIN-00001',
        baseUnitOfMeasure: 'METER'
    },
    sourceType: 'GOODS_RECEIPT',
    sourceId: 9,
    movementType: 'IN',
    location: 'WAREHOUSE',
    quantity: '12.5000',
    qtyBefore: '1.2500',
    qtyAfter: '13.7500',
    referenceNo: 'GR-00009',
    createdBy: 'admin',
    createdAt: '2026-08-20T05:30:00Z'
};

describe('StockMovementList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the backend movement read model directly without row enrichment requests', async () => {
        stockMovementApi.getStockMovementList.mockResolvedValue(response({ content: [movement] }));
        render(<StockMovementList />, { route: '/stock-movements?itemSku=KAIN-00001' });

        expect((await screen.findAllByText('Kain katun')).length).toBeGreaterThan(0);
        expect(screen.getAllByText('KAIN-00001').length).toBeGreaterThan(0);
        expect(screen.getAllByText('+12,5 meter').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Gudang').length).toBeGreaterThan(0);
        expect(screen.getAllByText('GR-00009').length).toBeGreaterThan(0);
        expect(screen.getAllByText('admin').length).toBeGreaterThan(0);
        expect(stockMovementApi.getStockMovementList).toHaveBeenCalledTimes(1);
        expect(stockMovementApi.getStockMovementList).toHaveBeenCalledWith(expect.objectContaining({
            params: expect.objectContaining({ page: 1, size: 10, itemSku: 'KAIN-00001' })
        }));
    });

    it('shows an actionable error and retries the same ledger request', async () => {
        stockMovementApi.getStockMovementList
            .mockRejectedValueOnce(new Error('Riwayat stok gagal dimuat.'))
            .mockResolvedValueOnce(response());
        render(<StockMovementList />);

        expect(await screen.findByRole('alert')).toHaveTextContent('Riwayat stok gagal dimuat.');
        fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect(await screen.findByText('Tidak ada pergerakan stok')).toBeInTheDocument();
        expect(stockMovementApi.getStockMovementList).toHaveBeenCalledTimes(2);
    });

    it('applies supported filters, resets paging, and renders the filtered empty state', async () => {
        stockMovementApi.getStockMovementList.mockResolvedValue(response());
        render(<StockMovementList />, { route: '/stock-movements?page=3&size=25' });

        await screen.findByText('Tidak ada pergerakan stok');
        fireEvent.change(screen.getByRole('textbox', { name: 'SKU barang' }), {
            target: { value: 'KAIN-00001' }
        });

        await waitFor(() => expect(stockMovementApi.getStockMovementList).toHaveBeenLastCalledWith(expect.objectContaining({
            params: expect.objectContaining({ page: 1, size: 25, itemSku: 'KAIN-00001' })
        })));
        expect(screen.getByRole('button', { name: 'Hapus filter' })).toBeEnabled();

        fireEvent.click(screen.getByRole('button', { name: 'Hapus filter' }));
        await waitFor(() => expect(stockMovementApi.getStockMovementList).toHaveBeenLastCalledWith(expect.objectContaining({
            params: { page: 1, size: 25 }
        })));
    });
});
