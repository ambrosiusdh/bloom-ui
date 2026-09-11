import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';

import cashApi from '@api/cash-session.js';
import expenseApi from '@api/expense.js';
import ExpenseHistory from '@pages/expense/ExpenseHistory.jsx';
import authStore from '@stores/modules/auth.js';
import cashStore from '@stores/modules/cash-session.js';
import store from '@stores/modules/expense-void.js';
import { canVoidExpense, validExpenseVoidRecord, validateExpenseVoidReason } from '@utils/expense-utils.js';
import { act, render, screen, waitFor, within } from '@/test/render.jsx';

vi.mock('@api/expense.js', () => ({
    default: {
        getExpenseList: vi.fn(),
        getExpense: vi.fn(),
        voidExpense: vi.fn()
    },
    EXPENSE_TIMEOUT_MS: 15000
}));
vi.mock('@api/cash-session.js', () => ({
    default: {
        getSessionDetails: vi.fn(),
        getCurrentSession: vi.fn()
    }
}));

const response = data => ({ data: { data } });

const row = {
    id: 29,
    amount: '12.1250',
    category: 'CHARITY',
    operationalExpense: true,
    description: 'Asli',
    cashSessionId: 15,
    createdAt: '2026-09-11T02:00:00Z',
    createdBy: 'cashier',
    voided: false,
    canVoid: true,
    voidBlockReason: null
};

const voided = {
    ...row,
    voided: true,
    canVoid: false,
    voidBlockReason: 'ALREADY_VOIDED',
    voidedReason: 'Audit server',
    voidedBy: 'manager',
    voidedAt: '2026-09-11T03:00:00Z'
};

const closed = {
    ...row,
    canVoid: false,
    voidBlockReason: 'CASH_SESSION_CLOSED'
};

const deferred = () => {
    let resolve;
    const promise = new Promise(done => {
        resolve = done;
    });
    return {
        promise,
        resolve
    };
};

const begin = async () => {
    await store.getState().begin(row);
    store.getState().edit('  Salah catat  ');
};

const openDialog = async user => {
    await user.click(await screen.findByRole('button', { name: 'Batalkan pengeluaran #29' }));
    const field = await screen.findByLabelText(/Alasan pembatalan/);
    await waitFor(() => expect(field).toBeEnabled());
    return field;
};

beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    sessionStorage.clear();
    store.setState(store.getInitialState());
    cashStore.setState(cashStore.getInitialState());
    authStore.setState({
        authStatus: 'authenticated',
        currentUser: { username: 'cashier' }
    });
    expenseApi.getExpenseList.mockResolvedValue(response({
        content: [row],
        totalPages: 1
    }));
    expenseApi.getExpense.mockResolvedValue(response(row));
    expenseApi.voidExpense.mockResolvedValue(response(voided));
    cashApi.getSessionDetails.mockResolvedValue(response({
        id: 15,
        status: 'OPEN',
        expectedClosingCash: '876.5432'
    }));
    cashApi.getCurrentSession.mockResolvedValue(response({
        id: 99,
        status: 'OPEN'
    }));
});

it('fails closed for missing/unknown eligibility and validates nonblank bounded reasons', () => {
    for (const value of [{
        ...row,
        canVoid: undefined
    }, {
        ...row,
        voidBlockReason: 'NEW_RULE'
    }, closed, voided]) {
        expect(canVoidExpense(value)).toBe(false);
    }
    for (const reason of ['', '   ', 'x'.repeat(256)]) {
        expect(validateExpenseVoidReason(reason)).not.toBe('');
    }
    expect(validateExpenseVoidReason('x'.repeat(255))).toBe('');
});

it('renders backend eligibility for history without per-row reads or actions for blocked records', async () => {
    expenseApi.getExpenseList.mockResolvedValue(response({
        content: [row, {
            ...closed,
            id: 30
        }, {
            ...voided,
            id: 31
        }],
        totalPages: 1
    }));
    render(<ExpenseHistory />);
    expect(await screen.findByText('Dapat dibatalkan menurut server.')).toBeInTheDocument();
    expect(screen.getByText(/Sesi kas sudah ditutup/)).toBeInTheDocument();
    expect(screen.getByText(/Sudah dibatalkan. Catatan audit/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Batalkan pengeluaran/ })).toHaveLength(1);
    expect(expenseApi.getExpense).not.toHaveBeenCalled();
});

