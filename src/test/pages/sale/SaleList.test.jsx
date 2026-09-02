import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import saleApi from '@api/sale.js';
import SaleList from '@pages/sale/SaleList.jsx';
import useSaleStore from '@stores/modules/sale.js';
import { act, render, screen, waitFor } from '@/test/render.jsx';

vi.mock('@api/sale.js', () => ({
    default: {
        getSaleList: vi.fn(),
        getSaleDetails: vi.fn(),
        createSale: vi.fn(),
        getCheckoutStatus: vi.fn(),
        printReceipt: vi.fn()
    }
}));

const sale = {
    code: 'SALE/IX-2026/0002',
    saleStatus: 'COMPLETED',
    paymentStatus: 'PAID',
    correctionStatus: 'NONE',
    totalAmount: '12500.0000',
    paymentType: 'CASH',
    createdAt: '2026-09-02T03:00:00Z',
    createdBy: 'admin'
};

const response = (content = [], totalPages = content.length ? 1 : 0) => ({ data: { data: {
    content,
    number: 0,
    totalPages,
    totalElements: content.length
} } });

const deferred = () => {
    let resolve;
    const promise = new Promise(resolvePromise => { resolve = resolvePromise; });
    return { promise, resolve };
};

describe('SaleList FE-22 read workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSaleStore.setState({
            saleList: [],
            salePaging: {},
            saleListStatus: 'idle',
            saleListError: null
        });
    });

    it('renders backend status, method, total, paging, and supported date/actor filters', async () => {
        saleApi.getSaleList.mockResolvedValue(response([sale], 3));
        render(<SaleList />, {
            route: '/sales?key=createdBy&q=admin&startDate=2026-09-01&endDate=2026-09-03&page=2&size=5'
        });

        expect(await screen.findByText(sale.code)).toBeInTheDocument();
        expect(screen.getByLabelText('Status penjualan: Selesai')).toBeInTheDocument();
        expect(screen.getByLabelText('Status pembayaran: Lunas')).toBeInTheDocument();
        expect(screen.getByText('Tunai')).toBeInTheDocument();
        expect(screen.getByText('Rp 12.500')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Detail' })).toHaveAttribute(
            'href', `/sales/${ encodeURIComponent(sale.code) }`
        );

        const [params, config, options] = saleApi.getSaleList.mock.calls[0];
        expect(params).toMatchObject({ page: 2, size: 5, createdBy: 'admin' });
        expect(params).not.toHaveProperty('code');
        expect(params.startDate).toEqual(expect.any(String));
        expect(params.endDate).toEqual(expect.any(String));
        expect(config.signal).toBeInstanceOf(AbortSignal);
        expect(options).toEqual({ useLoader: false });
    });

    it('shows loading, then a useful empty state', async () => {
        const request = deferred();
        saleApi.getSaleList.mockReturnValue(request.promise);
        render(<SaleList />, { route: '/sales' });

        expect(await screen.findByRole('status')).toHaveTextContent('Memuat penjualan...');
        await act(async () => request.resolve(response()));
        expect(await screen.findByText('Tidak ada penjualan')).toBeInTheDocument();
    });

    it('shows an error and retries the same filters successfully', async () => {
        const user = userEvent.setup();
        saleApi.getSaleList
            .mockRejectedValueOnce(new Error('Riwayat gagal dimuat.'))
            .mockResolvedValueOnce(response());
        render(<SaleList />, { route: '/sales?key=code&q=SALE-404' });

        expect(await screen.findByRole('alert')).toHaveTextContent('Riwayat gagal dimuat.');
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect(await screen.findByText('Tidak ada penjualan')).toBeInTheDocument();
        await waitFor(() => expect(saleApi.getSaleList).toHaveBeenCalledTimes(2));
        expect(saleApi.getSaleList.mock.calls[1][0]).toMatchObject({ code: 'SALE-404' });
    });
});
