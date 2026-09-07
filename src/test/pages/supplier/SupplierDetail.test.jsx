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
    screen
} from '@/test/render.jsx';

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
});
