import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ItemBulkBarcodeDialog from '@components/item/ItemBulkBarcodeDialog.jsx';
import { render, screen, waitFor } from '@/test/render.jsx';

const itemApi = vi.hoisted(() => ({
    downloadBulkBarcodes: vi.fn()
}));

vi.mock('@api/item.js', () => ({ default: itemApi }));

describe('ItemBulkBarcodeDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: vi.fn(() => 'blob:barcode-pdf')
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            value: vi.fn()
        });
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    it('repeats SKUs for requested label copies and downloads the PDF', async () => {
        const user = userEvent.setup();
        itemApi.downloadBulkBarcodes.mockResolvedValue({
            data: new Blob(['pdf'], { type: 'application/pdf' })
        });
        render(
            <ItemBulkBarcodeDialog
                open
                items={ [
                    { sku: 'KAIN-00001', name: 'Kain katun' },
                    { sku: 'BENANG-00002', name: 'Benang putih' }
                ] }
                onClose={ vi.fn() }
            />
        );

        await user.click(screen.getByRole('button', { name: 'Tambah label Kain katun' }));
        await user.click(screen.getByRole('button', { name: 'Unduh PDF (3)' }));

        expect(itemApi.downloadBulkBarcodes).toHaveBeenCalledWith([
            'KAIN-00001',
            'KAIN-00001',
            'BENANG-00002'
        ], { useLoader: false });
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'PDF barcode berhasil dibuat dan diunduh'
        );
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:barcode-pdf');
    });

    it('prevents a request above the 100-label limit', async () => {
        const user = userEvent.setup();
        render(
            <ItemBulkBarcodeDialog
                open
                items={ [
                    { sku: 'KAIN-00001', name: 'Kain katun' },
                    { sku: 'BENANG-00002', name: 'Benang putih' }
                ] }
                onClose={ vi.fn() }
            />
        );

        const quantity = screen.getByRole('spinbutton', { name: 'Jumlah label Kain katun' });
        await user.clear(quantity);
        await user.type(quantity, '100');

        expect(screen.getByRole('alert')).toHaveTextContent('Total 101 label melebihi batas 100');
        expect(screen.getByRole('button', { name: 'Unduh PDF (101)' })).toBeDisabled();
        await waitFor(() => expect(itemApi.downloadBulkBarcodes).not.toHaveBeenCalled());
    });
});
