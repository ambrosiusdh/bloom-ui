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
            detailError: null
        });
    });

    it('loads detail by stable code and displays contact, audit, and inactive state', async () => {
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
        expect(screen.queryByText(/utang|saldo|bayar/i)).not.toBeInTheDocument();
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
