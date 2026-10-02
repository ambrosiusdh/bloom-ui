import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import supplierPaymentApi from '@api/supplier-payment.js';
import SupplierPaymentHistory from '@components/goods-receipt/SupplierPaymentHistory.jsx';
import { render, screen, waitFor } from '@/test/render.jsx';

vi.mock('@api/supplier-payment.js', () => ({
    default: {
        getSupplierPaymentHistory: vi.fn()
    }
}));

const receiptCode = 'GR/IX-2026/0002';
const payments = [
    {
        id: 3,
        amount: '2000000.0000',
        paymentMethod: 'QRIS',
        paidAt: '2026-09-28T03:24:00Z',
        reference: 'PAY-QRIS-3',
        note: 'Pembayaran tahap berikutnya',
        actor: 'admin',
        voided: false
    },
    {
        id: 2,
        amount: '1000000.0000',
        paymentMethod: 'CASH',
        paidAt: '2026-09-27T03:24:00Z',
        reference: null,
        note: null,
        actor: 'cashier',
        cashSessionId: 15,
        voided: true,
        voidReason: 'Salah metode',
        voidedAt: '2026-09-27T03:30:00Z',
        voidedBy: 'admin'
    }
];

const response = (
    content = [],
    totalPages = content.length ? 1 : 0,
    totalElements = content.length
) => ({
    data: {
        data: {
            content,
            totalPages,
            totalElements
        }
    }
});

describe('SupplierPaymentHistory UXI-20 read workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders exact backend payment facts as grouped narrow records and pages the server history', async () => {
        supplierPaymentApi.getSupplierPaymentHistory
            .mockResolvedValueOnce(response(payments, 2, 12))
            .mockResolvedValueOnce(response([], 2, 12));
        const user = userEvent.setup();

        render(<SupplierPaymentHistory receiptCode={ receiptCode } />);

        expect(await screen.findByText('1–2 dari 12 pembayaran · Terbaru lebih dulu'))
            .toBeInTheDocument();
        expect(screen.getByText('Rp 2.000.000')).toBeInTheDocument();
        expect(screen.getByText('PAY-QRIS-3')).toBeInTheDocument();
        expect(screen.getByText('Pembayaran tahap berikutnya')).toBeInTheDocument();
        expect(screen.getByText('Sesi kas #15')).toBeInTheDocument();
        expect(screen.getByLabelText('Status pembayaran: Aktif')).toBeInTheDocument();
        expect(screen.getByLabelText('Status pembayaran: Dibatalkan')).toBeInTheDocument();
        expect(screen.getByText('Salah metode')).toBeInTheDocument();
        expect(screen.getByRole('table')).toHaveClass('!block', 'xl:!table');
        expect(screen.getAllByRole('row')[1]).toHaveClass('!grid', 'xl:!table-row');

        await user.click(screen.getByRole('button', { name: 'Berikutnya' }));

        await waitFor(() => expect(supplierPaymentApi.getSupplierPaymentHistory)
            .toHaveBeenLastCalledWith(
                receiptCode,
                {
                    page: 2,
                    size: 10
                },
                { signal: expect.any(AbortSignal) },
                { useLoader: false }
            ));
    });

    it('announces failure, retries the same page, and distinguishes an empty history', async () => {
        supplierPaymentApi.getSupplierPaymentHistory
            .mockRejectedValueOnce(new Error('Riwayat tidak tersedia.'))
            .mockResolvedValueOnce(response());
        const user = userEvent.setup();

        render(<SupplierPaymentHistory receiptCode={ receiptCode } />);

        expect(screen.getByRole('status')).toHaveTextContent('Memuat riwayat pembayaran...');
        expect(await screen.findByRole('alert')).toHaveTextContent('Riwayat tidak tersedia.');

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect(await screen.findByText('Belum ada pembayaran')).toBeInTheDocument();
        expect(supplierPaymentApi.getSupplierPaymentHistory).toHaveBeenCalledTimes(2);
    });

    it('reloads the server history after a confirmed payment refresh completes', async () => {
        supplierPaymentApi.getSupplierPaymentHistory
            .mockResolvedValueOnce(response())
            .mockResolvedValueOnce(response([payments[0]]));

        const view = render(
            <SupplierPaymentHistory receiptCode={ receiptCode } refreshKey={ null } />
        );

        expect(await screen.findByText('Belum ada pembayaran')).toBeInTheDocument();

        view.rerender(
            <SupplierPaymentHistory receiptCode={ receiptCode } refreshKey={ payments[0].id } />
        );

        expect(await screen.findByText('PAY-QRIS-3')).toBeInTheDocument();
        expect(supplierPaymentApi.getSupplierPaymentHistory).toHaveBeenCalledTimes(2);
    });
});
