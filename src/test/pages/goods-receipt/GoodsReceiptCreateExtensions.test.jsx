import { beforeEach, describe, expect, it, vi } from 'vitest';

import cashApi from '@api/cash-session.js';
import receiptApi from '@api/goods-receipt.js';
import itemApi from '@api/item.js';
import supplierApi from '@api/supplier.js';
import {
    getReceiptOutstandingInputEstimate,
    newReceiptDraft,
    receiptRequest,
    stripReceiptCode,
    validateReceiptCode
} from '@components/goods-receipt/receipt-create.js';
import GoodsReceiptCreate from '@pages/goods-receipt/GoodsReceiptCreate.jsx';
import useAuthStore from '@stores/modules/auth.js';
import useCashSessionStore from '@stores/modules/cash-session.js';
import useCreate from '@stores/modules/goods-receipt-create.js';
import { fireEvent, render, screen, within } from '@/test/render.jsx';

vi.mock('@api/goods-receipt.js', () => ({
    default: {
        createGoodsReceipt: vi.fn(),
        getGoodsReceiptSubmission: vi.fn()
    }
}));
vi.mock('@api/cash-session.js', () => ({
    default: { getCurrentSession: vi.fn() }
}));
vi.mock('@api/item.js', () => ({
    default: { getItemList: vi.fn() }
}));
vi.mock('@api/supplier.js', () => ({
    default: { getSupplierList: vi.fn() }
}));

const supplier = {
    code: 'QA-EXT-SUP',
    name: 'Pemasok uji',
    active: true
};
const item = {
    sku: 'QA-EXT-F',
    name: 'Kain uji',
    baseUnitOfMeasure: 'METER',
    fractionalQuantityAllowed: true
};
const draft = () => ({
    ...newReceiptDraft(),
    supplier,
    receivedDate: '18-11-2026',
    receivedTime: '09:00',
    offset: '+07:00',
    items: [{
        id: 'line-1',
        item,
        quantity: '1.25',
        purchasePrice: '10',
        stockLocation: 'STORE'
    }]
});
const initialPayment = (paymentMethod = 'BANK_TRANSFER') => ({
    amount: '4.1234',
    paymentMethod,
    reference: 'BANK/QA',
    note: 'Catatan uji'
});
const envelope = data => ({
    data: { data }
});
const savedReceipt = request => ({
    id: 42,
    code: stripReceiptCode(request.code) || 'GR/XI-2026/TEST',
    supplierCode: supplier.code,
    supplierName: supplier.name,
    totalAmount: '12.5',
    paidAmount: request.initialPayment ? '4.1234' : '0',
    outstandingAmount: request.initialPayment ? '8.3766' : '12.5',
    paymentStatus: request.initialPayment ? 'PARTIALLY_PAID' : 'UNPAID',
    status: 'POSTED',
    items: request.items.map(line => ({
        ...line,
        item,
        baseUnitOfMeasure: 'METER'
    })),
    initialPayment: request.initialPayment ? {
        ...request.initialPayment,
        id: 83,
        receiptCode: stripReceiptCode(request.code) || 'GR/XI-2026/TEST',
        paymentReference: 'SUPPLIER-PAYMENT-83',
        cashSessionId: request.initialPayment.paymentMethod === 'CASH' ? 13 : null,
        actor: 'admin',
        voided: false
    } : null
});

beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useAuthStore.setState({
        authStatus: 'authenticated',
        currentUser: {
            accountId: '101',
            username: 'admin'
        }
    });
    useCreate.setState({
        ...useCreate.getInitialState(),
        ownerAccountId: '101',
        draft: draft()
    });
    useCashSessionStore.setState(useCashSessionStore.getInitialState());
    itemApi.getItemList.mockResolvedValue(envelope({ content: [item] }));
    supplierApi.getSupplierList.mockResolvedValue(envelope({ content: [supplier] }));
    cashApi.getCurrentSession.mockResolvedValue(envelope({
        id: 13,
        status: 'OPEN'
    }));
    receiptApi.createGoodsReceipt.mockImplementation(request => Promise.resolve(envelope(savedReceipt(request))));
});

