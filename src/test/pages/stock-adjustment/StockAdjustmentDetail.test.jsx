import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import stockAdjustmentApi from '@api/stock-adjustment.js';
import StockAdjustmentDetail from '@pages/stock-adjustment/StockAdjustmentDetail.jsx';
import useStockAdjustmentStore from '@stores/modules/stock-adjustment.js';
import { render, screen } from '@/test/render.jsx';

vi.mock('@api/stock-adjustment.js', () => ({ default: {
    createStockAdjustment: vi.fn(),
    getStockAdjustmentDetails: vi.fn(),
    getStockAdjustmentList: vi.fn()
} }));

const adjustment = {
    stockAdjustmentCode: 'ADJ/IX-2026/0001',
    reason: 'Hitung fisik',
    createdBy: 'admin',
    createdAt: '2026-09-12T03:00:00Z',
    items: [{
        id: 8,
        item: {
            sku: 'KAIN-1',
            name: 'Kain katun',
            baseUnitOfMeasure: 'METER'
        },
        actionType: 'CORRECTION',
        stockLocation: 'WAREHOUSE',
        changeQuantity: '0.2500',
        previousStock: '9.7500',
        newStock: '0.2500'
    }]
};

const renderDetail = () => render(
    <Routes>
        <Route path="/stock-adjustments/:code" element={ <StockAdjustmentDetail /> } />
    </Routes>,
    { route: `/stock-adjustments/${ encodeURIComponent(adjustment.stockAdjustmentCode) }` }
);

describe('StockAdjustmentDetail FE-13 read workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useStockAdjustmentStore.setState(useStockAdjustmentStore.getInitialState());
    });

    it('renders backend-provided action, location, request, previous stock, and new stock', async () => {
        stockAdjustmentApi.getStockAdjustmentDetails.mockResolvedValue({
            data: { data: adjustment }
        });

        renderDetail();

        expect(await screen.findByText('Hitung fisik')).toBeInTheDocument();
        expect(screen.getByText('Koreksi absolut')).toBeInTheDocument();
        expect(screen.getByText('Gudang (WAREHOUSE)')).toBeInTheDocument();
        expect(screen.getAllByText('0,25 meter')).toHaveLength(2);
        expect(screen.getByText('9,75 meter')).toBeInTheDocument();
        expect(stockAdjustmentApi.getStockAdjustmentDetails).toHaveBeenCalledWith(
            adjustment.stockAdjustmentCode,
            { signal: expect.any(AbortSignal) },
            { useLoader: false }
        );
    });

    it('announces loading and retries a failed request', async () => {
        const user = userEvent.setup();
        stockAdjustmentApi.getStockAdjustmentDetails
            .mockRejectedValueOnce(new Error('Detail gagal dimuat.'))
            .mockResolvedValueOnce({ data: { data: adjustment } });

        renderDetail();

        expect(screen.getByRole('status')).toHaveTextContent('Memuat detail penyesuaian...');
        expect(await screen.findByRole('alert')).toHaveTextContent('Detail gagal dimuat.');
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect(await screen.findByText('Hitung fisik')).toBeInTheDocument();
        expect(stockAdjustmentApi.getStockAdjustmentDetails).toHaveBeenCalledTimes(2);
    });
});
