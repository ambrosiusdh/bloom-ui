import {
    Alert,
    Button,
    CircularProgress
} from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { formatQuantity } from '@utils/quantity-utils.js';

const PAYMENT_LABELS = {
    CASH: 'Tunai (CASH)',
    QRIS: 'QRIS'
};

export default function CashierPurchaseConfirmationModal({
    estimate,
    itemList,
    onCancel,
    onConfirm,
    phase,
    request
}) {
    const isSubmitting = phase === 'submitting';
    const isChecking = phase === 'checking';
    const isPending = isSubmitting || isChecking;
    const tenderLabel = request.paymentType === 'CASH'
        ? 'Uang tunai diterima'
        : 'Nominal QRIS terkonfirmasi';

    return (
        <section
            className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4"
            aria-labelledby="cashier-checkout-review-title"
            aria-busy={ isPending }
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 id="cashier-checkout-review-title" className="font-bold text-blue-950">
                        { isSubmitting
                            ? 'Mengirim permintaan yang sama'
                            : isChecking
                                ? 'Memeriksa hasil di server'
                                : 'Pastikan barang dan pembayaran' }
                    </h3>
                    <p className="mt-1 text-sm text-blue-900">
                        Permintaan belum menjadi penjualan. Nilai resmi tetap ditetapkan server.
                    </p>
                </div>
                <Button
                    type="button"
                    size="small"
                    onClick={ onCancel }
                    disabled={ isPending }
                >
                    Kembali
                </Button>
            </div>

            <div className="mt-4 space-y-2" aria-label="Barang yang dikonfirmasi">
                { itemList.map(item => (
                    <div className="rounded-lg border border-blue-100 bg-white p-3 text-sm" key={ item.sku }>
                        <div className="font-semibold">{ item.name }</div>
                        <div className="mt-1 text-slate-600">
                            { formatQuantity(item.quantity, item.baseUnitOfMeasure) } dari STORE
                        </div>
                    </div>
                )) }
            </div>

            <dl className="mt-4 rounded-lg border border-blue-100 bg-white p-3 text-sm">
                <div className="flex justify-between gap-3">
                    <dt>Metode</dt>
                    <dd className="font-semibold">{ PAYMENT_LABELS[request.paymentType] }</dd>
                </div>
                <div className="mt-1 flex justify-between gap-3">
                    <dt>{ tenderLabel }</dt>
                    <dd className="font-semibold tabular-nums">
                        { formatRupiah(request.paidAmount) }
                    </dd>
                </div>
                <div className="mt-1 flex justify-between gap-3">
                    <dt>Diskon diminta</dt>
                    <dd className="font-semibold tabular-nums">
                        { formatRupiah(request.discountAmount) }
                    </dd>
                </div>
                { request.description && (
                    <div className="mt-1 flex justify-between gap-3">
                        <dt>Alasan diskon</dt>
                        <dd className="font-semibold text-right">{ request.description }</dd>
                    </div>
                ) }
                <div className="mt-2 flex justify-between gap-3 border-t pt-2">
                    <dt>Perkiraan bayar</dt>
                    <dd className="font-bold tabular-nums">
                        { formatRupiah(estimate.totalAmount) }
                    </dd>
                </div>
                <div className="mt-2 flex justify-between gap-3 border-t pt-2">
                    <dt>Total resmi &amp; kembalian</dt>
                    <dd className="font-bold text-right">Ditetapkan server</dd>
                </div>
            </dl>

            { isPending && (
                <Alert severity="info" className="mt-4" role="status">
                    <span className="inline-flex items-center gap-2">
                        <CircularProgress size={ 18 } />
                        { isChecking
                            ? 'Status penjualan sedang diperiksa. Jangan membuat transaksi baru.'
                            : 'Sedang mengirim. Keranjang dan pembayaran tetap dikunci.' }
                    </span>
                </Alert>
            ) }

            <Button
                type="button"
                variant="contained"
                fullWidth
                className="cashier-primary-action mt-4"
                onClick={ onConfirm }
                disabled={ isPending }
            >
                { isChecking
                    ? 'Memeriksa hasil...'
                    : isSubmitting ? 'Memproses...' : 'Konfirmasi jual' }
            </Button>
        </section>
    );
}

CashierPurchaseConfirmationModal.propTypes = {
    estimate: PropTypes.shape({
        totalAmount: PropTypes.string.isRequired
    }).isRequired,
    itemList: PropTypes.arrayOf(PropTypes.shape({
        sku: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        quantity: PropTypes.string.isRequired,
        baseUnitOfMeasure: PropTypes.string.isRequired
    })).isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    phase: PropTypes.oneOf(['confirmation', 'submitting', 'checking']).isRequired,
    request: PropTypes.shape({
        discountAmount: PropTypes.string.isRequired,
        paidAmount: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        paymentType: PropTypes.oneOf(['CASH', 'QRIS']).isRequired
    }).isRequired
};
