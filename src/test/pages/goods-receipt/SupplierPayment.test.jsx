import { renderToString } from 'react-dom/server';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import cashApi from '@api/cash-session.js';
import receiptApi from '@api/goods-receipt.js';
import supplierPaymentApi, { SUPPLIER_PAYMENT_TIMEOUT_MS } from '@api/supplier-payment.js';
import GoodsReceiptInfoCard from '@components/goods-receipt/GoodsReceiptInfoCard.jsx';
import SupplierPayment from '@components/goods-receipt/SupplierPayment.jsx';
import authStore from '@stores/modules/auth.js';
import cashStore from '@stores/modules/cash-session.js';
import receiptStore from '@stores/modules/goods-receipt.js';
import paymentStore from '@stores/modules/supplier-payment.js';
import { paymentRequest, validatePayment } from '@utils/supplier-payment-utils.js';
import { act, render, screen, waitFor, within } from '@/test/render.jsx';

vi.mock('@api/supplier-payment.js', () => ({ default: { createSupplierPayment: vi.fn() }, SUPPLIER_PAYMENT_TIMEOUT_MS: 15000 }));
vi.mock('@api/goods-receipt.js', () => ({ default: { getGoodsReceiptDetails: vi.fn() } }));
vi.mock('@api/cash-session.js', () => ({ default: { getCurrentSession: vi.fn() } }));
const receipt = { code: 'GR-28', supplierName: 'Pemasok Satu', status: 'POSTED', paymentStatus: 'UNPAID',
    totalAmount: '100', paidAmount: '0', outstandingAmount: '100' };
