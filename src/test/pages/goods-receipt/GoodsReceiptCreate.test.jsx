import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import goodsReceiptApi from '@api/goods-receipt.js';
import { normalizeApiError } from '@api/index.js';
import itemApi from '@api/item.js';
import supplierApi from '@api/supplier.js';
import { newReceiptDraft, receiptRequest, validateReceipt, validateReceiptDecimal } from '@components/goods-receipt/receipt-create.js';
import GoodsReceiptCreate from '@pages/goods-receipt/GoodsReceiptCreate.jsx';
import useCreate from '@stores/modules/goods-receipt-create.js';
import { act, fireEvent, render, screen, waitFor, within } from '@/test/render.jsx';

vi.mock('@api/goods-receipt.js', () => ({ default: { createGoodsReceipt: vi.fn() } }));
vi.mock('@api/item.js', () => ({ default: { getItemList: vi.fn() } }));
vi.mock('@api/supplier.js', () => ({ default: { getSupplierList: vi.fn() } }));

const supplier = { code: 'SUP-007', name: 'Pemasok Sama', active: true };
const item = { sku: 'KAIN-1', name: 'Kain', active: true, baseUnitOfMeasure: 'METER', fractionalQuantityAllowed: true };
const draft = () => ({ supplier, receivedTime: '2026-09-09T09:15', offset: '+07:00', description: '  Nota 10  ', items: [
    { id: 'line-1', item, quantity: '0,5000', purchasePrice: '25000,1250', stockLocation: 'WAREHOUSE' }
] });
const receipt = {
    code: 'GR/IX-2026/0026', supplierId: 7, supplierCode: supplier.code, supplierName: supplier.name,
    receivedDate: '2026-09-09T02:15:00Z', totalAmount: '17000.25', paidAmount: '1000',
    outstandingAmount: '16000.25', status: 'POSTED', paymentStatus: 'PARTIALLY_PAID',
    items: [{ item, quantity: '0.5', baseUnitOfMeasure: 'METER', purchasePrice: '25000.125', lineTotal: '17000.25', stockLocation: 'WAREHOUSE' }]
};
const response = content => ({ data: { data: { content } } });
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};
const seed = value => useCreate.setState({ draft: value, attempt: null, result: null, pending: false, outcome: 'editing', errors: {} });
const openReview = async user => {
    await user.click(screen.getByRole('button', { name: 'Tinjau penerimaan' }));
    return screen.findByRole('dialog', { name: 'Konfirmasi penerimaan barang' });
};

beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    seed(draft());
    itemApi.getItemList.mockResolvedValue(response([item]));
    supplierApi.getSupplierList.mockResolvedValue(response([supplier]));
    goodsReceiptApi.createGoodsReceipt.mockResolvedValue({ data: { data: receipt } });
});

describe('FE-26 input and exact request boundary', () => {
    it.each(['0', '-1', '1e3', '1.23450', '1.23456', '1,2.3', '1000000000000000', ''])('rejects invalid decimal %s without rounding', value => {
        expect(validateReceiptDecimal(value)).not.toBe('');
    });
    it('preserves precise input strings, enforces item policy, requires location/timezone, and allows separate duplicate lines', () => {
        expect(validateReceiptDecimal('999999999999999,9999')).toBe('');
        expect(validateReceiptDecimal('2.0000', false)).toBe('');
        expect(validateReceiptDecimal('0.5', false)).toMatch(/utuh/);
        const input = draft();
        input.items.push({ ...input.items[0], id: 'line-2', purchasePrice: '10.01', stockLocation: 'STORE' });
        expect(validateReceipt(input)).toEqual({});
        expect(receiptRequest(input)).toEqual({ supplierCode: 'SUP-007', receivedDate: '2026-09-09T02:15:00.000Z', description: 'Nota 10',
            items: [ { itemSku: 'KAIN-1', quantity: '0.5', purchasePrice: '25000.125', stockLocation: 'WAREHOUSE' },
                { itemSku: 'KAIN-1', quantity: '0.5', purchasePrice: '10.01', stockLocation: 'STORE' } ] });
        expect(input.items[0].quantity).toBe('0,5000');
        input.offset = '';
        input.receivedTime = '2026-02-31T09:15';
        input.items[0].stockLocation = '';
        expect(validateReceipt(input)).toMatchObject({ offset: expect.any(String), receivedTime: expect.any(String), 'items[0].stockLocation': expect.any(String) });
    });
    it('normalizes the verified backend idempotency conflict', () => {
        expect(normalizeApiError({ response: { status: 409, data: { errorType: 'GoodsReceiptIdempotencyConflictException' } } })).toMatchObject({
            category: 'conflict', domainCode: 'goods_receipt_idempotency_conflict'
        });
    });
});

