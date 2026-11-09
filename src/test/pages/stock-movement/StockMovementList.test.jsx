import { beforeEach, describe, expect, it, vi } from 'vitest';

import StockMovementList from '@pages/stock-movement/StockMovementList.jsx';
import { fireEvent, render, screen, waitFor } from '@/test/render.jsx';

const stockMovementApi = vi.hoisted(() => ({
    getStockMovementList: vi.fn()
}));

vi.mock('@api/stock-movement.js', () => ({ default: stockMovementApi }));

const response = ({
    content = [],
    totalElements = content.length,
    totalPages = content.length ? 1 : 0
} = {}) => ({
    data: {
        data: {
            content,
            totalElements,
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

    it('renders grouped ledger facts and opens an in-context detail without another request', async () => {
        stockMovementApi.getStockMovementList.mockResolvedValue(response({ content: [movement] }));
        render(<StockMovementList />, { route: '/stock-movements?itemSku=KAIN-00001' });

        expect(screen.getByRole('link', { name: 'Buat transfer stok' }))
            .toHaveAttribute('href', '/stock-transfers/new');
        expect(await screen.findByRole('heading', { name: 'Daftar pergerakan' })).toBeInTheDocument();
        expect(screen.getByText('1 pergerakan ditemukan')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Barang' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Pergerakan' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Lokasi' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Saldo' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Dibuat oleh & pada' })).toBeInTheDocument();
        expect(screen.getAllByText('Kain katun').length).toBeGreaterThan(0);
        expect(screen.getAllByText('KAIN-00001 · meter').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Masuk · +12,5 meter').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Penerimaan barang').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Gudang').length).toBeGreaterThan(0);
        expect(screen.getByRole('cell', { name: /1,25 meter.*13,75 meter/ })).toBeInTheDocument();
        expect(screen.getAllByText('admin').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: 'Lihat detail pergerakan Kain katun' }));

        const dialog = screen.getByRole('dialog', { name: 'Detail pergerakan stok' });
        expect(dialog).toHaveTextContent('GR-00009 · Penerimaan barang');
        expect(dialog).toHaveTextContent('Saldo sebelumnya');
        expect(dialog).toHaveTextContent('1,25 meter');
        expect(dialog).toHaveTextContent('Saldo sesudahnya');
        expect(dialog).toHaveTextContent('13,75 meter');
        expect(screen.getByRole('link', { name: 'Buka penerimaan terkait' }))
            .toHaveAttribute('href', '/goods-receipts/GR-00009');
        expect(stockMovementApi.getStockMovementList).toHaveBeenCalledTimes(1);
        expect(stockMovementApi.getStockMovementList).toHaveBeenCalledWith(expect.objectContaining({
            params: expect.objectContaining({
                page: 1,
                size: 10,
                itemSku: 'KAIN-00001'
            })
        }));

        fireEvent.click(screen.getByRole('button', { name: 'Tutup detail pergerakan stok' }));
        expect(screen.queryByRole('dialog', { name: 'Detail pergerakan stok' })).not.toBeInTheDocument();
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

    it('applies the supported filters and resets them to page one with focus recovery', async () => {
        stockMovementApi.getStockMovementList.mockResolvedValue(response());
        render(<StockMovementList />, {
            route: '/stock-movements?page=3&size=25&itemSku=KAIN-00001&movementType=IN&location=WAREHOUSE'
        });

        await screen.findByText('Tidak ada pergerakan stok');
        expect(screen.getByText('0 pergerakan ditemukan')).toBeInTheDocument();
        expect(stockMovementApi.getStockMovementList).toHaveBeenLastCalledWith(expect.objectContaining({
            params: {
                page: 3,
                size: 25,
                itemSku: 'KAIN-00001',
                movementType: 'IN',
                location: 'WAREHOUSE'
            }
        }));

        const skuInput = screen.getByRole('searchbox', { name: 'Barang atau SKU' });
        fireEvent.click(screen.getAllByRole('button', { name: 'Reset filter' })[0]);

        expect(skuInput).toHaveFocus();
        await waitFor(() => expect(stockMovementApi.getStockMovementList).toHaveBeenLastCalledWith(expect.objectContaining({
            params: {
                page: 1,
                size: 25
            }
        })));
    });

    it('keeps unsupported source detail explicit and does not invent navigation', async () => {
        stockMovementApi.getStockMovementList.mockResolvedValue(response({
            content: [{
                ...movement,
                id: 15,
                sourceType: 'OPENING_BALANCE',
                referenceNo: 'OPENING-KAIN-00001'
            }]
        }));
        render(<StockMovementList />);

        fireEvent.click(await screen.findByRole('button', { name: 'Lihat detail pergerakan Kain katun' }));

        expect(screen.getByRole('dialog', { name: 'Detail pergerakan stok' }))
            .toHaveTextContent('Detail sumber belum tersedia untuk jenis pergerakan ini.');
        expect(screen.queryByRole('link', { name: /terkait/i })).not.toBeInTheDocument();
        expect(stockMovementApi.getStockMovementList).toHaveBeenCalledTimes(1);
    });
});
