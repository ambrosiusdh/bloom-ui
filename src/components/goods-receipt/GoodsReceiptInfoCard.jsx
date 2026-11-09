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
        <section
            className="grid min-w-0 gap-4 lg:grid-cols-2"
            aria-label="Ringkasan penerimaan barang"
        >
            <Card component="article" className="min-w-0 shadow-md">
                <CardContent className="space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <Typography component="h2" variant="h6" className="font-bold">
                                Informasi penerimaan
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Identitas dan jejak pencatatan.
                            </Typography>
                        </div>
                        <div className="flex flex-wrap gap-2" aria-label="Status penerimaan">
                            <Chip
                                size="small"
                                variant="outlined"
                                label={ receiptStatus }
                                color={ getGoodsReceiptStatusColor(receipt.status) }
                                aria-label={ `Status penerimaan: ${ receiptStatus }` }
                            />
                            <Chip
                                size="small"
                                variant="outlined"
                                label={ paymentStatus }
                                color={ getGoodsReceiptStatusColor(receipt.paymentStatus) }
                                aria-label={ `Status pembayaran: ${ paymentStatus }` }
                            />
                        </div>
                    </div>

                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="text-gray-600">Nomor penerimaan</dt>
                            <dd className="break-all font-medium">{ receipt.code || '-' }</dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">Pemasok</dt>
                            <dd className="break-words font-medium">{ receipt.supplierName || '-' }</dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">Kode pemasok</dt>
                            <dd className="break-all font-medium">{ receipt.supplierCode || '-' }</dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">ID pemasok</dt>
                            <dd className="font-medium">{ receipt.supplierId ?? '-' }</dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">Diterima pada</dt>
                            <dd className="font-medium">{ formatDate(receipt.receivedDate) || '-' }</dd>
                        </div>
                        <div>
                            <dt className="text-gray-600">Dibuat oleh &amp; pada</dt>
                            <dd className="font-medium">{ receipt.createdBy || 'SYSTEM' }</dd>
                            <dd className="text-gray-600">{ formatDate(receipt.createdAt) || '-' }</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-gray-600">Keterangan</dt>
                            <dd className="whitespace-pre-wrap break-words font-medium">
                                { receipt.description || '-' }
                            </dd>
                        </div>
                        { receipt.status === 'CANCELLED' && (
                            <>
                                <div>
                                    <dt className="text-gray-600">Dibatalkan pada</dt>
                                    <dd className="font-medium">{ formatDate(receipt.cancelledAt) || '-' }</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-600">Dibatalkan oleh</dt>
                                    <dd className="font-medium">{ receipt.cancelledBy || '-' }</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-gray-600">Alasan pembatalan</dt>
                                    <dd className="break-words font-medium">
                                        { receipt.cancellationReason || '-' }
                                    </dd>
                                </div>
                            </>
                        ) }
                    </dl>
                </CardContent>
            </Card>

            <Card component="article" className="min-w-0 shadow-md">
                <CardContent className="space-y-5">
                    <div>
                        <Typography component="h2" variant="h6" className="font-bold">
                            Nilai penerimaan
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Nilai resmi dari penerimaan yang tersimpan.
                        </Typography>
                    </div>
                    <dl className="space-y-4 text-sm">
                        <div className="flex flex-wrap justify-between gap-3">
                            <dt className="text-gray-600">Status pembayaran</dt>
                            <dd className="font-medium">{ paymentStatus }</dd>
                        </div>
                        <Divider />
                        <div className="flex flex-wrap justify-between gap-3 text-base font-bold">
                            <dt>Total</dt>
                            <dd className="tabular-nums">{ money(receipt.totalAmount) }</dd>
                        </div>
                        <div className="flex flex-wrap justify-between gap-3">
                            <dt className="text-gray-600">Sudah dibayar</dt>
                            <dd className="tabular-nums">{ money(receipt.paidAmount) }</dd>
                        </div>
                        <div className="flex flex-wrap justify-between gap-3">
                            <dt className="text-gray-600">Sisa utang</dt>
                            <dd className="font-medium tabular-nums">
                                { money(receipt.outstandingAmount) }
                            </dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
        </section>
    );
};

GoodsReceiptInfoCard.propTypes = propTypes;

export default GoodsReceiptInfoCard;
