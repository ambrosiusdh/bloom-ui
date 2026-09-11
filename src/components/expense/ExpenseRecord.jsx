import { Link } from 'react-router-dom';
import { Button, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { formatDate } from '@utils/date-utils.js';
import { EXPENSE_CATEGORIES } from '@utils/expense-utils.js';

export default function ExpenseRecord({ record }) {
    return (
        <Stack component="article"
               spacing={ 1 }
               sx={ { overflowWrap: 'anywhere', minWidth: 0 } }
               aria-label={ `Pengeluaran #${ record.id }` }>
            <Typography component="h2" variant="h6">#{ record.id } · { formatRupiah(record.amount) }</Typography>
            <Typography>{ EXPENSE_CATEGORIES[record.category] || record.category } · { record.voided ? 'Dibatalkan' : 'Tercatat' }</Typography>
            <Typography>{ record.operationalExpense ? 'Pengeluaran operasional' : 'Nonoperasional' }</Typography>
            <Typography>{ record.description || 'Tanpa catatan' }</Typography>
            <Typography variant="body2">Dicatat { formatDate(record.createdAt) || '-' } · { record.createdBy || '-' }</Typography>
            <Button component={ Link } to={ `/cash-sessions/${ record.cashSessionId }` } sx={ { alignSelf: 'flex-start' } }>
                Sesi kas #{ record.cashSessionId }
            </Button>
            { record.voided && <Typography variant="body2">Alasan pembatalan: { record.voidedReason || '-' } · { formatDate(record.voidedAt) || '-' } · { record.voidedBy || '-' }</Typography> }
        </Stack>
    );
}

ExpenseRecord.propTypes = { record: PropTypes.object.isRequired };
