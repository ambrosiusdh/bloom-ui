import PropTypes from 'prop-types';

import { Card, CardContent, Typography, Divider } from '@mui/material';

import { formatDate } from '@utils/date-utils.js';

const propTypes = {
    adjustment: PropTypes.shape({
        stockAdjustmentCode: PropTypes.string, // API uses stockAdjustmentCode
        createdDate: PropTypes.string,
        reason: PropTypes.string,
        createdBy: PropTypes.string,
    })
};

const StockAdjustmentInfoCard = ({ adjustment }) => {
    if (!adjustment) return null;

    const {
        stockAdjustmentCode,
        createdDate,
        reason,
        createdBy
    } = adjustment;

    return (
        <Card className="mb-6 shadow-md">
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <Typography variant="h6" className="font-bold text-primary-main">
                        Informasi Penyesuaian Stok
                    </Typography>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                            <Typography variant="body2" color="textSecondary">No. Referensi</Typography>
                            <Typography variant="body2" className="font-medium">{ stockAdjustmentCode }</Typography>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                            <Typography variant="body2" color="textSecondary">Tanggal</Typography>
                            <Typography variant="body2" className="font-medium">{ formatDate(createdDate) }</Typography>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                            <Typography variant="body2" color="textSecondary">Dibuat Oleh</Typography>
                            <Typography variant="body2" className="font-medium">{ createdBy }</Typography>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3">
                        <div className="flex flex-col p-2 hover:bg-gray-50 rounded transition-colors gap-1">
                            <Typography variant="body2" color="textSecondary">Alasan</Typography>
                            <Typography variant="body2" className="font-medium whitespace-pre-wrap">{ reason || '-' }</Typography>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

StockAdjustmentInfoCard.propTypes = propTypes;

export default StockAdjustmentInfoCard;
