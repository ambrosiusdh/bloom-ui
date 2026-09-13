import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import StockAdjustmentCreate from '@pages/stock-adjustment/StockAdjustmentCreate.jsx';
import useStockAdjustmentStore from '@stores/modules/stock-adjustment.js';
import {
    act,
    render,
    screen,
    waitFor
} from '@/test/render.jsx';

const itemApi = vi.hoisted(() => ({
    createItem: vi.fn(),
    deactivateItem: vi.fn(),
    getItemAuditLog: vi.fn(),
    getItemDetails: vi.fn(),
    getItemList: vi.fn(),
    updateItem: vi.fn()
}));
const adjustmentApi = vi.hoisted(() => ({
    createStockAdjustment: vi.fn(),
    getStockAdjustmentDetails: vi.fn(),
    getStockAdjustmentList: vi.fn()
}));

vi.mock('@api/item.js', () => ({ default: itemApi }));
vi.mock('@api/stock-adjustment.js', () => ({ default: adjustmentApi }));

const fractionalItem = {
    name: 'Kain katun',
    sku: 'KAIN-1',
    active: true,
    baseUnitOfMeasure: 'METER',
    fractionalQuantityAllowed: true,
    stockStore: '2.0000',
    stockWarehouse: '12.5000'
};
const wholeItem = {
    name: 'Benang gulung',
    sku: 'BENANG-1',
    active: true,
    baseUnitOfMeasure: 'PIECE',
    fractionalQuantityAllowed: false,
    stockStore: '3.0000',
    stockWarehouse: '9.0000'
};
const itemListResponse = (content = [fractionalItem, wholeItem]) => ({
    data: {
        data: {
            content,
            totalElements: content.length,
            totalPages: content.length ? 1 : 0
        }
    }
});
const adjustmentResult = {
    adjustment: {
        stockAdjustmentCode: 'ADJ/IX-2026/0001',
        reason: 'Hitung fisik rak',
        createdBy: 'admin',
        createdAt: '2026-09-12T03:00:00Z',
        items: [{
            id: 8,
            item: fractionalItem,
            actionType: 'CORRECTION',
            stockLocation: 'WAREHOUSE',
            changeQuantity: '0.2500',
            previousStock: '12.5000',
            newStock: '0.2500'
        }]
    },
    movements: [{
        id: 9,
        referenceNo: 'ADJ/IX-2026/0001',
        item: fractionalItem,
        location: 'WAREHOUSE',
        movementType: 'ADJUSTMENT_OUT',
        quantity: '12.2500',
        qtyBefore: '12.5000',
        qtyAfter: '0.2500'
    }]
};
const deferred = () => {
    let reject;
    let resolve;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });

    return { promise, reject, resolve };
};

const selectItem = async (user, label = '[KAIN-1] Kain katun') => {
    await user.click(screen.getByRole('combobox', { name: 'Barang' }));
    await user.click(screen.getByRole('option', { name: label }));
};

const reviewCorrection = async user => {
    await user.type(
        screen.getByRole('textbox', { name: /Alasan penyesuaian/ }),
        'Hitung fisik rak'
    );
    await selectItem(user);
    await user.click(screen.getByRole('combobox', { name: 'Lokasi stok' }));
    await user.click(screen.getByRole('option', { name: 'Gudang (WAREHOUSE)' }));
    await user.click(screen.getByRole('combobox', { name: 'Tindakan' }));
    await user.click(screen.getByRole('option', { name: 'Tetapkan stok absolut (CORRECTION)' }));
    await user.type(
        screen.getByRole('textbox', { name: /Jumlah penyesuaian/ }),
        '0,2500'
    );
    await user.click(screen.getByRole('button', { name: 'Tinjau penyesuaian' }));

    return screen.findByRole('dialog', { name: 'Konfirmasi penyesuaian stok' });
};

