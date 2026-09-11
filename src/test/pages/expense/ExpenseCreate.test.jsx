import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';

import cashApi from '@api/cash-session.js';
import { createExpense } from '@api/expense.js';
import ExpenseCreate from '@pages/expense/ExpenseCreate.jsx';
import authStore from '@stores/modules/auth.js';
import cashStore from '@stores/modules/cash-session.js';
import expenseStore from '@stores/modules/expense.js';
import { EXPENSE_CATEGORIES, expenseRequest, hasExpectedExpenseSession, validateExpense } from '@utils/expense-utils.js';
import { act, render, screen, waitFor, within } from '@/test/render.jsx';

vi.mock('@api/expense.js', () => ({ createExpense: vi.fn(), EXPENSE_TIMEOUT_MS: 15000 }));
vi.mock('@api/cash-session.js', () => ({ default: { getCurrentSession: vi.fn() } }));
const response = data => ({ data: { data } });
const session = { id: 15, status: 'OPEN' };
const saved = { id: 29, cashSessionId: 15, amount: '25.1250', category: 'FOOD_AND_DRINK', description: 'Dari server',
    operationalExpense: true, voided: false, createdAt: '2026-09-10T02:00:00Z', createdBy: 'cashier-a' };
const intent = () => ({ owner: expenseStore.getState().owner, request: expenseRequest(expenseStore.getState().draft, 15) });
const fill = async user => { await user.type(screen.getByLabelText(/Nominal pengeluaran/), '25,125'); };
const confirm = async user => {
    await user.click(screen.getByRole('button', { name: 'Tinjau pengeluaran' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Catat pengeluaran' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
};
beforeEach(() => {
    vi.restoreAllMocks(); vi.resetAllMocks(); sessionStorage.clear();
    expenseStore.setState(expenseStore.getInitialState());
    authStore.setState({ authStatus: 'authenticated', currentUser: { username: 'cashier-a' } });
    cashStore.setState(cashStore.getInitialState());
    cashApi.getCurrentSession.mockResolvedValue(response(session));
    createExpense.mockResolvedValue(response(saved));
});

it('validates the exact six categories, positive decimal amount, and conditional description', () => {
    for (const category of Object.keys(EXPENSE_CATEGORIES)) {
        expect(Object.values(validateExpense({ amount: '999999999999999.9999', category, description: 'Alasan' })).some(Boolean)).toBe(false);
    }
    for (const amount of ['', '0', '-1', '1.00001', '1000000000000000', '1e3', '1,5']) {
        expect(validateExpense({ amount, category: 'OTHER', description: '' }).amount).not.toBe('');
    }
    expect(validateExpense({ amount: '0.0001', category: 'OTHER', description: '  ' }).description).not.toBe('');
    expect(validateExpense({ amount: '1', category: 'FAKE', description: 'a'.repeat(256) })).toMatchObject({ category: expect.any(String), description: expect.any(String) });
});

it('blocks new posting for loading, absent, closed, or failed sessions and supports retry', async () => {
    let resolve;
    cashApi.getCurrentSession.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const user = userEvent.setup(); render(<ExpenseCreate />);
    expect(screen.getByText('Memeriksa sesi kas...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tinjau pengeluaran' })).toBeDisabled();
    await act(async () => resolve(response(null)));
    expect(screen.getByText('Pengeluaran baru memerlukan sesi kas terbuka.')).toBeInTheDocument();
    cashApi.getCurrentSession.mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: 'Periksa sesi kas' }));
    expect(await screen.findByText('Sesi kas gagal diperiksa.')).toBeInTheDocument();
    cashApi.getCurrentSession.mockResolvedValueOnce(response({ id: 15, status: 'CLOSED' }));
    await user.click(screen.getByRole('button', { name: 'Periksa sesi kas' }));
    expect(screen.getByRole('button', { name: 'Tinjau pengeluaran' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Periksa sesi kas' }));
    expect(screen.getByRole('button', { name: 'Tinjau pengeluaran' })).toBeEnabled();
    expect(createExpense).not.toHaveBeenCalled();
});

it('focuses associated validation errors and supports keyboard confirmation, cancel, and server-confirmed success', async () => {
    const user = userEvent.setup(); render(<ExpenseCreate />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tinjau pengeluaran' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Tinjau pengeluaran' }));
    expect(screen.getByLabelText(/Nominal pengeluaran/)).toHaveFocus();
    expect(screen.getByLabelText(/Nominal pengeluaran/)).toHaveAttribute('aria-invalid', 'true');
    await fill(user);
    await user.click(screen.getByLabelText(/Kategori/));
    await user.click(screen.getByRole('option', { name: 'Lainnya' }));
    await user.click(screen.getByRole('button', { name: 'Tinjau pengeluaran' }));
    expect(screen.getByLabelText(/Alasan \/ catatan/)).toHaveFocus();
    await user.type(screen.getByLabelText(/Alasan \/ catatan/), 'Darurat');
    const review = screen.getByRole('button', { name: 'Tinjau pengeluaran' });
    await user.click(review);
    expect(screen.getByRole('button', { name: 'Kembali' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Catat pengeluaran' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(review).toHaveFocus());
    expect(createExpense).not.toHaveBeenCalled();
    await confirm(user);
    const feedback = await screen.findByText('Pengeluaran tercatat.');
    await waitFor(() => expect(feedback.closest('[role="status"]')).toHaveFocus());
    expect(screen.getByRole('article')).toHaveTextContent('Dari server');
    expect(createExpense).toHaveBeenCalledWith({ expectedCashSessionId: 15, amount: '25.125', category: 'OTHER', description: 'Darurat' }, expect.stringMatching(/^expense-/));
    expect(cashApi.getCurrentSession).toHaveBeenCalledWith({ timeout: 15000 });
    await user.click(screen.getByRole('button', { name: 'Catat pengeluaran berikutnya' }));
    expect(screen.getByLabelText(/Nominal pengeluaran/)).toHaveFocus();
    expect(screen.getByLabelText(/Nominal pengeluaran/)).toHaveValue('');
});

it.each([null, { id: 16, status: 'OPEN' }])('recovers the exact request after reload without retargeting to current session %j', async currentSession => {
    let reject;
    createExpense.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    const user = userEvent.setup(); const view = render(<ExpenseCreate />); await fill(user); await confirm(user);
    expect(screen.getByLabelText(/Nominal pengeluaran/)).toBeDisabled();
    await act(() => expenseStore.getState().submit(intent()));
    expect(createExpense).toHaveBeenCalledTimes(1);
    const original = createExpense.mock.calls[0];
    expect(JSON.parse(sessionStorage.getItem('bloom-expense-v1')).state.attempt.key).toBe(original[1]);
    expect(JSON.parse(sessionStorage.getItem('bloom-expense-v1')).state.attempt.request.expectedCashSessionId).toBe(15);
    await act(async () => reject(new Error('timeout')));
    expect((await screen.findByText(/Hasil pengeluaran belum pasti/)).closest('[role="alert"]')).toHaveFocus();
    view.unmount();
    const durable = sessionStorage.getItem('bloom-expense-v1');
    expenseStore.setState(expenseStore.getInitialState()); sessionStorage.setItem('bloom-expense-v1', durable);
    await expenseStore.persist.rehydrate();
    cashApi.getCurrentSession.mockResolvedValue(response(currentSession));
    cashStore.setState({ currentSession, currentStatus: 'ready', drawerActionsEnabled: currentSession?.status === 'OPEN' });
    render(<ExpenseCreate />);
    await user.click(screen.getByRole('button', { name: 'Pulihkan pengeluaran yang sama' }));
    expect(await screen.findByText('Pengeluaran tercatat.')).toBeInTheDocument();
    expect(createExpense.mock.calls[1]).toEqual(original);
    expect(screen.getByRole('article')).toHaveTextContent('Sesi kas #15');
});

it('preserves drafts after a session race and requires another confirmation after preflight detects a different session', async () => {
    const user = userEvent.setup(); render(<ExpenseCreate />); await fill(user);
    cashApi.getCurrentSession.mockResolvedValueOnce(response({ id: 16, status: 'OPEN' }));
    await confirm(user);
    expect(await screen.findByText(/Sesi kas sudah berubah/)).toBeInTheDocument();
    expect(createExpense).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Nominal pengeluaran/)).toHaveValue('25,125');
    cashApi.getCurrentSession.mockResolvedValue(response({ id: 16, status: 'OPEN' }));
    createExpense.mockRejectedValueOnce({ status: 409, domainCode: 'cash_session_conflict' });
    await confirm(user);
    expect(await screen.findByText(/Sesi kas sudah berubah/)).toBeInTheDocument();
    expect(expenseStore.getState().attempt).toBeNull();
    expect(screen.getByLabelText(/Nominal pengeluaran/)).toHaveValue('25,125');
});

it.each([400, 401, 403, 422])('preserves editable input on a definitive first-attempt HTTP %s rejection', async status => {
    createExpense.mockRejectedValueOnce({ status });
    const user = userEvent.setup(); render(<ExpenseCreate />); await fill(user); await confirm(user);
    expect(await screen.findByText(/Pengeluaran ditolak/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nominal pengeluaran/)).toBeEnabled();
    expect(screen.getByLabelText(/Nominal pengeluaran/)).toHaveValue('25,125');
});

it.each([409, 500, 401])('retains the uncertain original attempt after replay fails with HTTP %s', async status => {
    createExpense.mockRejectedValueOnce(new Error('timeout')).mockRejectedValueOnce({ status });
    const user = userEvent.setup(); render(<ExpenseCreate />); await fill(user); await confirm(user);
    const original = expenseStore.getState().attempt;
    await user.click(screen.getByRole('button', { name: 'Pulihkan pengeluaran yang sama' }));
    expect(expenseStore.getState().attempt).toEqual(original);
    expect(screen.getByLabelText(/Nominal pengeluaran/)).toBeDisabled();
});

it('locks idempotency conflicts and hides recovery from a different account', async () => {
    createExpense.mockRejectedValueOnce({ status: 409, domainCode: 'expense_idempotency_conflict' });
    const user = userEvent.setup(); render(<ExpenseCreate />); await fill(user); await confirm(user);
    expect(await screen.findByText(/Identitas pengeluaran ditolak/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pulihkan pengeluaran yang sama' })).not.toBeInTheDocument();
    await act(async () => authStore.setState({ currentUser: { username: 'cashier-b' } }));
    expect(screen.getByRole('alert')).toHaveTextContent('akun asal');
    expect(screen.queryByText(/Referensi pemulihan/)).not.toBeInTheDocument();
    await act(() => expenseStore.getState().submit());
    expect(createExpense).toHaveBeenCalledTimes(1);
});

it('never posts when durable recovery cannot be saved and treats malformed success as uncertain', async () => {
    const user = userEvent.setup(); render(<ExpenseCreate />); await fill(user);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    await confirm(user);
    expect(await screen.findByText(/Pemulihan tidak dapat disimpan/)).toBeInTheDocument();
    expect(createExpense).not.toHaveBeenCalled(); spy.mockRestore();
    createExpense.mockResolvedValueOnce(response({ id: 29 }));
    await confirm(user);
    expect(await screen.findByText(/Hasil pengeluaran belum pasti/)).toBeInTheDocument();
    expect(expenseStore.getState().attempt).not.toBeNull();
});

it('does not post if the session preflight fails or the account changes during that check', async () => {
    const user = userEvent.setup(); render(<ExpenseCreate />); await fill(user);
    cashApi.getCurrentSession.mockRejectedValueOnce(new Error('offline'));
    await confirm(user);
    expect(await screen.findByText(/Pengeluaran belum dikirim/)).toBeInTheDocument();
    expect(createExpense).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Periksa sesi kas' }));
    let resolve;
    cashApi.getCurrentSession.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    await confirm(user);
    await act(async () => authStore.setState({ currentUser: { username: 'cashier-b' } }));
    await act(async () => resolve(response(session)));
    expect(createExpense).not.toHaveBeenCalled();
});

it('retains a confirmed result across a failed session refresh and navigation, without reposting', async () => {
    cashApi.getCurrentSession.mockResolvedValueOnce(response(session)).mockResolvedValueOnce(response(session))
        .mockRejectedValue(new Error('refresh offline'));
    const user = userEvent.setup(); const view = render(<ExpenseCreate />); await fill(user); await confirm(user);
    expect(await screen.findByText('Pengeluaran tercatat.')).toBeInTheDocument();
    await waitFor(() => expect(cashStore.getState().currentStatus).toBe('error'));
    view.unmount(); render(<ExpenseCreate />);
    expect(screen.getByRole('article')).toHaveTextContent('Dari server');
    await act(() => expenseStore.getState().submit());
    expect(createExpense).toHaveBeenCalledTimes(1);
});

it('keeps a late success private until the original account returns', async () => {
    let resolve;
    createExpense.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const user = userEvent.setup(); render(<ExpenseCreate />); await fill(user); await confirm(user);
    await act(async () => authStore.setState({ currentUser: { username: 'cashier-b' } }));
    await act(async () => resolve(response(saved)));
    expect(screen.getByRole('alert')).toHaveTextContent('akun asal');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    await act(async () => authStore.setState({ currentUser: { username: 'cashier-a' } }));
    expect(screen.getByRole('article')).toHaveTextContent('Dari server');
    expect(createExpense).toHaveBeenCalledTimes(1);
});

it('requires a usable confirmed session ID before starting a new attempt', async () => {
    const user = userEvent.setup(); render(<ExpenseCreate />); await fill(user);
    for (const expectedCashSessionId of [undefined, null, 0, -1, 1.5, '15', Number.MAX_SAFE_INTEGER + 1]) {
        expect(hasExpectedExpenseSession({ expectedCashSessionId })).toBe(false);
        await act(() => expenseStore.getState().submit({
            ...intent(), request: { ...intent().request, expectedCashSessionId }
        }));
    }
    expect(createExpense).not.toHaveBeenCalled();
    expect(expenseStore.getState().attempt).toBeNull();
    expect(hasExpectedExpenseSession({ expectedCashSessionId: 15 })).toBe(true);
});

it.each([undefined, 0])('locks persisted old/invalid session intent (%s) without inferring the current session', async expectedCashSessionId => {
    const request = { amount: '25.125', category: 'OTHER', description: 'Lama', expectedCashSessionId };
    const attempt = { key: 'expense-before-upgrade', request };
    sessionStorage.setItem('bloom-expense-v1', JSON.stringify({ version: 0, state: {
        owner: 'cashier-a', draft: { amount: '25.125', category: 'OTHER', description: 'Lama' },
        attempt, result: null, outcome: 'uncertain'
    } }));
    await expenseStore.persist.rehydrate();
    const original = expenseStore.getState().attempt;
    cashStore.setState({ currentSession: { id: 16, status: 'OPEN' }, currentStatus: 'ready', drawerActionsEnabled: true });
    render(<ExpenseCreate />);
    expect(screen.getByText(/Pemulihan lama belum menyimpan sesi kas/).closest('[role="alert"]')).toHaveFocus();
    expect(screen.getByLabelText(/Nominal pengeluaran/)).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Pulihkan pengeluaran yang sama' })).not.toBeInTheDocument();
    await act(async () => {
        expenseStore.getState().edit({ amount: '99', category: 'CHARITY', description: '' });
        expenseStore.getState().next();
        await expenseStore.getState().submit(intent());
    });
    expect(expenseStore.getState().attempt).toEqual(original);
    expect(expenseStore.getState().draft.amount).toBe('25.125');
    expect(JSON.parse(sessionStorage.getItem('bloom-expense-v1')).state.attempt).toEqual(original);
    expect(createExpense).not.toHaveBeenCalled();
});

it('does not accept a returned record for a different cash session as success', async () => {
    createExpense.mockResolvedValueOnce(response({ ...saved, cashSessionId: 16 }));
    const user = userEvent.setup(); render(<ExpenseCreate />); await fill(user); await confirm(user);
    expect(await screen.findByText(/Hasil pengeluaran belum pasti/)).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(expenseStore.getState().attempt.request.expectedCashSessionId).toBe(15);
    await user.click(screen.getByRole('button', { name: 'Pulihkan pengeluaran yang sama' }));
    expect(await screen.findByText('Pengeluaran tercatat.')).toBeInTheDocument();
    expect(createExpense.mock.calls[1]).toEqual(createExpense.mock.calls[0]);
});

it('requires fresh confirmation and a new key after a definitive session conflict', async () => {
    createExpense.mockImplementationOnce(async () => {
        cashApi.getCurrentSession.mockResolvedValue(response({ id: 16, status: 'OPEN' }));
        throw { status: 409, domainCode: 'cash_session_conflict' };
    }).mockResolvedValueOnce(response({ ...saved, cashSessionId: 16 }));
    const user = userEvent.setup(); render(<ExpenseCreate />); await fill(user); await confirm(user);
    expect(await screen.findByText(/Sesi kas sudah berubah/)).toBeInTheDocument();
    expect(createExpense).toHaveBeenCalledTimes(1);
    expect(createExpense.mock.calls[0][0].expectedCashSessionId).toBe(15);
    await user.click(screen.getByRole('button', { name: 'Tinjau pengeluaran' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Sesi yang dikonfirmasi: #16');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Catat pengeluaran' }));
    expect(await screen.findByText('Pengeluaran tercatat.')).toBeInTheDocument();
    expect(createExpense.mock.calls[1][0]).toEqual({ ...createExpense.mock.calls[0][0], expectedCashSessionId: 16 });
    expect(createExpense.mock.calls[1][1]).not.toBe(createExpense.mock.calls[0][1]);
});
