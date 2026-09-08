import { Link, Route, Routes, useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import supplierApi from '@api/supplier.js';
import SupplierUpsert from '@pages/supplier/SupplierUpsert.jsx';
import useSupplierStore from '@stores/modules/supplier.js';
import { act, fireEvent, render, screen, waitFor } from '@/test/render.jsx';

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
    active: true
};

const deferred = () => {
    let resolve;
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
};

function LocationDisplay() {
    const location = useLocation();
    return <div>{ location.pathname }|{ location.state?.message }|from={ location.state?.from }</div>;
}

const CreatePage = () => (
    <>
        <Link to="/elsewhere">Keluar</Link>
        <SupplierUpsert />
    </>
);

const renderCreate = () => render(
    <Routes>
        <Route path="/suppliers/maintenance/new" element={ <CreatePage /> } />
        <Route path="/suppliers/:code" element={ <LocationDisplay /> } />
        <Route path="/elsewhere" element={ <LocationDisplay /> } />
    </Routes>,
    { route: '/suppliers/maintenance/new' }
);

const renderEdit = (route = '/suppliers/SUP-001/edit') => render(
    <Routes>
        <Route path="/suppliers/:code/edit" element={ <SupplierUpsert /> } />
        <Route path="/suppliers/:code" element={ <LocationDisplay /> } />
    </Routes>,
    { route }
);