describe('FE-26 atomic posting and recovery', () => {
    it('does not submit if the recovery payload cannot be saved in the browser', async () => {
        const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
        try {
            await useCreate.getState().submit();
            expect(goodsReceiptApi.createGoodsReceipt).not.toHaveBeenCalled();
            expect(useCreate.getState()).toMatchObject({ draft: draft(), pending: false, attempt: null, outcome: 'storageUnavailable' });
        } finally { storage.mockRestore(); }
    });
    it('reviews all intent, traps/restores focus, prevents duplicate submits, then focuses only server truth', async () => {
        const user = userEvent.setup();
        const pending = deferred();
        goodsReceiptApi.createGoodsReceipt.mockReturnValue(pending.promise);
        render(<GoodsReceiptCreate />);
        const dialog = await openReview(user);
        expect(dialog).toHaveTextContent('SUP-007');
        expect(dialog).toHaveTextContent('0,5000 meter');
        expect(dialog).toHaveTextContent('WAREHOUSE');
        expect(within(dialog).getByRole('button', { name: 'Kembali' })).toHaveFocus();
        await user.keyboard('{Shift>}{Tab}{/Shift}');
        expect(within(dialog).getByRole('button', { name: 'Simpan penerimaan' })).toHaveFocus();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(screen.getByRole('button', { name: 'Tinjau penerimaan' })).toHaveFocus();
        expect(goodsReceiptApi.createGoodsReceipt).not.toHaveBeenCalled();
        await openReview(user);
        await user.dblClick(screen.getByRole('button', { name: 'Simpan penerimaan' }));
        expect(goodsReceiptApi.createGoodsReceipt).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Kembali' })).toBeDisabled();
        await user.keyboard('{Escape}');
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(goodsReceiptApi.createGoodsReceipt).toHaveBeenCalledWith(receiptRequest(draft()), expect.stringMatching(/^receipt-/), { useLoader: false });
        await act(async () => pending.resolve({ data: { data: receipt } }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(screen.getByRole('status')).toHaveTextContent(receipt.code);
        expect(screen.getByRole('status')).toHaveFocus();
        expect(screen.getByLabelText('Status penerimaan: Dibukukan')).toBeInTheDocument();
        expect(screen.getByLabelText('Status pembayaran: Dibayar sebagian')).toBeInTheDocument();
        expect(screen.getAllByText('Rp 17.000,25').length).toBeGreaterThan(0);
        expect(screen.getByText('Rp 1.000')).toBeInTheDocument();
        expect(screen.getByText('Rp 16.000,25')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Simpan penerimaan' })).not.toBeInTheDocument();
    });
    it.each([400, 404, 409, 422, 401, 403])('preserves draft on known HTTP %s rejection', async status => {
        goodsReceiptApi.createGoodsReceipt.mockRejectedValue({ status });
        await useCreate.getState().submit();
        expect(useCreate.getState()).toMatchObject({ draft: draft(), attempt: null, pending: false, result: null });
        expect(useCreate.getState().outcome).not.toBe('uncertain');
    });
    it('maps server field errors, focuses the affected line and keeps comma drafts', async () => {
        const user = userEvent.setup();
        goodsReceiptApi.createGoodsReceipt.mockRejectedValue({ status: 400, validationErrors: [{ field: 'items[0].purchasePrice', message: 'Rejected' }] });
        render(<GoodsReceiptCreate />);
        await openReview(user);
        await user.click(screen.getByRole('button', { name: 'Simpan penerimaan' }));
        const price = screen.getByRole('textbox', { name: /Harga beli baris 1/ });
        await waitFor(() => expect(price).toHaveFocus());
        expect(price).toHaveValue('25000,1250');
        expect(price).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('textbox', { name: 'Jumlah baris 1' })).toHaveValue('0,5000');
    });
    it('freezes uncertain submissions, retains the key across reload, and replays exactly once explicitly', async () => {
        const user = userEvent.setup();
        const pending = deferred();
        goodsReceiptApi.createGoodsReceipt.mockReturnValueOnce(pending.promise);
        const view = render(<GoodsReceiptCreate />);
        await openReview(user);
        await user.click(screen.getByRole('button', { name: 'Simpan penerimaan' }));
        const original = goodsReceiptApi.createGoodsReceipt.mock.calls[0];
        const stored = sessionStorage.getItem('bloom-receipt-create-v1');
        expect(JSON.parse(stored).state.outcome).toBe('uncertain');
        view.unmount();
        await act(async () => pending.reject({ status: 503 }));
        // Rehydrate the persisted pending snapshot, as a reload would.
        sessionStorage.setItem('bloom-receipt-create-v1', stored);
        await useCreate.persist.rehydrate();
        render(<GoodsReceiptCreate />);
        expect(screen.getByRole('textbox', { name: 'Jumlah baris 1' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'Coba kembali permintaan yang sama' }));
        await user.click(screen.getByRole('button', { name: 'Simpan penerimaan' }));
        await waitFor(() => expect(useCreate.getState().result).toEqual(receipt));
        expect(goodsReceiptApi.createGoodsReceipt.mock.calls[1]).toEqual(original);
    });
    it('keeps a replay rejection or idempotency conflict frozen and never issues a new key', async () => {
        goodsReceiptApi.createGoodsReceipt.mockRejectedValueOnce({ status: 500 }).mockRejectedValueOnce({ status: 400 });
        await useCreate.getState().submit();
        const attempt = useCreate.getState().attempt;
        await useCreate.getState().submit();
        expect(useCreate.getState()).toMatchObject({ attempt, outcome: 'uncertain' });
        goodsReceiptApi.createGoodsReceipt.mockRejectedValue({ status: 409, domainCode: 'goods_receipt_idempotency_conflict' });
        await useCreate.getState().submit();
        useCreate.getState().updateDraft(newReceiptDraft());
        useCreate.getState().reset();
        expect(useCreate.getState()).toMatchObject({ attempt, draft: draft(), outcome: 'keyConflict' });
    });
    it('treats incomplete success as uncertain and guards simultaneous calls', async () => {
        goodsReceiptApi.createGoodsReceipt.mockResolvedValue({ data: { data: { code: 'GR-1' } } });
        await Promise.all([useCreate.getState().submit(), useCreate.getState().submit()]);
        expect(goodsReceiptApi.createGoodsReceipt).toHaveBeenCalledTimes(1);
        expect(useCreate.getState()).toMatchObject({ outcome: 'uncertain', result: null });
    });
});

describe('FE-26 selection, line editing and responsive structure', () => {
    it('selects stable supplier identity, adds repeated items with separate prices/locations, and moves focus on add/remove', async () => {
        const user = userEvent.setup();
        seed(newReceiptDraft());
        supplierApi.getSupplierList.mockResolvedValue(response([supplier, { ...supplier, code: 'SUP-008' }]));
        render(<GoodsReceiptCreate />);
        await user.click(screen.getByRole('button', { name: 'Tinjau penerimaan' }));
        expect(screen.getByRole('combobox', { name: 'Pemasok' })).toHaveFocus();
        await user.click(screen.getByRole('combobox', { name: 'Pemasok' }));
        await user.click(await screen.findByRole('option', { name: '[SUP-008] Pemasok Sama' }));
        expect(useCreate.getState().draft.supplier.code).toBe('SUP-008');
        const add = async () => {
            await user.click(screen.getByRole('combobox', { name: 'Tambah barang (SKU / nama)' }));
            await user.click(await screen.findByRole('option', { name: '[KAIN-1] Kain' }));
        };
        await add();
        expect(screen.getByRole('textbox', { name: 'Jumlah baris 1' })).toHaveFocus();
        await user.clear(screen.getByRole('textbox', { name: 'Jumlah baris 1' }));
        await user.type(screen.getByRole('textbox', { name: 'Jumlah baris 1' }), '0,50');
        await user.type(screen.getByRole('textbox', { name: /Harga beli baris 1/ }), '12,5000');
        await add();
        expect(screen.getByRole('textbox', { name: 'Jumlah baris 2' })).toHaveFocus();
        expect(screen.getAllByRole('article')).toHaveLength(2);
        expect(screen.getByRole('textbox', { name: 'Jumlah baris 1' })).toHaveValue('0,50');
        expect(screen.getByRole('textbox', { name: /Harga beli baris 1/ })).toHaveValue('12,5000');
        const layout = screen.getByRole('textbox', { name: /Harga beli baris 1/ }).closest('.grid');
        expect(layout).toHaveClass('grid-cols-1', 'lg:grid-cols-3');
        await user.click(screen.getByRole('button', { name: 'Hapus baris 1' }));
        expect(screen.getByRole('textbox', { name: 'Jumlah baris 1' })).toHaveFocus();
        expect(screen.getByRole('textbox', { name: /Harga beli baris 1/ })).toHaveValue('');
        await user.click(screen.getByRole('button', { name: 'Hapus baris 1' }));
        expect(screen.getByRole('combobox', { name: 'Tambah barang (SKU / nama)' })).toHaveFocus();
        expect(screen.getByText('Belum ada barang. Cari barang untuk menambahkan baris.')).toBeInTheDocument();
        expect(itemApi.getItemList).toHaveBeenCalledWith(expect.objectContaining({ params: { page: 1, size: 20, skuOrName: '' } }));
    }, 10000);
    it('shows lookup loading/error/retry/empty and discards stale search results', async () => {
        const user = userEvent.setup();
        const old = deferred();
        supplierApi.getSupplierList.mockRejectedValueOnce(new Error('offline')).mockReturnValueOnce(old.promise).mockResolvedValue(response([]));
        seed(newReceiptDraft());
        render(<GoodsReceiptCreate />);
        expect(screen.getByText('Memuat pemasok...')).toBeInTheDocument();
        expect(await screen.findByText('Pilihan pemasok gagal dimuat.')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        await waitFor(() => expect(supplierApi.getSupplierList).toHaveBeenCalledTimes(2));
        await user.type(screen.getByRole('combobox', { name: 'Pemasok' }), 'baru');
        await waitFor(() => expect(supplierApi.getSupplierList).toHaveBeenCalledTimes(3));
        await act(async () => old.resolve(response([supplier])));
        expect(screen.queryByRole('option', { name: '[SUP-007] Pemasok Sama' })).not.toBeInTheDocument();
        expect(await screen.findByText('Tidak ada hasil aktif. Ubah pencarian.')).toBeInTheDocument();
    });
    it('focuses invalid quantity and requires explicit location without submitting', async () => {
        const user = userEvent.setup();
        render(<GoodsReceiptCreate />);
        fireEvent.change(screen.getByRole('textbox', { name: 'Jumlah baris 1' }), { target: { value: '0,50000' } });
        await user.click(screen.getByRole('button', { name: 'Tinjau penerimaan' }));
        expect(screen.getByRole('textbox', { name: 'Jumlah baris 1' })).toHaveFocus();
        expect(screen.getByText(/Maksimal 4 angka desimal; nilai tidak dibulatkan/)).toBeInTheDocument();
        expect(goodsReceiptApi.createGoodsReceipt).not.toHaveBeenCalled();
    });
});