describe('StockAdjustmentCreate FE-13 workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        useStockAdjustmentStore.setState(useStockAdjustmentStore.getInitialState());
        itemApi.getItemList.mockResolvedValue(itemListResponse());
    });

    it('shows item loading/error/empty states and recovers through retry', async () => {
        const user = userEvent.setup();
        const firstRequest = deferred();
        itemApi.getItemList
            .mockReturnValueOnce(firstRequest.promise)
            .mockResolvedValueOnce(itemListResponse([]));

        render(<StockAdjustmentCreate />, { route: '/stock-adjustments/new' });

        expect(screen.getByRole('status')).toHaveTextContent('Memuat barang aktif...');
        await act(async () => firstRequest.reject(new Error('Barang gagal dimuat.')));
        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Barang gagal dimuat.');
        await waitFor(() => expect(alert).toHaveFocus());

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByText('Belum ada barang aktif yang dapat disesuaikan.'))
            .toBeInTheDocument();
        expect(itemApi.getItemList).toHaveBeenCalledTimes(2);
    });

    it('focuses required input and enforces whole/fractional and duplicate-SKU rules', async () => {
        const user = userEvent.setup();

        render(<StockAdjustmentCreate />, { route: '/stock-adjustments/new' });
        await screen.findByRole('combobox', { name: 'Barang' });

        await user.click(screen.getByRole('button', { name: 'Tinjau penyesuaian' }));
        expect(screen.getByText('Alasan penyesuaian wajib diisi.')).toBeInTheDocument();
        const reasonInput = screen.getByRole('textbox', { name: /Alasan penyesuaian/ });
        await waitFor(() => expect(reasonInput).toHaveFocus());

        await user.type(reasonInput, 'Hitung fisik');
        await selectItem(user, '[BENANG-1] Benang gulung');
        const firstQuantity = screen.getByRole('textbox', { name: /Jumlah penyesuaian/ });
        await user.type(firstQuantity, '1,5');
        await user.click(screen.getByRole('button', { name: 'Tinjau penyesuaian' }));
        expect(screen.getByText('Barang ini hanya dapat disesuaikan dalam jumlah utuh.'))
            .toBeInTheDocument();

        await user.clear(firstQuantity);
        await user.type(firstQuantity, '1');
        await user.click(screen.getByRole('button', { name: 'Tambah baris' }));
        const itemSelectors = screen.getAllByRole('combobox', { name: 'Barang' });
        await user.click(itemSelectors[1]);
        await user.click(screen.getByRole('option', { name: '[BENANG-1] Benang gulung' }));
        const quantities = screen.getAllByRole('textbox', { name: /Jumlah penyesuaian/ });
        await user.type(quantities[1], '1');
        await user.click(screen.getByRole('button', { name: 'Tinjau penyesuaian' }));

        expect(screen.getByText('Barang yang sama hanya boleh muncul satu kali.'))
            .toBeInTheDocument();
        expect(adjustmentApi.createStockAdjustment).not.toHaveBeenCalled();
    });

    it('freezes and submits one exact request, blocks duplicates, and renders server outcomes', async () => {
        const user = userEvent.setup();
        const request = deferred();
        adjustmentApi.createStockAdjustment.mockReturnValue(request.promise);

        render(<StockAdjustmentCreate />, { route: '/stock-adjustments/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        const dialog = await reviewCorrection(user);

        expect(dialog).toHaveTextContent('Hitung fisik rak');
        expect(dialog).toHaveTextContent('0,25 meter');
        await user.dblClick(screen.getByRole('button', { name: 'Simpan penyesuaian' }));

        expect(adjustmentApi.createStockAdjustment).toHaveBeenCalledTimes(1);
        expect(adjustmentApi.createStockAdjustment).toHaveBeenCalledWith({
            reason: 'Hitung fisik rak',
            items: [{
                itemSku: 'KAIN-1',
                changeQuantity: '0.2500',
                actionType: 'CORRECTION',
                stockLocation: 'WAREHOUSE'
            }]
        }, { useLoader: false });
        expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled();

        await act(async () => request.resolve({ data: { data: adjustmentResult } }));

        expect(await screen.findByText(/berhasil dibukukan oleh server/)).toHaveTextContent(
            'ADJ/IX-2026/0001'
        );
        expect(screen.getByText('Koreksi absolut')).toBeInTheDocument();
        expect(screen.getAllByText('0,25 meter').length).toBeGreaterThan(1);
        expect(screen.getByText(/Stok server:/)).toHaveTextContent('12,5 meter → 0,25 meter');
        expect(itemApi.getItemList).toHaveBeenCalledTimes(2);
    });

    it('loads every active-item page instead of applying a hidden inventory ceiling', async () => {
        itemApi.getItemList
            .mockResolvedValueOnce({
                data: {
                    data: {
                        content: [fractionalItem],
                        totalElements: 101,
                        totalPages: 2
                    }
                }
            })
            .mockResolvedValueOnce({
                data: {
                    data: {
                        content: [wholeItem],
                        totalElements: 101,
                        totalPages: 2
                    }
                }
            });

        const user = userEvent.setup();
        render(<StockAdjustmentCreate />, { route: '/stock-adjustments/new' });

        await user.click(await screen.findByRole('combobox', { name: 'Barang' }));

        expect(screen.getByRole('option', { name: '[KAIN-1] Kain katun' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '[BENANG-1] Benang gulung' })).toBeInTheDocument();
        expect(itemApi.getItemList).toHaveBeenNthCalledWith(1, {
            signal: expect.any(AbortSignal),
            params: {
                page: 1,
                size: 100
            }
        }, { useLoader: false });
        expect(itemApi.getItemList).toHaveBeenNthCalledWith(2, {
            signal: expect.any(AbortSignal),
            params: {
                page: 2,
                size: 100
            }
        }, { useLoader: false });
    });

    it('locks stale conflict data until the active items refresh successfully', async () => {
        const user = userEvent.setup();
        const conflict = Object.assign(new Error('Data berubah.'), {
            category: 'conflict'
        });
        adjustmentApi.createStockAdjustment.mockRejectedValueOnce(conflict);
        itemApi.getItemList
            .mockResolvedValueOnce(itemListResponse())
            .mockRejectedValueOnce(new Error('Refresh gagal.'))
            .mockResolvedValueOnce(itemListResponse());

        render(<StockAdjustmentCreate />, { route: '/stock-adjustments/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        await reviewCorrection(user);
        await user.click(screen.getByRole('button', { name: 'Simpan penyesuaian' }));

        expect(await screen.findByText(/data terbaru gagal dimuat/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tinjau penyesuaian' })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        await waitFor(() => expect(
            screen.getByRole('button', { name: 'Tinjau penyesuaian' })
        ).toBeEnabled());
        expect(screen.getByText(/Data barang terbaru sudah dimuat/)).toBeInTheDocument();
    });

    it('locks the next adjustment until a failed post-success item refresh is repaired', async () => {
        const user = userEvent.setup();
        adjustmentApi.createStockAdjustment.mockResolvedValue({
            data: { data: adjustmentResult }
        });
        itemApi.getItemList
            .mockResolvedValueOnce(itemListResponse())
            .mockRejectedValueOnce(new Error('Refresh gagal.'))
            .mockResolvedValueOnce(itemListResponse());

        render(<StockAdjustmentCreate />, { route: '/stock-adjustments/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        await reviewCorrection(user);
        await user.click(screen.getByRole('button', { name: 'Simpan penyesuaian' }));

        const nextButton = await screen.findByRole('button', {
            name: 'Buat penyesuaian berikutnya'
        });
        expect(nextButton).toBeDisabled();
        expect(screen.getByText(/daftar stok terbaru gagal dimuat/)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

        await waitFor(() => expect(nextButton).toBeEnabled());
    });

    it('refreshes on conflict and durably locks an ambiguous outcome', async () => {
        const user = userEvent.setup();
        const conflict = Object.assign(new Error('Data berubah.'), {
            category: 'conflict'
        });
        adjustmentApi.createStockAdjustment.mockRejectedValueOnce(conflict);

        render(<StockAdjustmentCreate />, { route: '/stock-adjustments/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        await reviewCorrection(user);
        await user.click(screen.getByRole('button', { name: 'Simpan penyesuaian' }));

        const conflictMessage = await screen.findByText(/Stok berubah saat penyesuaian diproses/);
        expect(conflictMessage.closest('[role="alert"]')).toHaveTextContent(
            'Stok berubah saat penyesuaian diproses.'
        );
        expect(itemApi.getItemList).toHaveBeenCalledTimes(2);

        const unknown = Object.assign(new Error('Koneksi putus.'), {
            category: 'network'
        });
        adjustmentApi.createStockAdjustment.mockRejectedValueOnce(unknown);
        await user.click(screen.getByRole('button', { name: 'Tinjau penyesuaian' }));
        await user.click(screen.getByRole('button', { name: 'Simpan penyesuaian' }));

        const unknownMessage = await screen.findByText(/Permintaan mungkin sudah dibukukan/);
        expect(unknownMessage.closest('[role="alert"]')).toHaveTextContent(
            'Permintaan mungkin sudah dibukukan oleh server.'
        );
        expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tinjau penyesuaian' })).toBeDisabled();
        expect(screen.getByRole('link', { name: 'Buka riwayat penyesuaian' })).toHaveAttribute(
            'href',
            '/stock-adjustments'
        );
        expect(JSON.parse(sessionStorage.getItem('bloom-stock-adjustment-v1')).state
            .stockAdjustmentAttempt.payload.reason).toBe('Hitung fisik rak');

        await act(async () => {
            await useStockAdjustmentStore.getState().createStockAdjustment({
                reason: 'Percobaan duplikat',
                items: []
            });
        });

        expect(adjustmentApi.createStockAdjustment).toHaveBeenCalledTimes(2);
    });

    it('treats malformed HTTP success as ambiguous and requires manual reconciliation', async () => {
        const user = userEvent.setup();
        adjustmentApi.createStockAdjustment.mockResolvedValue({
            data: { data: null }
        });

        render(<StockAdjustmentCreate />, { route: '/stock-adjustments/new' });
        await screen.findByRole('combobox', { name: 'Barang' });
        await reviewCorrection(user);
        await user.click(screen.getByRole('button', { name: 'Simpan penyesuaian' }));

        expect(await screen.findByText('Hasil penyesuaian belum dapat dipastikan'))
            .toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tinjau penyesuaian' })).toBeDisabled();
        expect(adjustmentApi.createStockAdjustment).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', {
            name: 'Saya sudah merekonsiliasi hasilnya'
        }));
        expect(screen.getByRole('dialog', { name: 'Konfirmasi rekonsiliasi manual' }))
            .toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Buka kembali formulir' }));

        expect(screen.getByRole('button', { name: 'Tinjau penyesuaian' })).toBeEnabled();
        expect(sessionStorage.getItem('bloom-stock-adjustment-v1')).not.toContain(
            'Hitung fisik rak'
        );
    });
});