const response = data => ({ data: { data } });
const intent = () => {
    const { code, ownerAccountId, draft } = paymentStore.getState();
    return {
        code,
        ownerAccountId,
        request: paymentRequest(draft, '2026-09-10T02:00:00Z')
    };
};
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
        authStore.setState({
            authStatus: 'authenticated',
            currentUser: {
                accountId: '101',
                username: 'cashier-a'
            }
        });
        cashStore.setState(cashStore.getInitialState());
        receiptStore.setState({ goodsReceiptDetails: receipt });
        receiptApi.getGoodsReceiptDetails.mockResolvedValue(response({ ...receipt, paidAmount: '35', outstandingAmount: '65', paymentStatus: 'PARTIALLY_PAID' }));
        cashApi.getCurrentSession.mockResolvedValue(response(null));
        supplierPaymentApi.createSupplierPayment.mockImplementation(success);
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
        expect(supplierPaymentApi.createSupplierPayment).toHaveBeenCalledWith('GR-28', {
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
        expect(supplierPaymentApi.createSupplierPayment).not.toHaveBeenCalled();
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
        expect(supplierPaymentApi.createSupplierPayment).not.toHaveBeenCalled();
    });

    it('blocks duplicates and edits, then survives reload and replays the exact ambiguous request', async () => {
        let reject;
        supplierPaymentApi.createSupplierPayment.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
        const user = userEvent.setup(); const view = render(<Workflow />);
        await user.type(screen.getByLabelText('Nominal pembayaran'), '25'); await confirm(user);
        expect(screen.getByLabelText('Nominal pembayaran')).toBeDisabled();
        await act(() => paymentStore.getState().submit('different time'));
        expect(supplierPaymentApi.createSupplierPayment).toHaveBeenCalledTimes(1);
        const original = supplierPaymentApi.createSupplierPayment.mock.calls[0];
        await act(async () => reject(new Error('timeout')));
        expect((await screen.findByText(/Hasil pembayaran belum pasti/)).closest('[role="alert"]')).toHaveFocus();
        view.unmount();
        await act(() => paymentStore.persist.rehydrate());
        render(<Workflow />);
        await user.click(screen.getByRole('button', { name: 'Pulihkan pembayaran yang sama' }));
        expect(await screen.findByText(/Pembayaran tercatat/)).toBeInTheDocument();
        expect(supplierPaymentApi.createSupplierPayment.mock.calls[1]).toEqual(original);
    });

    it.each([['supplier_payment_conflict', /melebihi sisa tagihan/], ['cash_session_conflict', /Sesi kas mungkin sudah ditutup/]])('preserves rejected input and refreshes after %s', async (domainCode, message) => {
        supplierPaymentApi.createSupplierPayment.mockRejectedValue({ status: 409, domainCode });
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
        expect(supplierPaymentApi.createSupplierPayment).toHaveBeenCalledTimes(1);
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
        cashStore.setState({ currentStatus: 'ready', drawerActionsEnabled: true });
        supplierPaymentApi.createSupplierPayment.mockImplementationOnce(() => {
            expect(JSON.parse(sessionStorage.getItem('bloom-supplier-payment-v1')).state.attempt).toEqual(store().attempt);
            return Promise.reject(new Error('timeout'));
        });
        await store().submit(intent());
        const attempt = store().attempt;
        const durable = sessionStorage.getItem('bloom-supplier-payment-v1');
        paymentStore.setState(paymentStore.getInitialState());
        sessionStorage.setItem('bloom-supplier-payment-v1', durable);
        await paymentStore.persist.rehydrate();
        cashStore.setState({ drawerActionsEnabled: false });
        store().select('OTHER');
        expect(store().code).toBe(receipt.code);
        supplierPaymentApi.createSupplierPayment.mockRejectedValueOnce({ status: 409, domainCode: 'cash_session_conflict' });
        await store().submit();
        expect(store().attempt).toEqual(attempt);
        supplierPaymentApi.createSupplierPayment.mockImplementationOnce(async (...args) => {
            const data = await success(...args); data.data.data.voided = true; return data;
        });
        await store().submit();
        render(<Workflow />);
        expect(await screen.findByText(/sudah dibatalkan/)).toBeInTheDocument();
        expect(supplierPaymentApi.createSupplierPayment.mock.calls.every(args => JSON.stringify(args) === JSON.stringify(supplierPaymentApi.createSupplierPayment.mock.calls[0]))).toBe(true);
    });

    it.each(['keyConflict', 'malformed', 'storage'])('does not offer a fresh payment after %s recovery failure', async failure => {
        const store = () => paymentStore.getState();
        store().select(receipt.code);
        store().edit({ amount: '25', paymentMethod: 'QRIS', reference: '', note: '' });
        let spy;
        if (failure === 'keyConflict') supplierPaymentApi.createSupplierPayment.mockRejectedValue({ status: 409, domainCode: 'supplier_payment_idempotency_conflict' });
        if (failure === 'malformed') supplierPaymentApi.createSupplierPayment.mockResolvedValue(response({ id: 28 }));
        if (failure === 'storage') spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
        try {
            await store().submit(intent());
            if (failure === 'storage') expect(supplierPaymentApi.createSupplierPayment).not.toHaveBeenCalled();
            else {
                expect(store().attempt).not.toBeNull();
                store().next();
                expect(store().attempt).not.toBeNull();
            }
            expect(store().outcome).toBe(({ keyConflict: 'keyConflict', malformed: 'uncertain', storage: 'storageUnavailable' })[failure]);
        } finally { spy?.mockRestore(); }
    });

    it.each(['ready', 'error'])('retains success across navigation during POST and %s receipt refresh until acknowledged', async refreshStatus => {
        let resolve;
        supplierPaymentApi.createSupplierPayment.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
        if (refreshStatus === 'error') receiptApi.getGoodsReceiptDetails.mockRejectedValueOnce(new Error('offline'));
        const user = userEvent.setup(); render(<Workflow />);
        await user.type(screen.getByLabelText('Nominal pembayaran'), '25'); await confirm(user);
        await act(() => receiptStore.setState({ goodsReceiptDetails: { ...receipt, code: 'OTHER' } }));
        await act(async () => resolve(await success(...supplierPaymentApi.createSupplierPayment.mock.calls[0])));
        expect(paymentStore.getState()).toMatchObject({ code: receipt.code, pending: false, refreshStatus, result: { id: 28 } });
        expect(screen.getByRole('link', { name: `Buka penerimaan ${ receipt.code }` })).toHaveAttribute('href', `/goods-receipts/${ receipt.code }`);
        expect(screen.queryByLabelText('Nominal pembayaran')).not.toBeInTheDocument();
        await act(() => receiptStore.setState({ goodsReceiptDetails: receipt }));
        if (refreshStatus === 'error') {
            expect(screen.queryByRole('button', { name: /berikutnya/ })).not.toBeInTheDocument();
            await user.click(screen.getByRole('button', { name: 'Muat ulang nilai penerimaan' }));
        }
        await user.click(await screen.findByRole('button', { name: 'Catat pembayaran berikutnya' }));
        await act(() => receiptStore.setState({ goodsReceiptDetails: { ...receipt, code: 'OTHER' } }));
        expect(paymentStore.getState().code).toBe('OTHER');
        expect(screen.getByLabelText('Nominal pembayaran')).toHaveValue('');
        expect(supplierPaymentApi.createSupplierPayment).toHaveBeenCalledTimes(1);
    });

    it('requires explicit completion for a fully paid receipt before switching receipts', async () => {
        receiptApi.getGoodsReceiptDetails.mockResolvedValue(response({ ...receipt, outstandingAmount: '0', paymentStatus: 'PAID' }));
        const user = userEvent.setup(); render(<Workflow />);
        await user.click(screen.getByRole('button', { name: /Isi seluruh/ })); await confirm(user);
        await act(() => paymentStore.getState().select('OTHER'));
        expect(paymentStore.getState().result?.id).toBe(28);
        await user.click(screen.getByRole('button', { name: 'Selesai' }));
        expect(screen.getByRole('heading', { name: 'Bayar pemasok untuk penerimaan ini' })).toHaveFocus();
        expect(paymentStore.getState().result).toBeNull();
    });

    it('posts the frozen reviewed intent even if the live draft changes', async () => {
        const user = userEvent.setup(); render(<Workflow />);
        await user.type(screen.getByLabelText('Nominal pembayaran'), '25');
        await user.type(screen.getByLabelText('Catatan (opsional)'), 'Catatan awal');
        await user.click(screen.getByRole('button', { name: 'Tinjau pembayaran' }));
        await act(() => paymentStore.getState().edit({ amount: '99', paymentMethod: 'CASH', reference: 'BARU', note: 'Berubah' }));
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('Rp 25 · Transfer bank')).toBeInTheDocument();
        expect(within(dialog).getByText('Catatan: Catatan awal')).toBeInTheDocument();
        await user.click(within(dialog).getByRole('button', { name: 'Catat pembayaran' }));
        await screen.findByText(/Pembayaran tercatat/);
        expect(supplierPaymentApi.createSupplierPayment.mock.calls[0][1]).toMatchObject({ amount: '25', paymentMethod: 'BANK_TRANSFER', reference: null, note: 'Catatan awal' });
    });

    it('hides and refuses another account recovery without deleting the original attempt', async () => {
        const store = () => paymentStore.getState();
        store().select(receipt.code); store().edit({ amount: '25', paymentMethod: 'QRIS', reference: 'PRIVATE', note: 'Private note' });
        supplierPaymentApi.createSupplierPayment.mockRejectedValueOnce(new Error('timeout'));
        await store().submit(intent());
        const attempt = store().attempt;
        authStore.setState({ authStatus: 'checking' });
        await store().submit();
        authStore.setState({
            authStatus: 'authenticated',
            currentUser: {
                accountId: '202',
                username: 'cashier-a'
            }
        });
        render(<Workflow />);
        expect(screen.getByText(/dikunci untuk akun asal/)).toBeInTheDocument();
        expect(screen.queryByText(attempt.key)).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Catatan (opsional)')).not.toBeInTheDocument();
        await act(async () => { store().select('OTHER'); store().next(); await store().submit(); await store().refresh(); });
        expect(supplierPaymentApi.createSupplierPayment).toHaveBeenCalledTimes(1);
        expect(receiptApi.getGoodsReceiptDetails).not.toHaveBeenCalled();
        expect(store().attempt).toEqual(attempt);
        await act(() => authStore.setState({
            currentUser: {
                accountId: '101',
                username: 'cashier-a'
            }
        }));
        await act(() => paymentStore.persist.rehydrate());
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Pulihkan pembayaran yang sama' }));
        await screen.findByText(/Pembayaran tercatat/);
        expect(supplierPaymentApi.createSupplierPayment.mock.calls[1]).toEqual(supplierPaymentApi.createSupplierPayment.mock.calls[0]);
    });

    it('retains late success for its owner and postpones balance writes after account change', async () => {
        const store = () => paymentStore.getState();
        store().select(receipt.code); store().edit({ amount: '25', paymentMethod: 'QRIS', reference: '', note: '' });
        let resolve;
        supplierPaymentApi.createSupplierPayment.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
        const posting = store().submit(intent());
        authStore.setState({
            currentUser: {
                accountId: '202',
                username: 'cashier-a'
            }
        });
        resolve(await success(...supplierPaymentApi.createSupplierPayment.mock.calls[0])); await posting;
        expect(store()).toMatchObject({
            ownerAccountId: '101',
            result: { id: 28 },
            refreshStatus: 'idle'
        });
        expect(receiptApi.getGoodsReceiptDetails).not.toHaveBeenCalled();
        render(<Workflow />);
        expect(screen.queryByText(/Pembayaran tercatat/)).not.toBeInTheDocument();
        await act(() => authStore.setState({
            currentUser: {
                accountId: '101',
                username: 'cashier-a'
            }
        }));
        await screen.findByText(/Pembayaran tercatat/);
        await waitFor(() => expect(store().refreshStatus).toBe('ready'));
    });

    it.each([
        ['ownerless', {}],
        ['username-only', { owner: 'cashier-a' }]
    ])('quarantines %s legacy recovery rather than assigning it to the next login', async (_, legacyOwner) => {
        paymentStore.setState({
            ...legacyOwner,
            code: 'LEGACY',
            attempt: {
                code: 'LEGACY',
                key: 'legacy-key',
                request: {}
            }
        });
        render(<Workflow />);
        expect(screen.getByText(/Pemulihan lama belum memiliki identitas akun/)).toBeInTheDocument();
        await act(() => paymentStore.getState().submit());
        expect(supplierPaymentApi.createSupplierPayment).not.toHaveBeenCalled();
        expect(paymentStore.getState().attempt.key).toBe('legacy-key');
    });

    it('keeps CASH disabled while rechecking a previously enabled session', async () => {
        cashStore.setState({ currentStatus: 'ready', currentSession: { id: 15, status: 'OPEN' }, drawerActionsEnabled: true });
        let resolve;
        cashApi.getCurrentSession.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
        const user = userEvent.setup(); render(<Workflow />); await choose(user, 'Tunai (CASH)');
        expect(screen.getByText(/Memeriksa sesi kas/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tinjau pembayaran' })).toBeDisabled();
        await act(() => resolve(response(null)));
    });

    it('explains a rejected payment time so the user can fix the clock before reconfirming', async () => {
        supplierPaymentApi.createSupplierPayment.mockRejectedValue({ status: 400, validationErrors: [{ field: 'paidAt', message: 'future' }] });
        const user = userEvent.setup(); render(<Workflow />);
        await user.type(screen.getByLabelText('Nominal pembayaran'), '25'); await confirm(user);
        expect(screen.getByText(/Sinkronkan tanggal\/jam perangkat/)).toBeInTheDocument();
        expect(paymentStore.getState().attempt).toBeNull();
    });

    it('treats the transport deadline as uncertain and retries with the identical key and payload', async () => {
        vi.useFakeTimers();
        try {
            const store = () => paymentStore.getState();
            store().select(receipt.code); store().edit({ amount: '25', paymentMethod: 'QRIS', reference: '', note: '' });
            supplierPaymentApi.createSupplierPayment.mockImplementationOnce(() => new Promise((_, reject) => setTimeout(
                () => reject({ name: 'ApiError', status: null, category: 'network' }), SUPPLIER_PAYMENT_TIMEOUT_MS)));
            const posting = store().submit(intent());
            expect(store().pending).toBe(true);
            await vi.advanceTimersByTimeAsync(SUPPLIER_PAYMENT_TIMEOUT_MS); await posting;
            expect(store()).toMatchObject({ pending: false, outcome: 'uncertain' });
            expect(store().attempt).not.toBeNull();
            await store().submit();
            expect(supplierPaymentApi.createSupplierPayment.mock.calls[1]).toEqual(supplierPaymentApi.createSupplierPayment.mock.calls[0]);
            expect(receiptApi.getGoodsReceiptDetails).toHaveBeenCalledWith(receipt.code, { timeout: SUPPLIER_PAYMENT_TIMEOUT_MS });
        } finally { vi.useRealTimers(); }
    });

    it('validates trimmed optional text consistently with the request', () => {
        const draft = { amount: '25', paymentMethod: 'QRIS', reference: ' '.repeat(256), note: ` ${ 'x'.repeat(255) } ` };
        expect(validatePayment(draft)).toBe('');
        expect(paymentRequest(draft, 'time')).toMatchObject({ reference: null, note: 'x'.repeat(255) });
    });

    it('renders initialization without claiming that an empty store contains another payment', () => {
        const html = renderToString(<SupplierPayment receipt={ receipt } />);
        expect(html).toContain('Memverifikasi akun');
        expect(html).not.toContain('Selesaikan pembayaran sebelumnya');
        expect(html).not.toContain('/goods-receipts/');
    });
});
