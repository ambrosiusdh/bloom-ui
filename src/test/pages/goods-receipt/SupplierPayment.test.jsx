import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import cashApi from '@api/cash-session.js';
import receiptApi from '@api/goods-receipt.js';
import { createSupplierPayment } from '@api/supplier-payment.js';
import GoodsReceiptInfoCard from '@components/goods-receipt/GoodsReceiptInfoCard.jsx';
import SupplierPayment from '@components/goods-receipt/SupplierPayment.jsx';
import cashStore from '@stores/modules/cash-session.js';
import receiptStore from '@stores/modules/goods-receipt.js';
import paymentStore, { validatePayment } from '@stores/modules/supplier-payment.js';
import { act, render, screen, waitFor, within } from '@/test/render.jsx';

vi.mock('@api/supplier-payment.js', () => ({ createSupplierPayment: vi.fn() }));
vi.mock('@api/goods-receipt.js', () => ({ default: { getGoodsReceiptDetails: vi.fn() } }));
vi.mock('@api/cash-session.js', () => ({ default: { getCurrentSession: vi.fn() } }));
const receipt = { code: 'GR-28', supplierName: 'Pemasok Satu', status: 'POSTED', paymentStatus: 'UNPAID',
    totalAmount: '100', paidAmount: '0', outstandingAmount: '100' };
const response = data => ({ data: { data } });
const success = async (code, request, key) => response({ id: 28, receiptCode: code, idempotencyKey: key,
    amount: request.amount, paymentMethod: request.paymentMethod, cashSessionId: request.paymentMethod === 'CASH' ? 15 : null, voided: false });
