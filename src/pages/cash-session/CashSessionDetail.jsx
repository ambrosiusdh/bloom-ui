import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Alert, Button, Chip, CircularProgress, Paper } from '@mui/material';
import { ArrowLeft } from 'lucide-react';

import cashSessionApi from '@api/cash-session.js';
import { formatRupiah, getMoneySign } from '@components/cash-session/cash-session-money.js';
import { GENERIC_ERR_MESSAGE } from '@constants/general.js';
import { useBreadcrumbStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';

const money = value => value == null ? '-' : formatRupiah(value);
const varianceLabel = value => getMoneySign(value) < 0
    ? 'Selisih kurang' : getMoneySign(value) > 0 ? 'Selisih lebih' : 'Seimbang';

export default function CashSessionDetail() {
    const { sessionId } = useParams();
    const location = useLocation();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const [session, setSession] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retryVersion, setRetryVersion] = useState(0);
    const numericId = Number(sessionId);
    const isValidId = Number.isInteger(numericId) && numericId > 0;
    const returnTo = typeof location.state?.from === 'string'
        && location.state.from.startsWith('/cash-sessions') ? location.state.from : '/cash-sessions';

    useEffect(() => setBreadcrumbs([
        { to: '/cash-sessions', label: 'Riwayat Sesi Kas' },
        `Sesi #${ sessionId }`
    ]), [sessionId, setBreadcrumbs]);

    useEffect(() => {
        if (!isValidId) {
            setLoading(false);
            setError('ID sesi kas tidak valid.');
            return undefined;
        }
        const controller = new AbortController();
        setLoading(true);
        setError('');
        cashSessionApi.getSessionDetails(numericId, { signal: controller.signal })
            .then(({ data: response }) => {
                if (!controller.signal.aborted) setSession(response.data);
            })
            .catch(requestError => {
                if (!controller.signal.aborted) {
                    setSession(null);
                    setError(requestError?.message || GENERIC_ERR_MESSAGE);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [isValidId, numericId, retryVersion]);

    if (isLoading) return (
        <div className="py-16 text-center" role="status" aria-live="polite">
            <CircularProgress size={ 24 } aria-hidden="true" /> <span>Memuat detail sesi kas...</span>
        </div>
    );

    if (error || !session) return (
        <div className="space-y-4">
            <Alert severity="error" action={ isValidId ? <Button color="inherit" onClick={ () => setRetryVersion(value => value + 1) }>Coba lagi</Button> : undefined }>
                { error || 'Detail sesi kas tidak tersedia.' }
            </Alert>
            <Button component={ Link } to={ returnTo } startIcon={ <ArrowLeft /> }>Kembali ke riwayat</Button>
        </div>
    );

    const closed = session.status === 'CLOSED';
    const statusLabel = closed ? 'Ditutup' : 'Terbuka';

    return (
        <div className="space-y-4 pb-8">
            <Button component={ Link } to={ returnTo } startIcon={ <ArrowLeft /> }>Kembali ke riwayat</Button>
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div><h2 className="text-2xl font-bold">Detail Sesi Kas #{ session.id }</h2><p className="text-gray-600">Data audit dan rekonsiliasi dari server.</p></div>
                <Chip color={ closed ? 'success' : 'warning' } label={ statusLabel } aria-label={ `Status sesi: ${ statusLabel }` } />
            </header>

            { !closed && <Alert severity="info">Sesi masih terbuka. Nilai kas aktual dan hasil selisih tersedia setelah sesi ditutup.</Alert> }

            <div className="grid gap-4 lg:grid-cols-2">
                <Paper className="p-4 md:p-5" component="section" aria-labelledby="session-opening-title">
                    <h3 id="session-opening-title" className="text-lg font-bold mb-4">Pembukaan</h3>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div><dt className="text-sm text-gray-600">Kas awal</dt><dd className="text-xl font-semibold">{ money(session.openingCash) }</dd></div>
                        <div><dt className="text-sm text-gray-600">Dibuka oleh</dt><dd>{ session.openedBy || '-' }</dd></div>
                        <div className="sm:col-span-2"><dt className="text-sm text-gray-600">Waktu buka</dt><dd>{ formatDate(session.openedAt) || '-' }</dd></div>
                    </dl>
                </Paper>

                <Paper className="p-4 md:p-5" component="section" aria-labelledby="session-closing-title">
                    <h3 id="session-closing-title" className="text-lg font-bold mb-4">Penutupan dan rekonsiliasi</h3>
                    { closed ? (
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div><dt className="text-sm text-gray-600">Kas diharapkan</dt><dd className="font-semibold">{ money(session.expectedClosingCash) }</dd></div>
                            <div><dt className="text-sm text-gray-600">Kas aktual</dt><dd className="font-semibold">{ money(session.actualClosingCash) }</dd></div>
                            <div><dt className="text-sm text-gray-600">{ varianceLabel(session.difference) }</dt><dd className="text-xl font-bold">{ money(session.difference) }</dd></div>
                            <div><dt className="text-sm text-gray-600">Ditutup oleh</dt><dd>{ session.closedBy || '-' }</dd></div>
                            <div className="sm:col-span-2"><dt className="text-sm text-gray-600">Waktu tutup</dt><dd>{ formatDate(session.closedAt) || '-' }</dd></div>
                        </dl>
                    ) : <p className="text-gray-600">Belum ada hasil penutupan untuk sesi ini.</p> }
                </Paper>
            </div>
        </div>
    );
}
