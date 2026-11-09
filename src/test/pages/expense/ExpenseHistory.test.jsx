import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';

import expenseApi from '@api/expense.js';
import ExpenseHistory from '@pages/expense/ExpenseHistory.jsx';
import { act, render, screen, waitFor } from '@/test/render.jsx';

vi.mock('@api/expense.js', () => ({ default: { getExpenseList: vi.fn() } }));
const row = { id: 29, amount: '12000.1250', category: 'OWNER_WITHDRAWAL', operationalExpense: false,
    description: 'Keperluan pemilik', cashSessionId: 15, createdAt: '2026-09-10T02:00:00Z', createdBy: 'admin',
    voided: false, canVoid: true, voidBlockReason: null };
const response = (content = [], totalPages = 1, totalElements = content.length) => ({ data: { data: { content, totalPages, totalElements } } });

beforeEach(() => { vi.resetAllMocks(); });

it('covers loading, error/retry, empty, and navigable creation without needing a session', async () => {
    let reject;
    expenseApi.getExpenseList.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    const user = userEvent.setup(); render(<ExpenseHistory />);
    expect(screen.getByRole('status')).toHaveTextContent('Memuat pengeluaran');
    await act(async () => reject(new Error('offline')));
    expect(await screen.findByRole('alert')).toHaveTextContent('gagal dimuat');
    expenseApi.getExpenseList.mockResolvedValue(response([], 0));
    await user.click(screen.getByRole('button', { name: 'Muat ulang riwayat' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Belum ada pengeluaran');
    expect(screen.getByRole('link', { name: 'Catat pengeluaran' })).toHaveAttribute('href', '/expenses/new');
});

it('renders labelled returned facts, eligibility, range, and session links with one paged request', async () => {
    expenseApi.getExpenseList.mockResolvedValue(response([row, {
        ...row,
        id: 30,
        voided: true,
        canVoid: false,
        voidBlockReason: 'ALREADY_VOIDED',
        voidedReason: 'Salah',
        voidedBy: 'manager'
    }], 2));
    const user = userEvent.setup(); render(<ExpenseHistory />, { route: '/expenses?page=1&size=10' });
    const record = await screen.findByRole('row', { name: 'Pengeluaran #29' });
    expect(record).toHaveTextContent('Rp 12.000,125');
    expect(record).toHaveTextContent('#29 · Penarikan pemilik');
    expect(record).toHaveTextContent('Aktif');
    expect(record).toHaveTextContent('Nonoperasional');
    expect(record).toHaveTextContent('10-09-2026');
    expect(screen.getByRole('row', { name: 'Pengeluaran #30' })).toHaveTextContent('Dibatalkan');
    expect(screen.getByText('1–2 dari 2 pengeluaran')).toBeInTheDocument();
    expect(expenseApi.getExpenseList).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('link', { name: 'Sesi kas #15' })[0]).toHaveAttribute('href', '/cash-sessions/15');
    await user.click(screen.getByRole('button', { name: 'Berikutnya' }));
    await waitFor(() => expect(expenseApi.getExpenseList).toHaveBeenLastCalledWith({ page: 2, size: 10 }));
    expect(screen.getAllByRole('button', { name: /^Buka detail pengeluaran/ })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /hapus|ubah/i })).not.toBeInTheDocument();
});

it('canonicalizes unsupported query fields, ignores stale responses and recovers an out-of-range page', async () => {
    let resolve;
    expenseApi.getExpenseList.mockImplementationOnce(() => new Promise(done => { resolve = done; }))
        .mockResolvedValue(response([{ ...row, id: 31 }], 1));
    const user = userEvent.setup(); render(<ExpenseHistory />, { route: '/expenses?page=-1&size=99&category=OTHER' });
    await waitFor(() => expect(expenseApi.getExpenseList).toHaveBeenCalledWith({ page: 1, size: 10 }));
    await user.click(screen.getByLabelText('Per halaman'));
    await user.click(screen.getByRole('option', { name: '25' }));
    expect(await screen.findByRole('row', { name: 'Pengeluaran #31' })).toBeInTheDocument();
    await act(async () => resolve(response([row])));
    expect(screen.queryByRole('row', { name: 'Pengeluaran #29' })).not.toBeInTheDocument();
    render(<ExpenseHistory />, { route: '/expenses?page=5&size=10' });
    await waitFor(() => expect(expenseApi.getExpenseList).toHaveBeenLastCalledWith({ page: 1, size: 10 }));
});