function Workflow() {
    const data = receiptStore(state => state.goodsReceiptDetails);
    return <><GoodsReceiptInfoCard receipt={ data } /><SupplierPayment receipt={ data } /></>;
}
const choose = async (user, name) => {
    await user.click(screen.getByLabelText('Metode pembayaran'));
    await user.click(screen.getByRole('option', { name, exact: true }));
};
const confirm = async user => {
    await user.click(screen.getByRole('button', { name: 'Tinjau pembayaran' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Catat pembayaran' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
};

describe('FE-28 receipt payment', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        sessionStorage.clear();
        paymentStore.setState(paymentStore.getInitialState());
        cashStore.setState(cashStore.getInitialState());
        receiptStore.setState({ goodsReceiptDetails: receipt });
        receiptApi.getGoodsReceiptDetails.mockResolvedValue(response({ ...receipt, paidAmount: '35', outstandingAmount: '65', paymentStatus: 'PARTIALLY_PAID' }));
        cashApi.getCurrentSession.mockResolvedValue(response(null));
        createSupplierPayment.mockImplementation(success);
    });

    it.each(['Transfer bank', 'QRIS', 'Tunai (CASH)'])('confirms a partial %s payment and renders only refreshed server values', async method => {
        cashApi.getCurrentSession.mockResolvedValue(response({ id: 15, status: 'OPEN' }));
        const user = userEvent.setup(); render(<Workflow />);
        if (method !== 'Transfer bank') await choose(user, method);
        await user.type(screen.getByLabelText('Nominal pembayaran'), '20,125');
        await user.type(screen.getByLabelText('Referensi pembayaran (opsional)'), 'REF-28');
        await confirm(user);
        const saved = await screen.findByText(/Pembayaran tercatat/);
        await waitFor(() => expect(saved.closest('[role="status"]')).toHaveFocus());
        expect(screen.getByText('Belum dibayar').nextSibling).toHaveTextContent('Rp 65');
        expect(screen.getByLabelText('Status pembayaran: Dibayar sebagian')).toBeInTheDocument();
        expect(createSupplierPayment).toHaveBeenCalledWith('GR-28', {
            amount: '20.125', paymentMethod: ({ 'Transfer bank': 'BANK_TRANSFER', QRIS: 'QRIS', 'Tunai (CASH)': 'CASH' })[method],
            reference: 'REF-28', note: null, paidAt: expect.any(String)
        }, expect.stringMatching(/^payment-/));
        if (method !== 'Tunai (CASH)') expect(cashApi.getCurrentSession).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Catat pembayaran berikutnya' }));
        expect(screen.getByLabelText('Nominal pembayaran')).toHaveFocus();
        expect(screen.getByLabelText('Nominal pembayaran')).toHaveValue('');
    });

    it('copies full outstanding, traps confirmation focus, cancels with Escape, then shows PAID', async () => {
        receiptApi.getGoodsReceiptDetails.mockResolvedValue(response({ ...receipt, paidAmount: '100', outstandingAmount: '0', paymentStatus: 'PAID' }));
        const user = userEvent.setup(); render(<Workflow />);
        await user.click(screen.getByRole('button', { name: /Isi seluruh/ }));
        expect(screen.getByLabelText('Nominal pembayaran')).toHaveValue('100');
        const review = screen.getByRole('button', { name: 'Tinjau pembayaran' });
        await user.click(review);
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByRole('button', { name: 'Kembali' })).toHaveFocus();
        await user.tab({ shift: true });
        expect(within(dialog).getByRole('button', { name: 'Catat pembayaran' })).toHaveFocus();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await waitFor(() => expect(review).toHaveFocus());
        expect(createSupplierPayment).not.toHaveBeenCalled();
        await confirm(user);
        expect(await screen.findByLabelText('Status pembayaran: Lunas')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /berikutnya/ })).not.toBeInTheDocument();
    });

    it('requires verified CASH session, allows non-cash after read failure, and focuses invalid amount', async () => {
        const user = userEvent.setup(); render(<Workflow />);
        await choose(user, 'Tunai (CASH)');
        expect(await screen.findByText(/memerlukan sesi kas terbuka/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tinjau pembayaran' })).toBeDisabled();
        cashApi.getCurrentSession.mockRejectedValue(new Error('offline'));
        await user.click(screen.getByRole('button', { name: 'Periksa sesi kas' }));
        expect(await screen.findByText(/Sesi kas gagal/)).toBeInTheDocument();
        await choose(user, 'QRIS');
        await user.click(screen.getByRole('button', { name: 'Tinjau pembayaran' }));
        expect(screen.getByLabelText('Nominal pembayaran')).toHaveFocus();
        expect(createSupplierPayment).not.toHaveBeenCalled();
    });

    it('blocks duplicates and edits, then survives reload and replays the exact ambiguous request', async () => {
        let reject;
        createSupplierPayment.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
        const user = userEvent.setup(); const view = render(<Workflow />);
        await user.type(screen.getByLabelText('Nominal pembayaran'), '25'); await confirm(user);
        expect(screen.getByLabelText('Nominal pembayaran')).toBeDisabled();
        await act(() => paymentStore.getState().submit('different time'));
        expect(createSupplierPayment).toHaveBeenCalledTimes(1);
        const original = createSupplierPayment.mock.calls[0];
        await act(async () => reject(new Error('timeout')));
        expect((await screen.findByText(/Hasil pembayaran belum pasti/)).closest('[role="alert"]')).toHaveFocus();
        view.unmount();
        await act(() => paymentStore.persist.rehydrate());
        render(<Workflow />);
        await user.click(screen.getByRole('button', { name: 'Pulihkan pembayaran yang sama' }));
        expect(await screen.findByText(/Pembayaran tercatat/)).toBeInTheDocument();
        expect(createSupplierPayment.mock.calls[1]).toEqual(original);
    });

    it.each([['supplier_payment_conflict', /melebihi sisa tagihan/], ['cash_session_conflict', /Sesi kas mungkin sudah ditutup/]])('preserves rejected input and refreshes after %s', async (domainCode, message) => {
        createSupplierPayment.mockRejectedValue({ status: 409, domainCode });
        const user = userEvent.setup(); render(<Workflow />);
        if (domainCode === 'cash_session_conflict') {
            cashApi.getCurrentSession.mockResolvedValue(response({ id: 15, status: 'OPEN' }));
            await choose(user, 'Tunai (CASH)');
            await waitFor(() => expect(screen.getByRole('button', { name: 'Tinjau pembayaran' })).toBeEnabled());
            cashApi.getCurrentSession.mockResolvedValue(response(null));
        }
        await user.type(screen.getByLabelText('Nominal pembayaran'), '101'); await confirm(user);
        expect(await screen.findByText(message)).toBeInTheDocument();
        await waitFor(() => expect(screen.getByLabelText('Nominal pembayaran')).toBeEnabled());
        expect(screen.getByLabelText('Nominal pembayaran')).toHaveValue('101');
        expect(screen.getByText('Belum dibayar').nextSibling).toHaveTextContent('Rp 65');
        expect(paymentStore.getState().attempt).toBeNull();
        if (domainCode === 'cash_session_conflict') {
            expect(cashStore.getState().drawerActionsEnabled).toBe(false);
            expect(screen.getByRole('button', { name: 'Tinjau pembayaran' })).toBeDisabled();
        }
    });

    it('keeps confirmed payment when refreshing fails; retries only the receipt read', async () => {
        receiptApi.getGoodsReceiptDetails.mockRejectedValueOnce(new Error('offline'));
        const user = userEvent.setup(); render(<Workflow />);
        await user.type(screen.getByLabelText('Nominal pembayaran'), '25'); await confirm(user);
        expect(await screen.findByText(/Angka di atas masih data sebelumnya/)).toBeInTheDocument();
        expect(screen.getByText(/Pembayaran tercatat/)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Muat ulang nilai penerimaan' }));
        await screen.findByRole('button', { name: /berikutnya/ });
        expect(createSupplierPayment).toHaveBeenCalledTimes(1);
    });

    it.each(['0', '-1', '1.12345', '1234567890123456', ''])('rejects invalid amount %s', amount => {
        expect(validatePayment({ amount, paymentMethod: 'QRIS', reference: '', note: '' })).not.toBe('');
    });

    it.each(['PAID', 'CANCELLED'])('offers no payment for %s receipt', status => {
        receiptStore.setState({ goodsReceiptDetails: { ...receipt, status: status === 'CANCELLED' ? status : 'POSTED', paymentStatus: status } });
        render(<Workflow />);
        expect(screen.getByText(/tidak memiliki tagihan/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Tinjau pembayaran' })).not.toBeInTheDocument();
    });

    it('persists before POST, retains ambiguous rejection and locks other receipts until voided replay resolves', async () => {
        const store = () => paymentStore.getState();
        store().select(receipt.code);
        store().edit({ amount: '25', paymentMethod: 'CASH', reference: '', note: '' });
        cashStore.setState({ drawerActionsEnabled: true });
        createSupplierPayment.mockImplementationOnce(() => {
            expect(JSON.parse(sessionStorage.getItem('bloom-supplier-payment-v1')).state.attempt).toEqual(store().attempt);
            return Promise.reject(new Error('timeout'));
        });
        await store().submit('2026-09-10T02:00:00Z');
        const attempt = store().attempt;
        const durable = sessionStorage.getItem('bloom-supplier-payment-v1');
        paymentStore.setState(paymentStore.getInitialState());
        sessionStorage.setItem('bloom-supplier-payment-v1', durable);
        await paymentStore.persist.rehydrate();
        cashStore.setState({ drawerActionsEnabled: false });
        store().select('OTHER');
        expect(store().code).toBe(receipt.code);
        createSupplierPayment.mockRejectedValueOnce({ status: 409, domainCode: 'cash_session_conflict' });
        await store().submit();
        expect(store().attempt).toEqual(attempt);
        createSupplierPayment.mockImplementationOnce(async (...args) => {
            const data = await success(...args); data.data.data.voided = true; return data;
        });
        await store().submit();
        render(<Workflow />);
        expect(await screen.findByText(/sudah dibatalkan/)).toBeInTheDocument();
        expect(createSupplierPayment.mock.calls.every(args => JSON.stringify(args) === JSON.stringify(createSupplierPayment.mock.calls[0]))).toBe(true);
    });

    it.each(['keyConflict', 'malformed', 'storage'])('does not offer a fresh payment after %s recovery failure', async failure => {
        const store = () => paymentStore.getState();
        store().select(receipt.code);
        store().edit({ amount: '25', paymentMethod: 'QRIS', reference: '', note: '' });
        let spy;
        if (failure === 'keyConflict') createSupplierPayment.mockRejectedValue({ status: 409, domainCode: 'supplier_payment_idempotency_conflict' });
        if (failure === 'malformed') createSupplierPayment.mockResolvedValue(response({ id: 28 }));
        if (failure === 'storage') spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
        try {
            await store().submit('2026-09-10T02:00:00Z');
            if (failure === 'storage') expect(createSupplierPayment).not.toHaveBeenCalled();
            else {
                expect(store().attempt).not.toBeNull();
                store().next();
                expect(store().attempt).not.toBeNull();
            }
            expect(store().outcome).toBe(({ keyConflict: 'keyConflict', malformed: 'uncertain', storage: 'storageUnavailable' })[failure]);
        } finally { spy?.mockRestore(); }
    });
});
