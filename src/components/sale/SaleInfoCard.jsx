import { Card, CardContent, Chip, Divider, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { formatDate } from '@utils/date-utils.js';

const decimalType = PropTypes.oneOfType([PropTypes.number, PropTypes.string]);
const SALE_STATUS_LABELS = { COMPLETED: 'Selesai' };
const PAYMENT_STATUS_LABELS = { PAID: 'Lunas' };
const CORRECTION_STATUS_LABELS = { NONE: 'Tanpa pembatalan/retur' };
const PAYMENT_TYPE_LABELS = { CASH: 'Tunai', QRIS: 'QRIS' };

const StatusChip = ({ label, value, type, color = 'default' }) => (
    <Chip
        size="small"
        color={ color }
        variant="outlined"
        label={ label[value] || value || '-' }
        aria-label={ `${ type }: ${ label[value] || value || '-' }` }
    />
);

StatusChip.propTypes = {
    label: PropTypes.object.isRequired,
    value: PropTypes.string,
    type: PropTypes.string.isRequired,
    color: PropTypes.string
};

const SaleInfoCard = ({ sale }) => {
    if (!sale) return null;

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,.82fr)]">
            <Card component="section" className="shadow-md" aria-labelledby="sale-transaction-heading">
                <CardContent className="space-y-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <Typography
                                id="sale-transaction-heading"
                                component="h2"
                                variant="h5"
                                className="font-bold text-primary-main break-all"
                            >
                                { sale.code || '-' }
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Referensi transaksi yang tersimpan di server
                            </Typography>
                        </div>
                        <div className="flex flex-wrap gap-2" aria-label="Status dari server">
                            <StatusChip
                                label={ SALE_STATUS_LABELS }
                                value={ sale.saleStatus }
                                type="Status penjualan"
                                color={ sale.saleStatus === 'COMPLETED' ? 'success' : 'default' }
                            />
                            <StatusChip
                                label={ PAYMENT_STATUS_LABELS }
                                value={ sale.paymentStatus }
                                type="Status pembayaran"
                                color={ sale.paymentStatus === 'PAID' ? 'success' : 'default' }
                            />
                            <StatusChip
                                label={ CORRECTION_STATUS_LABELS }
                                value={ sale.correctionStatus }
                                type="Status koreksi"
                            />
                        </div>
                    </div>

                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="text-gray-600">Sesi kas</dt>
                            <dd className="font-medium">
                                { sale.sessionId == null ? '-' : `#${ sale.sessionId }` }
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">Metode pembayaran</dt>
                            <dd className="font-medium">
                                { PAYMENT_TYPE_LABELS[sale.paymentType] || sale.paymentType || '-' }
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">Dibuat oleh</dt>
                            <dd className="font-medium">{ sale.createdBy || 'SYSTEM' }</dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">Dibuat pada</dt>
                            <dd className="font-medium">{ formatDate(sale.createdAt) || '-' }</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-gray-600">Keterangan</dt>
                            <dd className="font-medium break-words">{ sale.description || '-' }</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>

            <Card component="section" className="shadow-md" aria-labelledby="sale-values-heading">
                <CardContent className="space-y-4">
                    <div>
                        <Typography
                            id="sale-values-heading"
                            component="h2"
                            variant="h5"
                            className="font-bold"
                        >
                            Nilai dari server
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Tidak dihitung ulang di browser.
                        </Typography>
                    </div>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-600">Subtotal</dt>
                            <dd className="tabular-nums">{ formatRupiah(sale.subtotalAmount) }</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-600">Diskon</dt>
                            <dd className="tabular-nums">{ formatRupiah(sale.discountAmount) }</dd>
                        </div>
                        <Divider />
                        <div className="flex justify-between gap-3 text-lg font-bold">
                            <dt>Total</dt>
                            <dd className="tabular-nums">{ formatRupiah(sale.totalAmount) }</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-600">
                                { sale.paymentType === 'CASH' ? 'Uang diterima' : 'Nominal QRIS' }
                            </dt>
                            <dd className="tabular-nums">{ formatRupiah(sale.paidAmount) }</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-600">Kembalian</dt>
                            <dd className="tabular-nums">{ formatRupiah(sale.changeAmount) }</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
        </div>
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