describe('SupplierUpsert', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSupplierStore.setState({
            supplierList: [],
            supplierDetails: null,
            detailStatus: 'idle',
            detailError: null
        });
    });

    it('validates fields and preserves entered input through a uniqueness conflict', async () => {
        const user = userEvent.setup();
        const conflict = new Error('Data telah berubah.');
        conflict.category = 'conflict';
        supplierApi.createSupplier.mockRejectedValue(conflict);
        renderCreate();

        await user.click(screen.getByRole('button', { name: 'Buat pemasok' }));
        expect(screen.getByText('Nama pemasok wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Kode pemasok wajib diisi.')).toBeInTheDocument();

        await user.type(screen.getByRole('textbox', { name: 'Nama pemasok' }), 'Nusantara Tekstil');
        await user.type(screen.getByRole('textbox', { name: 'Kode pemasok' }), 'sup-001');
        fireEvent.change(screen.getByRole('textbox', { name: 'Nomor kontak (opsional)' }), {
            target: { name: 'contactNumber', value: '1'.repeat(256) }
        });
        fireEvent.blur(screen.getByRole('textbox', { name: 'Nomor kontak (opsional)' }));
        expect(screen.getByText('Nomor kontak maksimal 255 karakter.')).toBeInTheDocument();
        fireEvent.change(screen.getByRole('textbox', { name: 'Nomor kontak (opsional)' }), {
            target: { name: 'contactNumber', value: '08123' }
        });

        await user.click(screen.getByRole('button', { name: 'Buat pemasok' }));

        expect(await screen.findByText('Kode pemasok harus unik. Gunakan kode lain.')).toBeInTheDocument();
        const codeInput = screen.getByRole('textbox', { name: 'Kode pemasok' });
        expect(codeInput).toHaveValue('sup-001');
        expect(screen.getByRole('textbox', { name: 'Nama pemasok' })).toHaveValue('Nusantara Tekstil');
        expect(codeInput).toHaveFocus();
        expect(supplierApi.createSupplier).toHaveBeenCalledWith({
            data: {
                code: 'sup-001',
                name: 'Nusantara Tekstil',
                contactNumber: '08123',
                address: ''
            }
        }, undefined);
    });

    it('blocks duplicate create submission while pending and uses the returned normalized code', async () => {
        const user = userEvent.setup();
        const pending = deferred();
        supplierApi.createSupplier.mockReturnValue(pending.promise);
        renderCreate();

        await user.type(screen.getByRole('textbox', { name: 'Nama pemasok' }), 'Bloom Textile');
        await user.type(screen.getByRole('textbox', { name: 'Kode pemasok' }), 'sup-001');
        await user.dblClick(screen.getByRole('button', { name: 'Buat pemasok' }));

        expect(supplierApi.createSupplier).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled();
        expect(screen.getByRole('status')).toHaveTextContent('Menyimpan pemasok...');

        pending.resolve({ data: { data: { ...supplier, code: 'NEW', name: 'Bloom Textile' } } });

        expect(await screen.findByText('/suppliers/NEW|Pemasok Bloom Textile berhasil dibuat.|from=/suppliers')).toBeInTheDocument();
    });

    it('edits only mutable master data while keeping the stable code out of the request', async () => {
        const user = userEvent.setup();
        supplierApi.getSupplierDetails.mockResolvedValue({ data: { data: supplier } });
        supplierApi.updateSupplier.mockResolvedValue({
            data: { data: { ...supplier, name: 'Nusantara Baru', contactNumber: null } }
        });
        renderEdit();

        const codeField = await screen.findByRole('textbox', { name: 'Kode pemasok' });
        expect(codeField).toBeDisabled();
        expect(codeField).toHaveValue('SUP-001');

        const nameField = screen.getByRole('textbox', { name: 'Nama pemasok' });
        await user.clear(nameField);
        await user.type(nameField, 'Nusantara Baru');
        await user.clear(screen.getByRole('textbox', { name: 'Nomor kontak (opsional)' }));
        await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));

        await waitFor(() => expect(supplierApi.updateSupplier).toHaveBeenCalledWith('SUP-001', {
            data: {
                name: 'Nusantara Baru',
                contactNumber: '',
                address: 'Jl. Melati 7'
            }
        }, undefined));
        expect(await screen.findByText('/suppliers/SUP-001|Pemasok Nusantara Baru berhasil diperbarui.|from=/suppliers')).toBeInTheDocument();
    });

    it('maps backend validation to fields without clearing the submitted draft', async () => {
        const user = userEvent.setup();
        const validationError = new Error('Masukan tidak valid.');
        validationError.category = 'validation';
        validationError.validationErrors = [{
            field: 'contactNumber',
            message: 'Supplier contact number must not exceed 255 characters'
        }];
        supplierApi.createSupplier.mockRejectedValue(validationError);
        renderCreate();

        await user.type(screen.getByRole('textbox', { name: 'Nama pemasok' }), 'Bloom Textile');
        await user.type(screen.getByRole('textbox', { name: 'Kode pemasok' }), 'SUP-001');
        await user.type(screen.getByRole('textbox', { name: 'Nomor kontak (opsional)' }), '08123');
        await user.type(screen.getByRole('textbox', { name: 'Alamat (opsional)' }), 'Jl. Mawar');
        await user.click(screen.getByRole('button', { name: 'Buat pemasok' }));

        expect(await screen.findByText('Nomor kontak maksimal 255 karakter.')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Nomor kontak (opsional)' })).toHaveFocus();
        expect(screen.getByRole('textbox', { name: 'Nama pemasok' })).toHaveValue('Bloom Textile');
        expect(screen.getByRole('textbox', { name: 'Kode pemasok' })).toHaveValue('SUP-001');
        expect(screen.getByRole('textbox', { name: 'Alamat (opsional)' })).toHaveValue('Jl. Mawar');
    });

    it('retries an edit load and cancels back to supplier detail', async () => {
        const user = userEvent.setup();
        supplierApi.getSupplierDetails
            .mockRejectedValueOnce(new Error('Data pemasok gagal dimuat.'))
            .mockResolvedValueOnce({ data: { data: supplier } });
        renderEdit();

        expect(await screen.findByRole('alert')).toHaveTextContent('Data pemasok gagal dimuat.');
        await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
        expect(await screen.findByRole('textbox', { name: 'Kode pemasok' })).toHaveValue('SUP-001');

        await user.click(screen.getByRole('link', { name: 'Batal' }));
        expect(await screen.findByText('/suppliers/SUP-001||from=/suppliers')).toBeInTheDocument();
    });

    it('rejects an invalid edit-route code without calling the backend', async () => {
        renderEdit('/suppliers/%20/edit');

        expect(await screen.findByRole('alert')).toHaveTextContent('Kode pemasok tidak valid.');
        expect(supplierApi.getSupplierDetails).not.toHaveBeenCalled();
    });

    it('does not redirect after a pending create completes on an unmounted page', async () => {
        const user = userEvent.setup();
        const pending = deferred();
        supplierApi.createSupplier.mockReturnValue(pending.promise);
        renderCreate();

        await user.type(screen.getByRole('textbox', { name: 'Nama pemasok' }), 'Bloom Textile');
        await user.type(screen.getByRole('textbox', { name: 'Kode pemasok' }), 'SUP-001');
        await user.click(screen.getByRole('button', { name: 'Buat pemasok' }));
        await user.click(screen.getByRole('link', { name: 'Keluar' }));
        expect(await screen.findByText('/elsewhere||from=')).toBeInTheDocument();

        await act(async () => {
            pending.resolve({ data: { data: supplier } });
        });
        expect(screen.getByText('/elsewhere||from=')).toBeInTheDocument();
    });
});
