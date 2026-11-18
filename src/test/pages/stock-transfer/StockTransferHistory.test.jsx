import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import StockTransferDetail from '@pages/stock-transfer/StockTransferDetail.jsx';
import StockTransferHistory from '@pages/stock-transfer/StockTransferHistory.jsx';
import { act, render, screen, waitFor } from '@/test/render.jsx';

const api = vi.hoisted(() => ({
    getStockTransfers: vi.fn(),
    getStockTransferDetails: vi.fn()
}));

vi.mock('@api/stock-transfer.js', () => ({ default: api }));

const line = {
    id: 1,
    itemSku: 'KAIN-001',
    itemName: 'Kain historis',
    quantity: '0.2500',
    unitOfMeasure: 'METER'
};
const transfer = {
    id: 42,
    code: 'TRF/2026/42',
    sourceLocation: 'WAREHOUSE',
    destinationLocation: 'STORE',
    description: 'Isi rak lama',
    createdBy: 'operator-lama',
    createdAt: '2026-08-25T03:00:00Z',
    lines: [line],
    movements: ['OUT', 'IN'].map((movementType, index) => ({
        id: index + 10,
        sourceType: 'TRANSFER',
        sourceId: 42,
        referenceNo: 'TRF/2026/42',
        movementType,
        location: index ? 'STORE' : 'WAREHOUSE',
        quantity: '0.2500',
        qtyBefore: index ? '1.0000' : '5.0000',
        qtyAfter: index ? '1.2500' : '4.7500',
        createdBy: 'operator-lama',
        createdAt: '2026-08-25T03:00:00Z',
        item: {
            sku: 'KAIN-001',
            name: 'Kain historis',
            baseUnitOfMeasure: 'METER'
        }
    }))
};

const response = data => ({ data: { data } });
const page = (content = [transfer]) => response({
    content: content.map(row => ({
        ...row,
        lineCount: row.lines.length
    })),
    totalElements: content.length,
    totalPages: content.length ? 1 : 0
});

const renderRoutes = (route = '/stock-transfers') => render(
    <Routes>
        <Route path="/stock-transfers" element={ <StockTransferHistory /> } />
        <Route path="/stock-transfers/:code" element={ <StockTransferDetail /> } />
    </Routes>,
    { route }
);