describe('Receipt creation extension', () => {
    it('keeps automatic unpaid creation as the default', () => {
        const request = receiptRequest(draft());
        expect(request.code).toBeUndefined();
        expect(request.initialPayment).toBeUndefined();
        expect(getReceiptOutstandingInputEstimate(draft())).toBe('12.5');
    });

    it.each(['Vendor/2026/+%?#', 'vendor/A', '\u2003Vendor/A\u2003'])('preserves supported custom code %s', code => {
        expect(validateReceiptCode(code)).toBe('');
        expect(receiptRequest({
            ...draft(),
            code
        }).code).toBe(code);
    });

    it.each(['   ', 'A B', 'A\nB', 'A\u00a0B', 'A'.repeat(101)])('rejects invalid custom code %s', code => {
        expect(validateReceiptCode(code)).not.toBe('');
    });

    it.each(['BANK_TRANSFER', 'QRIS', 'CASH'])('posts initial %s payment in the receipt request and shows its recorded identity', async method => {
        useCreate.setState({
            draft: {
                ...draft(),
                code: 'Vendor/2026/+%?#',
                initialPayment: initialPayment(method)
            }
        });
        render(<GoodsReceiptCreate />);
        fireEvent.click(screen.getByRole('button', { name: 'Tinjau penerimaan' }));
        const dialog = await screen.findByRole('dialog', { name: 'Tinjau penerimaan' });
        expect(dialog).toHaveTextContent('Rp 4,1234');
        expect(dialog).toHaveTextContent('Perkiraan sisa setelah pembayaran');
        expect(dialog).toHaveTextContent('Rp 8,3766');
        expect(dialog).toHaveTextContent(method === 'CASH' ? 'Sesi kas #13' : 'tidak memerlukan sesi kas');
        fireEvent.click(within(dialog).getByRole('button', { name: 'Catat penerimaan' }));

        expect(await screen.findByText('SUPPLIER-PAYMENT-83')).toBeInTheDocument();
        expect(receiptApi.createGoodsReceipt).toHaveBeenCalledTimes(1);
        const request = receiptApi.createGoodsReceipt.mock.calls[0][0];
        expect(request.initialPayment).toMatchObject(initialPayment(method));
        expect(request.initialPayment.paidAt).toEqual(expect.any(String));
        expect(await screen.findByRole('link', { name: 'Buka detail penerimaan' }))
            .toHaveAttribute('href', '/goods-receipts/Vendor%2F2026%2F%2B%25%3F%23');
        expect(screen.getByRole('link', { name: 'Cari kode persis di riwayat' }))
            .toHaveAttribute('href', '/goods-receipts?key=exactCode&q=Vendor%2F2026%2F%2B%25%3F%23');
        expect(screen.getByRole('link', { name: 'Buka utang penerimaan' }))
            .toHaveAttribute('href', '/payables?key=exactCode&q=Vendor%2F2026%2F%2B%25%3F%23');
        if (method !== 'CASH') expect(cashApi.getCurrentSession).not.toHaveBeenCalled();
    });

    it('rejects excessive payment precision without posting', async () => {
        useCreate.setState({
            draft: {
                ...draft(),
                initialPayment: {
                    ...initialPayment(),
                    amount: '1.23450'
                }
            }
        });
        await useCreate.getState().submit();
        expect(useCreate.getState().errors['initialPayment.amount']).toMatch(/Maksimal 4/);
        expect(receiptApi.createGoodsReceipt).not.toHaveBeenCalled();
    });

    it('preserves code, payment and exact lines after a duplicate-code rejection', async () => {
        const value = {
            ...draft(),
            code: 'Vendor/A',
            initialPayment: initialPayment()
        };
        useCreate.setState({ draft: value });
        receiptApi.createGoodsReceipt.mockRejectedValue({
            status: 409,
            domainCode: 'goods_receipt_code_already_exists'
        });
        await useCreate.getState().submit();
        expect(useCreate.getState()).toMatchObject({
            draft: value,
            attempt: null,
            result: null,
            errors: { code: expect.stringMatching(/sudah digunakan/) }
        });
    });

    it('blocks CASH when the reviewed session changes before posting', async () => {
        const value = {
            ...draft(),
            initialPayment: initialPayment('CASH')
        };
        useCreate.setState({ draft: value });
        cashApi.getCurrentSession.mockResolvedValue(envelope({
            id: 14,
            status: 'OPEN'
        }));
        await useCreate.getState().submit(receiptRequest(value), 13);
        expect(receiptApi.createGoodsReceipt).not.toHaveBeenCalled();
        expect(useCreate.getState()).toMatchObject({
            draft: value,
            attempt: null,
            outcome: 'sessionConflict'
        });
    });

    it('preserves payment input after the server rejects an overpayment', async () => {
        const value = {
            ...draft(),
            initialPayment: {
                ...initialPayment(),
                amount: '20'
            }
        };
        useCreate.setState({ draft: value });
        receiptApi.createGoodsReceipt.mockRejectedValue({
            status: 409,
            domainCode: 'supplier_payment_conflict'
        });

        await useCreate.getState().submit();

        expect(useCreate.getState()).toMatchObject({
            draft: value,
            attempt: null,
            result: null,
            outcome: 'conflict',
            errors: {
                'initialPayment.amount': expect.stringMatching(/total resmi/)
            }
        });
    });

    it('keeps an unknown payment request immutable through missing lookups, then reads its committed result', async () => {
        const value = {
            ...draft(),
            code: 'Vendor/UNKNOWN',
            initialPayment: initialPayment()
        };
        const request = receiptRequest(value, '2026-11-18T03:00:00.000Z');
        useCreate.setState({ draft: value });
        receiptApi.createGoodsReceipt.mockRejectedValue({ status: 503 });
        await useCreate.getState().submit(request);
        const attempt = useCreate.getState().attempt;
        receiptApi.getGoodsReceiptSubmission.mockRejectedValueOnce({
            status: 404,
            domainCode: 'goods_receipt_submission_not_found'
        }).mockResolvedValueOnce(envelope(savedReceipt(request)));
        await useCreate.getState().submit();
        expect(useCreate.getState()).toMatchObject({
            attempt,
            outcome: 'submissionMissing'
        });
        await useCreate.getState().resolveSubmission();
        expect(useCreate.getState().result.initialPayment.paymentReference).toBe('SUPPLIER-PAYMENT-83');
        expect(receiptApi.createGoodsReceipt).toHaveBeenCalledTimes(1);
        expect(receiptApi.getGoodsReceiptSubmission.mock.calls).toEqual([
            [attempt.key, { useLoader: false }],
            [attempt.key, { useLoader: false }]
        ]);
        expect(request.initialPayment.paidAt).toBe('2026-11-18T03:00:00.000Z');
    });

    it('quarantines ownerless or other-account unknown submissions', async () => {
        const attempt = {
            key: 'retained-key',
            request: receiptRequest(draft())
        };
        useCreate.setState({
            ownerAccountId: null,
            attempt,
            outcome: 'uncertain'
        });
        await useCreate.getState().submit();
        await useCreate.getState().resolveSubmission();
        useCreate.getState().reset();
        expect(receiptApi.createGoodsReceipt).not.toHaveBeenCalled();
        expect(receiptApi.getGoodsReceiptSubmission).not.toHaveBeenCalled();
        expect(useCreate.getState().attempt).toBe(attempt);
        useCreate.setState({ ownerAccountId: '202' });
        render(<GoodsReceiptCreate />);
        expect(screen.getByRole('alert')).toHaveTextContent('akun asal');
        expect(screen.queryByRole('textbox', { name: 'Kode penerimaan (opsional)' })).not.toBeInTheDocument();
    });

    it('keeps an incomplete payment expansion unresolved', async () => {
        const value = {
            ...draft(),
            initialPayment: initialPayment()
        };
        const request = receiptRequest(value);
        useCreate.setState({ draft: value });
        receiptApi.createGoodsReceipt.mockResolvedValue(envelope({
            ...savedReceipt(request),
            initialPayment: null
        }));
        await useCreate.getState().submit(request);
        expect(useCreate.getState()).toMatchObject({
            outcome: 'uncertain',
            result: null
        });
    });

    it('resolves current cancelled and voided audit facts without reposting', async () => {
        const value = {
            ...draft(),
            initialPayment: initialPayment()
        };
        const request = receiptRequest(value);
        const saved = savedReceipt(request);
        useCreate.setState({
            draft: value,
            attempt: {
                key: 'audit-lookup-key',
                request
            },
            outcome: 'uncertain'
        });
        receiptApi.getGoodsReceiptSubmission.mockResolvedValue(envelope({
            ...saved,
            status: 'CANCELLED',
            paymentStatus: 'UNPAID',
            paidAmount: '0',
            outstandingAmount: '0',
            initialPayment: {
                ...saved.initialPayment,
                voided: true
            }
        }));

        await useCreate.getState().resolveSubmission();

        expect(useCreate.getState()).toMatchObject({
            outcome: 'success',
            attempt: null,
            result: {
                status: 'CANCELLED',
                initialPayment: { voided: true }
            }
        });
        expect(receiptApi.createGoodsReceipt).not.toHaveBeenCalled();
    });

    it('keeps a late response owned by the submitting account', async () => {
        let finish;
        receiptApi.createGoodsReceipt.mockImplementation(() => new Promise(resolve => {
            finish = resolve;
        }));
        const submission = useCreate.getState().submit();
        const request = receiptApi.createGoodsReceipt.mock.calls[0][0];
        useAuthStore.setState({
            currentUser: {
                accountId: '202',
                username: 'admin'
            }
        });
        finish(envelope(savedReceipt(request)));
        await submission;

        expect(useCreate.getState().ownerAccountId).toBe('101');
        render(<GoodsReceiptCreate />);
        expect(screen.getByRole('alert')).toHaveTextContent('akun asal');
        expect(screen.queryByRole('heading', { name: 'Penerimaan berhasil dicatat' })).not.toBeInTheDocument();
    });
});
