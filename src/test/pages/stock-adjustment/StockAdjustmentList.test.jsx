import { useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import stockAdjustmentApi from '@api/stock-adjustment.js';
import StockAdjustmentList from '@pages/stock-adjustment/StockAdjustmentList.jsx';
import useStockAdjustmentStore from '@stores/modules/stock-adjustment.js';
import {
    act,
    render,
    screen,
    waitFor
} from '@/test/render.jsx';

vi.mock('@api/stock-adjustment.js', () => ({ default: {
    createStockAdjustment: vi.fn(),
    getStockAdjustmentDetails: vi.fn(),
    getStockAdjustmentList: vi.fn()
} }));

const adjustment = {
    stockAdjustmentCode: 'ADJ/IX-2026/0001',
    reason: 'Hitung fisik',
    createdBy: 'admin',
    createdAt: '2026-09-12T03:00:00Z'
};
const response = (content = [], totalPages = content.length ? 1 : 0) => ({
    data: {
        data: {
            content,
            totalPages,
            totalElements: content.length
        }
    }
});
const deferred = () => {
    let reject;
    const promise = new Promise((_, rejectPromise) => {
        reject = rejectPromise;
    });

    return { promise, reject };
};
const LocationProbe = () => <output aria-label="Lokasi saat ini">{ useLocation().search }</output>;

describe('StockAdjustmentList FE-13 read workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useStockAdjustmentStore.setState(useStockAdjustmentStore.getInitialState());
    });

    it('renders backend facts and requests only the supported code filter and paging', async () => {
        stockAdjustmentApi.getStockAdjustmentList.mockResolvedValue(response([adjustment], 3));

        render(<StockAdjustmentList />, {
            route: '/stock-adjustments?q=ADJ%2FIX&page=2&size=25'
        });

        expect(await screen.findByText(adjustment.stockAdjustmentCode)).toBeInTheDocument();
        expect(screen.getByText('Hitung fisik')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Detail' })).toHaveAttribute(
            'href',
            `/stock-adjustments/${ encodeURIComponent(adjustment.stockAdjustmentCode) }`
        );
        expect(stockAdjustmentApi.getStockAdjustmentList).toHaveBeenCalledWith({
            page: 2,
            size: 25,
            stockAdjustmentCode: 'ADJ/IX'
        }, { signal: expect.any(AbortSignal) }, { useLoader: false });
        expect(stockAdjustmentApi.getStockAdjustmentDetails).not.toHaveBeenCalled();
    });

    it('announces loading, retries a failure, and shows the empty state', async () => {
        const user = userEvent.setup();
        const request = deferred();
        stockAdjustmentApi.getStockAdjustmentList
            .mockReturnValueOnce(request.promise)
            .mockResolvedValueOnce(response());

        render(<StockAdjustmentList />, { route: '/stock-adjustments?q=ADJ-404' });

        expect(screen.getByRole('status')).toHaveTextContent('Memuat penyesuaian stok...');
        await act(async () => request.reject(new Error('Riwayat gagal dimuat.')));
        expect(await screen.findByRole('alert')).toHaveTextContent('Riwayat gagal dimuat.');

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByText('Belum ada penyesuaian stok')).toBeInTheDocument();
        expect(stockAdjustmentApi.getStockAdjustmentList).toHaveBeenCalledTimes(2);
    });

    it('canonicalizes invalid paging before making one request', async () => {
        stockAdjustmentApi.getStockAdjustmentList.mockResolvedValue(response());

        render(<><LocationProbe /><StockAdjustmentList /></>, {
            route: '/stock-adjustments?page=abc&size=999'
        });

        expect(await screen.findByLabelText('Lokasi saat ini')).toHaveTextContent('?page=1&size=10');
        expect(await screen.findByText('Belum ada penyesuaian stok')).toBeInTheDocument();
        expect(stockAdjustmentApi.getStockAdjustmentList).toHaveBeenCalledTimes(1);
        expect(stockAdjustmentApi.getStockAdjustmentList.mock.calls[0][0]).toEqual({
            page: 1,
            size: 10
        });
    });

    it('moves an out-of-range page to the final server page', async () => {
        stockAdjustmentApi.getStockAdjustmentList
            .mockResolvedValueOnce(response([], 2))
            .mockResolvedValueOnce(response([adjustment], 2));

        render(<StockAdjustmentList />, { route: '/stock-adjustments?page=8' });

        expect(await screen.findByText(adjustment.stockAdjustmentCode)).toBeInTheDocument();
        await waitFor(() => expect(stockAdjustmentApi.getStockAdjustmentList).toHaveBeenCalledTimes(2));
        expect(stockAdjustmentApi.getStockAdjustmentList.mock.calls[1][0]).toMatchObject({ page: 2 });
    });
});
