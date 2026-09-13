import { Card, CardContent, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { formatDate } from '@utils/date-utils.js';

export default function StockAdjustmentInfoCard({ adjustment }) {
    if (!adjustment) {
        return null;
    }

    return (
        <Card className="shadow-md">
            <CardContent>
                <Typography variant="h6" className="font-bold text-primary-main">
                    Informasi penyesuaian stok
                </Typography>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm text-slate-600">Nomor referensi</dt>
                        <dd className="font-semibold break-all">{ adjustment.stockAdjustmentCode || '-' }</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-600">Waktu pencatatan</dt>
                        <dd>{ formatDate(adjustment.createdAt) || '-' }</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-600">Dibuat oleh</dt>
                        <dd>{ adjustment.createdBy || 'SYSTEM' }</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-600">Alasan yang dikonfirmasi</dt>
                        <dd className="whitespace-pre-wrap">{ adjustment.reason || '-' }</dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}

StockAdjustmentInfoCard.propTypes = {
    adjustment: PropTypes.shape({
        stockAdjustmentCode: PropTypes.string,
        createdAt: PropTypes.string,
        reason: PropTypes.string,
        createdBy: PropTypes.string
    })
};
