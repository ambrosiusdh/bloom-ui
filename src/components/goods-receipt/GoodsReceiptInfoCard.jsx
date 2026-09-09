import { Card, CardContent, Chip, Divider, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { formatDate } from '@utils/date-utils.js';
import {
    getGoodsReceiptStatusColor,
    GOODS_RECEIPT_PAYMENT_STATUS_LABELS,
    GOODS_RECEIPT_STATUS_LABELS
} from '@utils/goods-receipt-utils.js';

const decimalType = PropTypes.oneOfType([PropTypes.number, PropTypes.string]);
const money = value => value == null ? '-' : formatRupiah(value);

const propTypes = {
    receipt: PropTypes.shape({
        code: PropTypes.string,
        receivedDate: PropTypes.string,
        supplierId: PropTypes.number,
        supplierCode: PropTypes.string,
        supplierName: PropTypes.string,
        totalAmount: decimalType,
        paidAmount: decimalType,
        outstandingAmount: decimalType,
        paymentStatus: PropTypes.string,
        status: PropTypes.string,
        description: PropTypes.string,
        createdAt: PropTypes.string,
        createdBy: PropTypes.string,
        cancelledAt: PropTypes.string,
        cancelledBy: PropTypes.string,
        cancellationReason: PropTypes.string
    })
};

const GoodsReceiptInfoCard = ({ receipt }) => {
    if (!receipt) return null;

    const receiptStatus = GOODS_RECEIPT_STATUS_LABELS[receipt.status] || receipt.status || '-';
    const paymentStatus = GOODS_RECEIPT_PAYMENT_STATUS_LABELS[receipt.paymentStatus]
        || receipt.paymentStatus
        || '-';

    return (
        <Card className="shadow-md">
            <CardContent className="space-y-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <Typography variant="h6" className="font-bold text-primary-main">Informasi Penerimaan Barang</Typography>
                        <Typography variant="body2" color="textSecondary">Referensi { receipt.code || '-' }</Typography>
                    </div>
                    <div className="flex flex-wrap gap-2" aria-label="Status penerimaan dari server">
                        <Chip
                            size="small"
                            variant="outlined"
                            label={ receiptStatus }
                            color={ getGoodsReceiptStatusColor(receipt.status) }
                            aria-label={ `Status penerimaan: ${ receiptStatus }` } />
                        <Chip
                            size="small"
                            variant="outlined"
                            label={ paymentStatus }
                            color={ getGoodsReceiptStatusColor(receipt.paymentStatus) }
                            aria-label={ `Status pembayaran: ${ paymentStatus }` } />
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:col-span-2">
                        <div><dt className="text-gray-600">Nomor penerimaan</dt><dd className="font-medium break-all">{ receipt.code || '-' }</dd></div>
                        <div><dt className="text-gray-600">Pemasok</dt><dd className="font-medium">{ receipt.supplierName || '-' }</dd></div>
                        <div><dt className="text-gray-600">ID pemasok</dt><dd className="font-medium">{ receipt.supplierId ?? '-' }</dd></div>
                        <div><dt className="text-gray-600">Kode pemasok</dt><dd className="font-medium">{ receipt.supplierCode || '-' }</dd></div>
                        <div><dt className="text-gray-600">Tanggal diterima</dt><dd className="font-medium">{ formatDate(receipt.receivedDate) || '-' }</dd></div>
                        <div><dt className="text-gray-600">Waktu dicatat</dt><dd className="font-medium">{ formatDate(receipt.createdAt) || '-' }</dd></div>
                        <div><dt className="text-gray-600">Dibuat oleh</dt><dd className="font-medium">{ receipt.createdBy || 'SYSTEM' }</dd></div>
                        <div><dt className="text-gray-600">Keterangan</dt><dd className="font-medium whitespace-pre-wrap">{ receipt.description || '-' }</dd></div>
                        { receipt.status === 'CANCELLED' && (
                            <>
                                <div><dt className="text-gray-600">Dibatalkan</dt><dd className="font-medium">{ formatDate(receipt.cancelledAt) || '-' }</dd></div>
                                <div><dt className="text-gray-600">Dibatalkan oleh</dt><dd className="font-medium">{ receipt.cancelledBy || '-' }</dd></div>
                                <div className="sm:col-span-2"><dt className="text-gray-600">Alasan pembatalan</dt><dd className="font-medium">{ receipt.cancellationReason || '-' }</dd></div>
                            </>
                        ) }
                    </dl>

                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                        <p className="mb-3 text-sm text-gray-600">Nilai pembayaran dari server</p>
                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between gap-3 font-bold"><dt>Total</dt><dd className="tabular-nums">{ money(receipt.totalAmount) }</dd></div>
                            <Divider />
                            <div className="flex justify-between gap-3"><dt className="text-gray-600">Sudah dibayar</dt><dd className="tabular-nums">{ money(receipt.paidAmount) }</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-gray-600">Belum dibayar</dt><dd className="font-medium tabular-nums">{ money(receipt.outstandingAmount) }</dd></div>
                        </dl>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

GoodsReceiptInfoCard.propTypes = propTypes;

export default GoodsReceiptInfoCard;
