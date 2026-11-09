import { Link } from 'react-router-dom';
import { Button, Chip, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { formatDate } from '@utils/date-utils.js';
import {
    EXPENSE_CATEGORIES,
    expenseClassificationLabel,
    expenseStatusLabel
} from '@utils/expense-utils.js';

export default function ExpenseRecord({ record, showSessionLink = true }) {
    return (
        <Stack component="article"
               spacing={ 2 }
               sx={ { overflowWrap: 'anywhere', minWidth: 0 } }
               aria-label={ `Pengeluaran #${ record.id }` }>
            <Stack direction={ {
                xs: 'column',
                sm: 'row'
            } }
            spacing={ 1 }
            alignItems={ { xs: 'flex-start', sm: 'center' } }
            justifyContent="space-between">
                <div>
                    <Typography component="h2" variant="h6">Pengeluaran #{ record.id }</Typography>
                    <Typography variant="h5" sx={ { mt: 0.5 } }>{ formatRupiah(record.amount) }</Typography>
                </div>
                <Chip
                    color={ record.voided ? 'default' : 'success' }
                    label={ expenseStatusLabel(record) }
                    size="small"
                />
            </Stack>
            <section aria-label="Pengeluaran asli">
                <Typography component="h3" variant="subtitle2">Pengeluaran asli</Typography>
                <dl className="mt-2 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-medium text-gray-600">Kategori</dt>
                        <dd className="mt-1">{ EXPENSE_CATEGORIES[record.category] || record.category || '-' }</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-gray-600">Klasifikasi</dt>
                        <dd className="mt-1">{ expenseClassificationLabel(record) }</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-xs font-medium text-gray-600">Alasan / catatan</dt>
                        <dd className="mt-1">{ record.description || 'Tanpa catatan' }</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-gray-600">Sesi kas asli</dt>
                        <dd className="mt-1">#{ record.cashSessionId }</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-gray-600">Dicatat oleh</dt>
                        <dd className="mt-1">{ record.createdBy || '-' }</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-gray-600">Dicatat pada</dt>
                        <dd className="mt-1">{ formatDate(record.createdAt) || '-' }</dd>
                    </div>
                </dl>
                { showSessionLink && (
                    <Button
                        component={ Link }
                        to={ `/cash-sessions/${ record.cashSessionId }` }
                        sx={ { alignSelf: 'flex-start', mt: 2 } }
                    >
                        Buka sesi kas #{ record.cashSessionId }
                    </Button>
                ) }
            </section>
            { record.voided && (
                <section className="border-t border-gray-200 pt-3" aria-label="Pembatalan tersimpan">
                    <Typography component="h3" variant="subtitle2">Pembatalan tersimpan</Typography>
                    <dl className="mt-2 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <dt className="text-xs font-medium text-gray-600">Alasan pembatalan</dt>
                            <dd className="mt-1">{ record.voidedReason || '-' }</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-gray-600">Dibatalkan oleh</dt>
                            <dd className="mt-1">{ record.voidedBy || '-' }</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-gray-600">Dibatalkan pada</dt>
                            <dd className="mt-1">{ formatDate(record.voidedAt) || '-' }</dd>
                        </div>
                    </dl>
                </section>
            ) }
        </Stack>
    );
}

ExpenseRecord.propTypes = {
    record: PropTypes.object.isRequired,
    showSessionLink: PropTypes.bool
};