it('requires a reason, focuses its error, and returns focus to the unchanged trigger after keyboard cancellation', async () => {
    const user = userEvent.setup();
    render(<ExpenseHistory />);
    const field = await openDialog(user);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Konfirmasi pembatalan pengeluaran #29');
    await user.click(screen.getByRole('button', { name: 'Konfirmasi pembatalan' }));
    expect(field).toHaveFocus();
    expect(field).toHaveAccessibleDescription('Alasan pembatalan wajib diisi.');
    await user.type(field, 'Batal');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Batalkan pengeluaran #29' })).toHaveFocus();
    expect(expenseApi.getExpenseList).toHaveBeenCalledTimes(1);
    expect(expenseApi.voidExpense).not.toHaveBeenCalled();
});

it('locks pending confirmation, renders original/server audit and drawer values, and refreshes history', async () => {
    const pending = deferred();
    expenseApi.voidExpense.mockReturnValue(pending.promise);
    const user = userEvent.setup();
    render(<ExpenseHistory />);
    const field = await openDialog(user);
    await user.type(field, '  Salah catat  ');
    expenseApi.getExpense.mockResolvedValue(response(voided));
    await user.dblClick(screen.getByRole('button', { name: 'Konfirmasi pembatalan' }));
    expect(expenseApi.voidExpense).toHaveBeenCalledTimes(1);
    expect(expenseApi.voidExpense).toHaveBeenCalledWith(29, { reason: 'Salah catat' });
    expect(field).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => pending.resolve(response(voided)));
    const dialog = within(screen.getByRole('dialog'));
    expect(await dialog.findByRole('status')).toHaveTextContent('Server mengonfirmasi pengeluaran sudah dibatalkan');
    expect(dialog.getByRole('status')).toHaveFocus();
    expect(dialog.getByRole('article')).toHaveTextContent('Asli');
    expect(dialog.getByRole('article')).toHaveTextContent('Audit server');
    expect(dialog.getByRole('article')).toHaveTextContent('manager');
    expect(dialog.getByText(/Kas yang diharapkan menurut server/)).toHaveTextContent('876,5432');
    expect(cashApi.getSessionDetails).toHaveBeenCalledWith(15, { timeout: 15000 });
    expect(cashStore.getState().currentSession.id).toBe(99);
    expect(expenseApi.getExpenseList).toHaveBeenCalledTimes(2);
});

it.each([closed, voided])('refreshes stale list eligibility before allowing confirmation: $voidBlockReason', async record => {
    expenseApi.getExpense.mockResolvedValue(response(record));
    const user = userEvent.setup();
    render(<ExpenseHistory />);
    await user.click(await screen.findByRole('button', { name: 'Batalkan pengeluaran #29' }));
    await waitFor(() => expect(store.getState().pending).toBe(false));
    const submit = screen.queryByRole('button', { name: 'Konfirmasi pembatalan' });
    if (submit) {
        expect(submit).toBeDisabled();
    }
    expect(expenseApi.voidExpense).not.toHaveBeenCalled();
});

it('preserves the reason and blocks another post after a close conflict', async () => {
    await begin();
    expenseApi.voidExpense.mockRejectedValue({
        status: 409,
        domainCode: 'cash_session_conflict'
    });
    expenseApi.getExpense.mockResolvedValue(response(closed));
    await store.getState().submit();
    expect(store.getState()).toMatchObject({
        record: closed,
        reason: 'Salah catat',
        attempt: null,
        pending: false
    });
    expect(store.getState().notice).toMatch(/sudah ditutup/);
    await store.getState().submit();
    expect(expenseApi.voidExpense).toHaveBeenCalledTimes(1);
});

