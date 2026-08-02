import PropTypes from 'prop-types';

import { Card, CardContent, Typography, Divider } from '@mui/material';

import { formatDate } from '@utils/date-utils.js';

const propTypes = {
    receipt: PropTypes.shape({
        code: PropTypes.string,
        receivedDate: PropTypes.string,
        supplierName: PropTypes.string,
        description: PropTypes.string,
        createdBy: PropTypes.string,
    })
};

const GoodsReceiptInfoCard = ({ receipt }) => {
    if (!receipt) return null;

    const {
        code,
        receivedDate,
        supplierName,
        description,
        createdBy
    } = receipt;

    return (
        <Card className="mb-6 shadow-md">
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <Typography variant="h6" className="font-bold text-primary-main">
                        Informasi Penerimaan Barang
                    </Typography>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                            <Typography variant="body2" color="textSecondary">No. Penerimaan</Typography>
                            <Typography variant="body2" className="font-medium">{ code }</Typography>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                            <Typography variant="body2" color="textSecondary">Tanggal Terima</Typography>
                            <Typography variant="body2" className="font-medium">{ formatDate(receivedDate) }</Typography>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                            <Typography variant="body2" color="textSecondary">Dibuat Oleh</Typography>
                            <Typography variant="body2" className="font-medium">{ createdBy }</Typography>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                            <Typography variant="body2" color="textSecondary">Supplier</Typography>
                            <Typography variant="body2" className="font-medium">{ supplierName || '-' }</Typography>
                        </div>
                        <div className="flex flex-col p-2 hover:bg-gray-50 rounded transition-colors gap-1">
                            <Typography variant="body2" color="textSecondary">Keterangan</Typography>
                            <Typography variant="body2" className="font-medium whitespace-pre-wrap">{ description || '-' }</Typography>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

GoodsReceiptInfoCard.propTypes = propTypes;

export default GoodsReceiptInfoCard;