describe('persisted stock transfer history and detail', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        api.getStockTransfers.mockResolvedValue(page());
        api.getStockTransferDetails.mockResolvedValue(response(transfer));
    });

    it('navigates from filtered history to a historical single-item detail and returns to the same filter', async () => {
        const user = userEvent.setup();

        renderRoutes('/stock-transfers?code=TRF&page=1');
        await user.click(await screen.findByRole('link', { name: 'Buka detail transfer TRF/2026/42' }));

        expect(await screen.findByRole('region', { name: 'Detail transfer tersimpan' })).toHaveTextContent('Kain historis · KAIN-001');
        expect(screen.getByRole('region', { name: 'Detail transfer tersimpan' })).toHaveTextContent('0,25 meter');
        expect(screen.getByRole('region', { name: 'Detail transfer tersimpan' })).toHaveTextContent('Isi rak lama');
        expect(screen.getByRole('region', { name: 'Detail transfer tersimpan' })).toHaveTextContent('operator-lama');
        expect(screen.getByRole('region', { name: 'Detail transfer tersimpan' })).toHaveTextContent('25 Agu 2026, 10.00 WIB');
        expect(screen.getByRole('region', { name: 'Pergerakan transfer' })).toHaveTextContent('Keluar (OUT)');
        expect(screen.getByRole('region', { name: 'Pergerakan transfer' })).toHaveTextContent('Masuk (IN)');
        expect(screen.getByRole('region', { name: 'Pergerakan transfer' })).toHaveTextContent('5 meter → 4,75 meter');
        expect(api.getStockTransferDetails).toHaveBeenCalledWith('TRF/2026/42', expect.objectContaining({ signal: expect.any(AbortSignal) }), { useLoader: false });
        expect(screen.getByRole('link', { name: 'Kembali ke riwayat transfer' })).toHaveAttribute('href', '/stock-transfers?code=TRF&page=1');

        await user.click(screen.getByRole('link', { name: 'Kembali ke riwayat transfer' }));
        expect(await screen.findByRole('link', { name: 'Buka detail transfer TRF/2026/42' })).toBeInTheDocument();
    });

    it('renders every persisted batch line and handles missing legacy movement and optional note data', async () => {
        api.getStockTransferDetails.mockResolvedValue(response({
            ...transfer,
            description: null,
            movements: undefined,
            lines: [line, {
                id: 2,
                itemSku: 'BENANG-001',
                itemName: 'Benang',
                quantity: '2.0000',
                unitOfMeasure: 'PIECE'
            }]
        }));

        renderRoutes('/stock-transfers/TRF%2F2026%2F42');
        expect(await screen.findByText('Benang · BENANG-001')).toBeInTheDocument();
        expect(screen.getByText('Kain historis · KAIN-001')).toBeInTheDocument();
        expect(screen.getByText('Jumlah dipindahkan: 2 pcs')).toBeInTheDocument();
        expect(screen.getByText('Tidak ada')).toBeInTheDocument();
        expect(screen.getByText(/Pergerakan terkait tidak tersedia/)).toBeInTheDocument();
    });

    it('announces loading, focuses failed history reads, and recovers to an empty filtered result', async () => {
        const user = userEvent.setup();
        let reject;

        api.getStockTransfers.mockReturnValueOnce(new Promise((_, rejectPromise) => {
            reject = rejectPromise;
        })).mockResolvedValueOnce(page([]));
        renderRoutes('/stock-transfers?code=missing&page=1');
        expect(screen.getByRole('status')).toHaveTextContent('Memuat riwayat transfer');
        await act(async () => reject(new Error('Riwayat gagal dimuat.')));
        expect(await screen.findByRole('alert')).toHaveTextContent('Riwayat gagal dimuat.');
        await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus());
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Tidak ada transfer yang cocok');
        expect(screen.getByRole('button', { name: 'Hapus filter' })).toBeInTheDocument();
    });

    it('handles detail failures and missing records without claiming success', async () => {
        const user = userEvent.setup();

        api.getStockTransferDetails.mockRejectedValueOnce(new Error('Data yang diminta tidak ditemukan.'))
            .mockResolvedValueOnce(response(null));
        renderRoutes('/stock-transfers/missing');

        expect(await screen.findByRole('alert')).toHaveTextContent('Data yang diminta tidak ditemukan.');
        await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus());
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Detail transfer tidak tersedia.');
    });

    it('pages server results, resets the page on search, and ignores an older response', async () => {
        const user = userEvent.setup();
        let resolve;

        api.getStockTransfers.mockResolvedValueOnce(response({
            content: [{
                ...transfer,
                lineCount: 1
            }],
            totalElements: 11,
            totalPages: 2
        })).mockReturnValueOnce(new Promise(resolvePromise => {
            resolve = resolvePromise;
        })).mockResolvedValueOnce(page([]));
        renderRoutes();
        await user.click(await screen.findByRole('button', { name: 'Go to page 2' }));
        await user.type(screen.getByLabelText('Referensi transfer'), 'new');
        await user.click(screen.getByRole('button', { name: 'Cari' }));

        expect(await screen.findByText(/Tidak ada transfer yang cocok/)).toBeInTheDocument();
        await act(async () => resolve(page()));
        expect(screen.queryByRole('link', { name: 'Buka detail transfer TRF/2026/42' })).not.toBeInTheDocument();
        expect(api.getStockTransfers).toHaveBeenLastCalledWith({
            page: 1,
            size: 10,
            code: 'new'
        }, expect.any(Object), { useLoader: false });
    });
});