it.each([{ status: 409 }, { status: 503 }, new Error('timeout')])('recovers uncertain/conflicting responses by GET and renders a prior reversal', async error => {
    await begin();
    expenseApi.voidExpense.mockRejectedValue(error);
    expenseApi.getExpense.mockResolvedValue(response(voided));
    await store.getState().submit();
    expect(store.getState()).toMatchObject({
        outcome: 'confirmed',
        attempt: null,
        record: voided
    });
    await store.getState().submit();
    expect(expenseApi.voidExpense).toHaveBeenCalledTimes(1);
});

it('persists uncertain intent, prevents duplicate calls, and replays the same reason after reload', async () => {
    await begin();
    const pending = deferred();
    expenseApi.voidExpense.mockReturnValueOnce(pending.promise);
    const posting = store.getState().submit();
    await store.getState().submit();
    store.getState().close();
    store.getState().edit('Changed');
    expect(store.getState().open).toBe(true);
    expect(expenseApi.voidExpense).toHaveBeenCalledTimes(1);
    expenseApi.getExpense.mockRejectedValue(new Error('offline'));
    pending.resolve(response({
        ...voided,
        id: 999
    }));
    await posting;
    const persisted = sessionStorage.getItem('bloom-expense-void-v1');
    store.setState(store.getInitialState());
    sessionStorage.setItem('bloom-expense-void-v1', persisted);
    await store.persist.rehydrate();
    expect(store.getState()).toMatchObject({
        attempt: 'Salah catat',
        outcome: 'uncertain',
        pending: false
    });
    expenseApi.voidExpense.mockRejectedValueOnce({
        status: 409,
        domainCode: 'cash_session_conflict'
    });
    await store.getState().submit();
    expect(store.getState().attempt).toBe('Salah catat');
    expenseApi.getExpense.mockResolvedValue(response(voided));
    await store.getState().submit();
    expect(expenseApi.voidExpense.mock.calls.every(call => call[0] === 29 && call[1].reason === 'Salah catat')).toBe(true);
    expect(store.getState().outcome).toBe('confirmed');
});

it('retains confirmed results when refresh fails, and retries reads without another POST', async () => {
    await begin();
    expenseApi.getExpense.mockRejectedValue(new Error('offline'));
    cashApi.getSessionDetails.mockRejectedValue(new Error('offline'));
    await store.getState().submit();
    expect(store.getState()).toMatchObject({
        outcome: 'confirmed',
        record: voided,
        refreshError: true
    });
    expenseApi.getExpense.mockResolvedValue(response(voided));
    cashApi.getSessionDetails.mockResolvedValue(response({
        id: 15,
        status: 'CLOSED',
        expectedClosingCash: '1'
    }));
    await store.getState().refresh();
    await store.getState().submit();
    expect(store.getState().refreshError).toBe(false);
    expect(expenseApi.voidExpense).toHaveBeenCalledTimes(1);
});

it('blocks another account from displaying or replaying an unresolved attempt', async () => {
    await begin();
    expenseApi.voidExpense.mockRejectedValue(new Error('offline'));
    expenseApi.getExpense.mockRejectedValue(new Error('offline'));
    await store.getState().submit();
    authStore.setState({ currentUser: { username: 'another' } });
    render(<ExpenseHistory />);
    expect(screen.getByText(/dikunci untuk akun asal/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await store.getState().submit();
    expect(expenseApi.voidExpense).toHaveBeenCalledTimes(1);
});

it('blocks sending if recovery cannot be saved and handles detail read failures without mutation', async () => {
    expenseApi.getExpense.mockRejectedValueOnce(new Error('offline'));
    await store.getState().begin(row);
    expect(store.getState().outcome).toBe('readError');
    await store.getState().submit();
    expect(expenseApi.voidExpense).not.toHaveBeenCalled();
    await store.getState().refresh();
    store.getState().edit('Salah');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('full');
    });
    await store.getState().submit();
    expect(store.getState().outcome).toBe('storageError');
    expect(expenseApi.voidExpense).not.toHaveBeenCalled();
});

