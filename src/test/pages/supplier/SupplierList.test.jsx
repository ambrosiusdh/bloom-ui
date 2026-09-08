import { beforeEach, describe, expect, it, vi } from 'vitest';

import supplierApi from '@api/supplier.js';
import SupplierList from '@pages/supplier/SupplierList.jsx';
import useSupplierStore from '@stores/modules/supplier.js';
import { fireEvent, render, screen, waitFor } from '@/test/render.jsx';

vi.mock('@api/supplier.js', () => ({
    default: {
        getSupplierList: vi.fn(),
        getSupplierDetails: vi.fn()
    }
}));

const supplier = {
    code: 'SUP-001',
    name: 'Nusantara Tekstil',
    contactNumber: '08123456789',
    address: 'Jl. Melati 7',
    active: true
};

const response = ({ content = [], totalPages = content.length ? 1 : 0 } = {}) => ({
    data: {
        data: { content, totalPages, totalElements: content.length }
    }
});

describe('SupplierList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSupplierStore.setState({
            supplierList: [],
            supplierPaging: {},
            listStatus: 'idle',
            listError: null
        });
    });

    it('renders the supplier read model and active state without enrichment calls', async () => {
        supplierApi.getSupplierList.mockResolvedValue(response({ content: [supplier] }));
        render(<SupplierList />, { route: '/suppliers' });

        expect((await screen.findAllByText('Nusantara Tekstil')).length).toBeGreaterThan(0);
        expect(screen.getAllByText('SUP-001').length).toBeGreaterThan(0);
        expect(screen.getAllByText('08123456789').length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText('Status pemasok: Aktif').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('link', { name: /detail.*Nusantara Tekstil/i })[0])
            .toHaveAttribute('href', '/suppliers/SUP-001');
        expect(screen.getByRole('link', { name: 'Buat pemasok' }))
            .toHaveAttribute('href', '/suppliers/maintenance/new');
        expect(supplierApi.getSupplierList).toHaveBeenCalledWith({
            signal: expect.any(AbortSignal),
            params: { page: 1, size: 10, active: true }
        }, undefined);
        expect(supplierApi.getSupplierDetails).not.toHaveBeenCalled();
    });

    it('submits supported search and status filters while resetting the page', async () => {
        supplierApi.getSupplierList.mockResolvedValue(response());
        render(<SupplierList />, { route: '/suppliers?page=3&size=25&active=false' });

        await screen.findByText('Belum ada pemasok tidak aktif.');
        expect(supplierApi.getSupplierList).toHaveBeenLastCalledWith(expect.objectContaining({
            params: { page: 3, size: 25, active: false }
        }), undefined);

        fireEvent.change(screen.getByRole('textbox', { name: 'Cari pemasok' }), {
            target: { value: '  tekstil  ' }
        });
        fireEvent.click(screen.getByRole('button', { name: 'Cari' }));

        await waitFor(() => expect(supplierApi.getSupplierList).toHaveBeenLastCalledWith(expect.objectContaining({
            params: { page: 1, size: 25, active: false, query: 'tekstil' }
        }), undefined));
        expect(await screen.findByText('Tidak ada pemasok yang cocok dengan pencarian ini.')).toBeInTheDocument();
    });

    it('does not send an overlong search supplied through the URL', async () => {
        const overlongQuery = 'a'.repeat(256);
        supplierApi.getSupplierList.mockResolvedValue(response());
        render(<SupplierList />, { route: `/suppliers?query=${ overlongQuery }` });

        expect(screen.getByRole('alert')).toHaveTextContent('Pencarian maksimal 255 karakter.');
        expect(screen.getByRole('textbox', { name: 'Cari pemasok' })).toHaveAttribute('maxlength', '255');
        expect(supplierApi.getSupplierList).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Hapus pencarian' }));

        await waitFor(() => expect(supplierApi.getSupplierList).toHaveBeenCalledWith({
            signal: expect.any(AbortSignal),
            params: { page: 1, size: 10, active: true }
        }, undefined));
    });

    it('shows an actionable error and retries the same request', async () => {
        supplierApi.getSupplierList
            .mockRejectedValueOnce(new Error('Pemasok gagal dimuat.'))
            .mockResolvedValueOnce(response());
        render(<SupplierList />, { route: '/suppliers?query=kain' });

        expect(await screen.findByRole('alert')).toHaveTextContent('Pemasok gagal dimuat.');
        fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect(await screen.findByText('Tidak ada pemasok yang cocok dengan pencarian ini.')).toBeInTheDocument();
        expect(supplierApi.getSupplierList).toHaveBeenCalledTimes(2);
        expect(supplierApi.getSupplierList).toHaveBeenLastCalledWith(expect.objectContaining({
            params: { page: 1, size: 10, active: true, query: 'kain' }
        }), undefined);
    });
});
