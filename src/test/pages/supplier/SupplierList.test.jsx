import { beforeEach, describe, expect, it, vi } from 'vitest';

import supplierApi from '@api/supplier.js';
import SupplierList from '@pages/supplier/SupplierList.jsx';
import useSupplierStore from '@stores/modules/supplier.js';
import { fireEvent, render, screen, waitFor } from '@/test/render.jsx';

vi.mock('@api/supplier.js', () => ({
    default: {
        getSupplierList: vi.fn(),
        getSupplierDetails: vi.fn(),
        getSupplierOutstandingBalance: vi.fn()
    }
}));

const supplier = {
    code: 'SUP-001',
    name: 'Nusantara Tekstil',
    contactNumber: '08123456789',
    address: 'Jl. Melati 7',
    active: true,
    updatedAt: '2026-09-24T03:31:00Z',
    updatedBy: 'admin'
};

const balance = {
    supplierId: 1,
    supplierCode: 'SUP-001',
    supplierName: 'Nusantara Tekstil',
    totalPostedAmount: '150000.0000',
    paidAmount: '50000.0000',
    outstandingAmount: '100000.0000'
};

const response = ({
    content = [],
    totalPages = content.length ? 1 : 0,
    totalElements = content.length
} = {}) => ({
    data: {
        data: {
            content,
            totalPages,
            totalElements
        }
    }
});

describe('SupplierList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSupplierStore.setState({
            supplierList: [],
            supplierPaging: {},
            listStatus: 'idle',
            listError: null,
            supplierListBalances: {}
        });
        supplierApi.getSupplierOutstandingBalance.mockResolvedValue({
            data: { data: balance }
        });
    });

    it('renders labelled supplier facts, server-owned balance, audit data, and compact detail action', async () => {
        supplierApi.getSupplierList.mockResolvedValue(response({ content: [supplier] }));
        render(<SupplierList />, { route: '/suppliers' });

        expect((await screen.findAllByText('Nusantara Tekstil')).length).toBeGreaterThan(0);
        expect(screen.getAllByText('SUP-001').length).toBeGreaterThan(0);
        expect(screen.getAllByText('08123456789').length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText('Status pemasok: Aktif').length).toBeGreaterThan(0);
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(await screen.findByText('Rp 100.000')).toBeInTheDocument();
        expect(screen.getByText('Nilai server')).toBeInTheDocument();
        expect(screen.getByRole('table', { name: 'Daftar pemasok aktif' })).toHaveClass(
            '!block',
            'lg:!table',
            'lg:!table-fixed'
        );
        expect(screen.getAllByText('Kontak').length).toBeGreaterThan(1);
        expect(screen.getByRole('link', { name: 'Buka detail Nusantara Tekstil' }))
            .toHaveAttribute('href', '/suppliers/SUP-001');
        expect(screen.getByRole('link', { name: 'Buat pemasok' }))
            .toHaveAttribute('href', '/suppliers/maintenance/new');
        expect(supplierApi.getSupplierList).toHaveBeenCalledWith({
            signal: expect.any(AbortSignal),
            params: { page: 1, size: 10, active: true }
        }, undefined);
        expect(supplierApi.getSupplierDetails).not.toHaveBeenCalled();
        expect(supplierApi.getSupplierOutstandingBalance).toHaveBeenCalledWith(
            'SUP-001',
            { signal: expect.any(AbortSignal) },
            { useLoader: false }
        );
    });

    it('submits supported search and status filters while resetting the page', async () => {
        supplierApi.getSupplierList.mockResolvedValue(response());
        render(<SupplierList />, { route: '/suppliers?page=3&size=25&active=false' });

        await screen.findByText(/Tidak ada pemasok yang cocok/);
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
        expect(await screen.findByText(/Tidak ada pemasok yang cocok/)).toBeInTheDocument();
    });

    it('does not send an overlong search supplied through the URL', async () => {
        const overlongQuery = 'a'.repeat(256);
        supplierApi.getSupplierList.mockResolvedValue(response());
        render(<SupplierList />, { route: `/suppliers?query=${ overlongQuery }` });

        expect(screen.getByRole('alert')).toHaveTextContent('Pencarian maksimal 255 karakter.');
        expect(screen.getByRole('textbox', { name: 'Cari pemasok' })).toHaveAttribute('maxlength', '255');
        expect(supplierApi.getSupplierList).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Reset filter' }));

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

        expect(await screen.findByText(/Tidak ada pemasok yang cocok/)).toBeInTheDocument();
        expect(supplierApi.getSupplierList).toHaveBeenCalledTimes(2);
        expect(supplierApi.getSupplierList).toHaveBeenLastCalledWith(expect.objectContaining({
            params: { page: 1, size: 10, active: true, query: 'kain' }
        }), undefined);
    });

    it('shows explicit range and page controls backed by the server page', async () => {
        supplierApi.getSupplierList.mockResolvedValue(response({
            content: [supplier],
            totalPages: 3,
            totalElements: 21
        }));
        render(<SupplierList />, { route: '/suppliers?page=2&size=10' });

        expect(await screen.findByText('21 pemasok ditemukan · 11–11 dari 21')).toBeInTheDocument();
        expect(screen.getByText('Halaman 2 dari 3')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));

        await waitFor(() => expect(supplierApi.getSupplierList).toHaveBeenLastCalledWith({
            signal: expect.any(AbortSignal),
            params: {
                page: 3,
                size: 10,
                active: true
            }
        }, undefined));
    });

    it('keeps the supplier row usable and retries only a failed server balance', async () => {
        supplierApi.getSupplierList.mockResolvedValue(response({ content: [supplier] }));
        supplierApi.getSupplierOutstandingBalance
            .mockRejectedValueOnce(new Error('Saldo gagal dimuat.'))
            .mockResolvedValueOnce({ data: { data: balance } });
        render(<SupplierList />, { route: '/suppliers' });

        expect(await screen.findByText('Saldo belum tersedia.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Buka detail Nusantara Tekstil' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', {
            name: 'Coba lagi saldo utang Nusantara Tekstil'
        }));

        expect(await screen.findByText('Rp 100.000')).toBeInTheDocument();
        expect(supplierApi.getSupplierOutstandingBalance).toHaveBeenCalledTimes(2);
    });
});
