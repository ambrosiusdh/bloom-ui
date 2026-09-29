import { useEffect, useState } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle
} from '@mui/material';
import {
    ChevronDownIcon,
    CircleDollarSignIcon
} from 'lucide-react';

import CurrentCashSession from '@components/cash-session/CurrentCashSession.jsx';
import { useCashSessionStore } from '@stores/index.js';

const getSessionLabel = (status, session) => {
    if (status === 'idle' || status === 'loading') return 'Memuat sesi kas';
    if (status === 'error') return 'Periksa sesi kas';
    if (!session) return 'Buka sesi kas';
    if (session.status === 'OPEN') return `Sesi #${ session.id } · Terbuka`;
    return `Sesi #${ session.id } · Ditutup`;
};

export default function CashierSessionControl() {
    const currentSession = useCashSessionStore(state => state.currentSession);
    const currentStatus = useCashSessionStore(state => state.currentStatus);
    const getCurrentSession = useCashSessionStore(state => state.getCurrentSession);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (currentStatus === 'idle') {
            getCurrentSession().catch(() => undefined);
        }
    }, [currentStatus, getCurrentSession]);

    const label = getSessionLabel(currentStatus, currentSession);
    const isLoading = currentStatus === 'idle' || currentStatus === 'loading';

    return (
        <>
            <Button
                type="button"
                className="cashier-session-control"
                color={ currentStatus === 'error' ? 'warning' : 'success' }
                variant="outlined"
                startIcon={ <CircleDollarSignIcon aria-hidden="true" /> }
                endIcon={ <ChevronDownIcon aria-hidden="true" /> }
                aria-haspopup="dialog"
                aria-expanded={ open }
                aria-label={ `${ label }. Kelola sesi kas` }
                disabled={ isLoading }
                onClick={ () => setOpen(true) }
            >
                { label }
            </Button>

            <Dialog
                open={ open }
                onClose={ () => setOpen(false) }
                aria-labelledby="cashier-session-dialog-title"
                maxWidth="md"
                fullWidth
            >
                <DialogTitle id="cashier-session-dialog-title">
                    Kelola sesi kas
                </DialogTitle>
                <DialogContent>
                    <CurrentCashSession />
                </DialogContent>
            </Dialog>
        </>
    );
}
