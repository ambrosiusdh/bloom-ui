import { within } from '@testing-library/react';
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
vi.mock('@components/_ui/BloomDateRangePicker.jsx', () => ({
    default: ({
        endDate,
        label,
        onChange,
        startDate
    }) => (
        <div>
            <span aria-label={ label }>{ startDate }|{ endDate }</span>
            <button
                type="button"
                onClick={ () => onChange({
                    startDate: '2026-09-03',
                    endDate: '2026-09-05'
                }) }
            >
                Pilih rentang penjualan uji
            </button>
        </div>
    )
}));

const sale = {
    code: 'SALE/IX-2026/0002',
    sessionId: 13,
    saleStatus: 'COMPLETED',
    paymentStatus: 'PAID',
    correctionStatus: 'NONE',
    totalAmount: '12500.0000',
    paymentType: 'CASH',
    createdAt: '2026-09-02T03:00:00Z',
    createdBy: 'admin'
};

const response = (
    content = [],
    totalPages = content.length ? 1 : 0,
    totalElements = content.length
) => ({ data: { data: {
    content,
    number: 0,
    totalPages,
    totalElements
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
        saleApi.getSaleList.mockResolvedValue(response([sale], 3, 11));
        render(<SaleList />, {
            route: '/sales?key=createdBy&q=admin&startDate=2026-09-01&endDate=2026-09-03&page=2&size=5'
        });

        expect(await screen.findAllByText(sale.code)).not.toHaveLength(0);
        expect(screen.getAllByLabelText('Status penjualan: Selesai')).not.toHaveLength(0);
        expect(screen.getAllByLabelText('Status pembayaran: Lunas')).not.toHaveLength(0);
        expect(screen.getAllByLabelText('Status koreksi: Tanpa pembatalan/retur'))
            .not.toHaveLength(0);
        expect(screen.getAllByText('Tunai')).not.toHaveLength(0);
        expect(screen.getAllByText('Rp 12.500')).not.toHaveLength(0);
        expect(screen.getAllByText('Sesi kas #13')).not.toHaveLength(0);
        expect(screen.getByText('6–6 dari 11 penjualan · Terbaru lebih dulu'))
            .toBeInTheDocument();
        const narrowRecord = screen.getByRole('article');
        expect(within(narrowRecord).getByText('Status')).toBeInTheDocument();
        expect(within(narrowRecord).getByText('Pembayaran')).toBeInTheDocument();
        expect(within(narrowRecord).getByText('Total server')).toBeInTheDocument();
        expect(within(narrowRecord).getByText('Dibuat oleh & pada')).toBeInTheDocument();
        screen.getAllByRole('link', { name: `Buka detail ${ sale.code }` })
            .forEach(link => expect(link).toHaveAttribute(
                'href',
                `/sales/${ encodeURIComponent(sale.code) }`
            ));
        expect(screen.getByRole('heading', { level: 1, name: 'Riwayat penjualan' }))
            .toBeInTheDocument();
        expect(screen.getByLabelText('Rentang tanggal penjualan'))
            .toHaveTextContent('2026-09-01|2026-09-03');

        const [params, config, options] = saleApi.getSaleList.mock.calls[0];
        expect(params).toMatchObject({ page: 2, size: 5, createdBy: 'admin' });
        expect(params).not.toHaveProperty('code');
        expect(params.startDate).toEqual(expect.any(String));
        expect(params.endDate).toEqual(expect.any(String));
        expect(config.signal).toBeInstanceOf(AbortSignal);
        expect(options).toEqual({ useLoader: false });
    });

    it('applies one selected range without manual date entry', async () => {
        const user = userEvent.setup();
        saleApi.getSaleList.mockResolvedValue(response());
        render(<SaleList />, { route: '/sales' });

        await waitFor(() => expect(saleApi.getSaleList).toHaveBeenCalledTimes(1));
        saleApi.getSaleList.mockClear();

        await user.click(screen.getByRole('button', { name: 'Pilih rentang penjualan uji' }));
        await user.click(screen.getByRole('button', { name: 'Terapkan filter' }));

        await waitFor(() => expect(saleApi.getSaleList).toHaveBeenCalledTimes(1));
        expect(saleApi.getSaleList.mock.calls[0][0]).toMatchObject({
            startDate: expect.any(String),
            endDate: expect.any(String),
            page: 1
        });
    });

    it('keeps server paging stable and requests the next page with the same filters', async () => {
        const user = userEvent.setup();
        saleApi.getSaleList.mockResolvedValue(response([sale], 3, 11));
        render(<SaleList />, {
            route: '/sales?key=code&q=SALE%2FIX&page=2&size=5'
        });

        expect(await screen.findByText('Halaman 2 dari 3')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Berikutnya' }));

        await waitFor(() => expect(saleApi.getSaleList).toHaveBeenCalledTimes(2));
        expect(saleApi.getSaleList.mock.calls[1][0]).toMatchObject({
            page: 3,
            size: 5,
            code: 'SALE/IX'
        });
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
