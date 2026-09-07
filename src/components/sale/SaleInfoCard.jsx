import { Card, CardContent, Chip, Divider, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { formatDate } from '@utils/date-utils.js';

const decimalType = PropTypes.oneOfType([PropTypes.number, PropTypes.string]);
const SALE_STATUS_LABELS = { COMPLETED: 'Selesai' };
const PAYMENT_STATUS_LABELS = { PAID: 'Lunas' };
const CORRECTION_STATUS_LABELS = { NONE: 'Tanpa pembatalan/retur' };
const PAYMENT_TYPE_LABELS = { CASH: 'Tunai', QRIS: 'QRIS' };

const StatusChip = ({ label, value, color = 'default' }) => (
    <Chip
        size="small"
        color={ color }
        variant="outlined"
        label={ label[value] || value || '-' }
        aria-label={ `${ label[value] || value || '-' }` }
    />
);

StatusChip.propTypes = {
    label: PropTypes.object.isRequired,
    value: PropTypes.string,
    color: PropTypes.string
};

const SaleInfoCard = ({ sale }) => {
    if (!sale) return null;

    return (
        <Card className="shadow-md">
            <CardContent className="space-y-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <Typography variant="h6" className="font-bold text-primary-main">Informasi Penjualan</Typography>
                        <Typography variant="body2" color="textSecondary">Referensi { sale.code || '-' }</Typography>
                    </div>
                    <div className="flex flex-wrap gap-2" aria-label="Status penjualan dari server">
                        <StatusChip label={ SALE_STATUS_LABELS } value={ sale.saleStatus } color="success" />
                        <StatusChip label={ PAYMENT_STATUS_LABELS } value={ sale.paymentStatus } color="success" />
                        <StatusChip label={ CORRECTION_STATUS_LABELS } value={ sale.correctionStatus } />
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:col-span-2">
                        <div><dt className="text-gray-600">Kode transaksi</dt><dd className="font-medium break-all">{ sale.code || '-' }</dd></div>
                        <div><dt className="text-gray-600">Sesi kas</dt><dd className="font-medium">{ sale.sessionId ? `#${ sale.sessionId }` : '-' }</dd></div>
                        <div><dt className="text-gray-600">Tanggal</dt><dd className="font-medium">{ formatDate(sale.createdAt) || '-' }</dd></div>
                        <div><dt className="text-gray-600">Kasir</dt><dd className="font-medium">{ sale.createdBy || 'SYSTEM' }</dd></div>
                        <div><dt className="text-gray-600">Metode pembayaran</dt><dd className="font-medium">{ PAYMENT_TYPE_LABELS[sale.paymentType] || sale.paymentType || '-' }</dd></div>
                        <div><dt className="text-gray-600">Keterangan</dt><dd className="font-medium">{ sale.description || '-' }</dd></div>
                    </dl>

                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between gap-3"><dt className="text-gray-600">Subtotal</dt><dd className="tabular-nums">{ formatRupiah(sale.subtotalAmount) }</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-gray-600">Diskon</dt><dd className="tabular-nums">{ formatRupiah(sale.discountAmount) }</dd></div>
                            <Divider />
                            <div className="flex justify-between gap-3 font-bold"><dt>Total</dt><dd className="tabular-nums">{ formatRupiah(sale.totalAmount) }</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-gray-600">{ sale.paymentType === 'CASH' ? 'Uang diterima' : 'Nominal QRIS' }</dt><dd className="tabular-nums">{ formatRupiah(sale.paidAmount) }</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-gray-600">Kembalian</dt><dd className="tabular-nums">{ formatRupiah(sale.changeAmount) }</dd></div>
                        </dl>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

SaleInfoCard.propTypes = {
    sale: PropTypes.shape({
        code: PropTypes.string,
        sessionId: PropTypes.number,
        saleStatus: PropTypes.string,
        paymentStatus: PropTypes.string,
        correctionStatus: PropTypes.string,
        paymentType: PropTypes.string,
        description: PropTypes.string,
        subtotalAmount: decimalType,
        discountAmount: decimalType,
        totalAmount: decimalType,
        paidAmount: decimalType,
        changeAmount: decimalType,
        createdAt: PropTypes.string,
        createdBy: PropTypes.string
    })
};

export default SaleInfoCard;
