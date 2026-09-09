import {
    Route,
    Routes
} from 'react-router-dom';
import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import supplierApi from '@api/supplier.js';
import SupplierDetail from '@pages/supplier/SupplierDetail.jsx';
import useSupplierStore from '@stores/modules/supplier.js';
import {
    fireEvent,
    render,
    screen,
    waitFor
} from '@/test/render.jsx';

vi.mock('@api/supplier.js', () => ({
    default: {
        getSupplierList: vi.fn(),
        getSupplierDetails: vi.fn(),
        getSupplierOutstandingBalance: vi.fn(),
        createSupplier: vi.fn(),
        updateSupplier: vi.fn(),
        setSupplierActive: vi.fn()
    }
}));

const supplier = {
    code: 'SUP-001',
    name: 'Nusantara Tekstil',
    contactNumber: '08123456789',
    address: 'Jl. Melati 7',
    active: false,
    createdAt: '2026-08-20T05:30:00Z',
    updatedAt: '2026-08-21T05:30:00Z',
    createdBy: 'admin',
    updatedBy: 'manager'
};

const balance = {
    supplierId: 1,
    supplierCode: 'SUP-001',
    supplierName: 'Nusantara Tekstil',
    totalPostedAmount: '150000.0000',
    paidAmount: '50000.0000',
    outstandingAmount: '100000.0000'
};

const renderDetail = () => render(
    <Routes>
        <Route path="/suppliers/:code" element={ <SupplierDetail /> } />
    </Routes>,
    { route: '/suppliers/SUP-001' }
);

describe('SupplierDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSupplierStore.setState({
            supplierDetails: null,
            detailStatus: 'idle',
            detailError: null,
            supplierOutstandingBalance: null,
            balanceStatus: 'idle',
            balanceError: null
        });
        supplierApi.getSupplierOutstandingBalance.mockResolvedValue({ data: { data: balance } });
    });

    it('loads one server balance and displays contact, audit, inactive state, and payable link', async () => {
        supplierApi.getSupplierDetails.mockResolvedValue({ data: { data: supplier } });
        renderDetail();

        expect(await screen.findByRole('heading', { name: 'Nusantara Tekstil' })).toBeInTheDocument();
        expect(screen.getByText('Kode pemasok: SUP-001')).toBeInTheDocument();
        expect(screen.getByText('08123456789')).toBeInTheDocument();
        expect(screen.getByLabelText('Status pemasok: Tidak aktif')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('manager')).toBeInTheDocument();
        expect(supplierApi.getSupplierDetails).toHaveBeenCalledWith(
            'SUP-001',
            { signal: expect.any(AbortSignal) },
            undefined
        );
        expect(supplierApi.getSupplierOutstandingBalance).toHaveBeenCalledTimes(1);
        expect(supplierApi.getSupplierOutstandingBalance).toHaveBeenCalledWith(
            'SUP-001',
            { signal: expect.any(AbortSignal) },
            { useLoader: false }
        );
        expect(screen.getByText('Total penerimaan dibukukan').nextSibling).toHaveTextContent('Rp 150.000');
        expect(screen.getByText('Sudah dibayar').nextSibling).toHaveTextContent('Rp 50.000');
        expect(screen.getByText('Sisa utang').nextSibling).toHaveTextContent('Rp 100.000');
        expect(screen.getByRole('link', { name: 'Lihat penerimaan pemasok' })).toHaveAttribute(
            'href', '/payables?key=supplierName&q=Nusantara+Tekstil'
        );
    });

    it('announces loading and retries a failed detail read', async () => {
        let resolveRequest;
        supplierApi.getSupplierDetails.mockReturnValueOnce(new Promise(resolve => {
            resolveRequest = resolve;
        }));
        const view = renderDetail();

        expect(screen.getByRole('status')).toHaveTextContent('Memuat detail pemasok...');
        resolveRequest(Promise.reject(new Error('Detail pemasok gagal dimuat.')));
        expect(await screen.findByRole('alert')).toHaveTextContent('Detail pemasok gagal dimuat.');

        supplierApi.getSupplierDetails.mockResolvedValueOnce({ data: { data: supplier } });
        fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByRole('heading', { name: 'Nusantara Tekstil' })).toBeInTheDocument();

        view.unmount();
    });

    it('keeps supplier detail visible when the balance fails and retries only the balance', async () => {
        supplierApi.getSupplierDetails.mockResolvedValue({ data: { data: supplier } });
        supplierApi.getSupplierOutstandingBalance
            .mockRejectedValueOnce(new Error('Saldo gagal dimuat.'))
            .mockResolvedValueOnce({ data: { data: { ...balance, outstandingAmount: '0.0000' } } });
        renderDetail();

        expect(await screen.findByRole('heading', { name: 'Nusantara Tekstil' })).toBeInTheDocument();
        expect(await screen.findByRole('alert')).toHaveTextContent('Saldo gagal dimuat.');
        fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

        expect(await screen.findByText('Sisa utang')).toBeInTheDocument();
        expect(screen.getByText('Sisa utang').nextSibling).toHaveTextContent('Rp 0');
        expect(supplierApi.getSupplierOutstandingBalance).toHaveBeenCalledTimes(2);
        expect(supplierApi.getSupplierDetails).toHaveBeenCalledTimes(1);
    });

    it('confirms deactivation accessibly, blocks duplicates, and preserves stable identity', async () => {
        const activeSupplier = { ...supplier, active: true };
        let resolveDeactivation;
        supplierApi.getSupplierDetails.mockResolvedValue({ data: { data: activeSupplier } });
        supplierApi.setSupplierActive.mockReturnValue(new Promise(resolve => {
            resolveDeactivation = resolve;
        }));
        renderDetail();

        const trigger = await screen.findByRole('button', { name: 'Nonaktifkan pemasok' });
        fireEvent.click(trigger);
        expect(screen.getByRole('dialog', { name: 'Nonaktifkan Nusantara Tekstil?' })).toBeInTheDocument();
        const cancel = screen.getByRole('button', { name: 'Batal' });
        await waitFor(() => expect(cancel).toHaveFocus());
        fireEvent.click(cancel);
        await waitFor(() => expect(trigger).toHaveFocus());

        fireEvent.click(trigger);
        const confirm = screen.getByRole('button', { name: 'Nonaktifkan' });
        fireEvent.click(confirm);
        fireEvent.click(confirm);

        expect(supplierApi.setSupplierActive).toHaveBeenCalledTimes(1);
        expect(supplierApi.setSupplierActive).toHaveBeenCalledWith('SUP-001', false, undefined);
        expect(screen.getByRole('status')).toHaveTextContent('Menonaktifkan pemasok...');

        resolveDeactivation({ data: { data: { ...activeSupplier, active: false } } });

        expect(await screen.findByText(/berhasil dinonaktifkan tanpa menghapus riwayatnya/i)).toBeInTheDocument();
        expect(screen.getByText('Kode pemasok: SUP-001')).toBeInTheDocument();
        expect(screen.getByLabelText('Status pemasok: Tidak aktif')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Nonaktifkan pemasok' })).not.toBeInTheDocument();
    });
});
