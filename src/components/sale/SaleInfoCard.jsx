import { Card, CardContent, Typography, Chip, Divider } from '@mui/material';
import { formatDate } from '@utils/date-utils';

const SaleInfoCard = ({ sale }) => {
    if (!sale) return null;

    const {
        code,
        createdAt,
        createdBy,
        paymentType,
        subtotalAmount,
        discountAmount,
        totalAmount,
        paidAmount
    } = sale;

    const isPaid = paidAmount >= totalAmount;

    return (
        <Card className="mb-6 shadow-md">
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <Typography variant="h6" className="font-bold text-primary-main">
                        Informasi Penjualan
                    </Typography>
                    <Chip
                        label={isPaid ? "Lunas" : "Belum Lunas"}
                        color={isPaid ? "success" : "warning"}
                        variant="outlined"
                        size="small"
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                            <Typography variant="body2" color="textSecondary">Kode Transaksi</Typography>
                            <Typography variant="body2" className="font-medium">{code}</Typography>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                            <Typography variant="body2" color="textSecondary">Tanggal</Typography>
                            <Typography variant="body2" className="font-medium">{formatDate(createdAt)}</Typography>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                            <Typography variant="body2" color="textSecondary">Kasir</Typography>
                            <Typography variant="body2" className="font-medium">{createdBy}</Typography>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                            <Typography variant="body2" color="textSecondary">Tipe Pembayaran</Typography>
                            <Typography variant="body2" className="font-medium">{paymentType}</Typography>
                        </div>
                    </div>

                    <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-lg border border-gray-100 h-fit">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Typography variant="body2" color="textSecondary">Subtotal</Typography>
                                <Typography variant="body2" className="font-medium">Rp {subtotalAmount?.toLocaleString('id-ID')}</Typography>
                            </div>
                            <div className="flex justify-between">
                                <Typography variant="body2" color="textSecondary">Diskon</Typography>
                                <Typography variant="body2" className="font-medium text-red-600">- Rp {discountAmount?.toLocaleString('id-ID')}</Typography>
                            </div>
                            <Divider className="my-2" />
                            <div className="flex justify-between items-end">
                                <Typography variant="subtitle1" className="font-bold text-gray-700">Total</Typography>
                                <Typography variant="h6" className="font-bold text-primary-main">Rp {totalAmount?.toLocaleString('id-ID')}</Typography>
                            </div>
                            <div className="flex justify-between pt-1">
                                <Typography variant="body2" color="textSecondary">Bayar</Typography>
                                <Typography variant="body2" className="font-medium">Rp {paidAmount?.toLocaleString('id-ID')}</Typography>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SaleInfoCard;