it('does not invalidate history for repeated unchanged eligibility reads', async () => {
    await begin();
    await store.getState().refresh();
    await store.getState().refresh();

    expect(store.getState().historyRevision).toBe(0);

    expenseApi.getExpense.mockResolvedValue(response(closed));
    await store.getState().refresh();
    expect(store.getState().historyRevision).toBe(1);
    await store.getState().refresh();
    expect(store.getState().historyRevision).toBe(1);
});

it('invalidates once when recovery discovers a void, without invalidating later unchanged reads', async () => {
    await begin();
    expenseApi.voidExpense.mockRejectedValue(new Error('timeout'));
    expenseApi.getExpense.mockResolvedValue(response(voided));

    await store.getState().submit();
    await store.getState().refresh();

    expect(store.getState().historyRevision).toBe(1);
});

it('retains a confirmed POST when a stale GET reports the expense as active', async () => {
    await begin();
    await store.getState().submit();

    expect(store.getState()).toMatchObject({
        record: voided,
        outcome: 'confirmed',
        attempt: null,
        refreshError: true,
        historyRevision: 1
    });

    await store.getState().refresh();
    await store.getState().submit();
    expect(store.getState().record).toEqual(voided);
    expect(expenseApi.voidExpense).toHaveBeenCalledTimes(1);
});

it.each([
    { amount: '12.1251' },
    { category: 'OTHER' },
    { description: 'Changed' },
    { operationalExpense: false },
    { createdAt: '2026-09-12T02:00:00Z' },
    { createdBy: 'another' }
])('rejects changed original facts in POST and recovery GET: %j', async changed => {
    await begin();
    const altered = {
        ...voided,
        ...changed
    };
    expenseApi.voidExpense.mockResolvedValue(response(altered));
    expenseApi.getExpense.mockResolvedValue(response(altered));

    await store.getState().submit();

    expect(store.getState()).toMatchObject({
        record: row,
        outcome: 'uncertain',
        attempt: 'Salah catat',
        refreshError: true
    });
});

it('compares equivalent decimals exactly and rejects malformed values or replacement void audit', () => {
    for (const amount of ['12.125', '00012.125000', 12.125]) {
        expect(validExpenseVoidRecord({
            ...voided,
            amount
        }, row)).toBe(true);
    }

    for (const amount of [null, '', 'NaN', '12.1251']) {
        expect(validExpenseVoidRecord({
            ...voided,
            amount
        }, row)).toBe(false);
    }

    expect(validExpenseVoidRecord({
        ...voided,
        voidedReason: 'Replacement audit'
    }, voided)).toBe(false);
});

it('preserves an unresolved attempt across owner changes and rehydration without freeing other reversal actions', async () => {
    await begin();
    expenseApi.voidExpense.mockRejectedValue(new Error('timeout'));
    expenseApi.getExpense.mockRejectedValue(new Error('offline'));
    await store.getState().submit();

    const persisted = sessionStorage.getItem('bloom-expense-void-v1');
    store.setState(store.getInitialState());
    sessionStorage.setItem('bloom-expense-void-v1', persisted);
    await store.persist.rehydrate();

    authStore.setState({ currentUser: { username: 'another' } });
    render(<ExpenseHistory />);
    expect(await screen.findByRole('button', { name: 'Batalkan pengeluaran #29' })).toBeDisabled();
    await store.getState().begin({
        ...row,
        id: 40
    });
    await store.getState().submit();
    expect(store.getState().record.id).toBe(29);
    expect(expenseApi.voidExpense).toHaveBeenCalledTimes(1);

    await act(async () => {
        authStore.setState({ currentUser: { username: 'cashier' } });
    });
    await waitFor(() => expect(store.getState().pending).toBe(false));
    expenseApi.voidExpense.mockResolvedValue(response(voided));
    expenseApi.getExpense.mockResolvedValue(response(voided));
    await act(async () => store.getState().submit());
    expect(store.getState().outcome).toBe('confirmed');
});
