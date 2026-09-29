import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from '@mui/material';
import PropTypes from 'prop-types';

import cashSessionApi from '@api/cash-session.js';
import {
    formatRupiah,
    getVariancePresentation
} from '@components/cash-session/cash-session-money.js';
import CurrentCashSession from '@components/cash-session/CurrentCashSession.jsx';
import { GENERIC_ERR_MESSAGE } from '@constants/general.js';
import { useBreadcrumbStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const STATUS_OPTIONS = { OPEN: 'Terbuka', CLOSED: 'Ditutup' };
const money = value => value == null ? '-' : formatRupiah(value);
const sessionDate = value => formatDate(value, 'dd MMMM yyyy, HH:mm');

const getQueryState = params => {
    const next = new URLSearchParams(params);
    const rawPage = params.get('page');
    const requestedPage = Number(rawPage);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    if (params.has('page') && rawPage !== String(page)) next.set('page', String(page));

    const rawSize = params.get('size');
    const requestedSize = Number(rawSize);
    const size = PAGE_SIZE_OPTIONS.includes(requestedSize) ? requestedSize : 20;
    if (params.has('size') && rawSize !== String(size)) next.set('size', String(size));

    const rawStatus = params.get('status');
    const status = Object.hasOwn(STATUS_OPTIONS, rawStatus) ? rawStatus : '';
    if (params.has('status') && !status) next.delete('status');

    const canonicalSearch = next.toString();
    return {
        page,
        size,
        status,
        canonicalSearch,
        needsSanitization: canonicalSearch !== params.toString()
    };
};

function StatusChip({ status }) {
    const label = STATUS_OPTIONS[status] || status || '-';
    return (
        <Chip
            size="small"
            color={ status === 'OPEN' ? 'warning' : 'success' }
            label={ label }
            aria-label={ `Status sesi: ${ label }` }
        />
    );
}

StatusChip.propTypes = { status: PropTypes.string };

function ClosingResult({ session }) {
    if (session.status !== 'CLOSED') return <span className="text-gray-600">Belum ditutup</span>;
    const presentation = getVariancePresentation(session.difference);
    const amount = `${ presentation.sign > 0 ? '+' : '' }${ money(session.difference) }`;

    return (
        <div className="inline-flex flex-col items-start gap-1">
            <span className={ `${ presentation.badgeClass } rounded-full px-2 py-0.5 text-xs font-bold` }>
                { presentation.shortLabel }
            </span>
            <strong className={ `${ presentation.amountClass } text-sm tabular-nums` }>{ amount }</strong>
        </div>
    );
}

ClosingResult.propTypes = { session: PropTypes.object.isRequired };

function SessionCard({ session, returnTo }) {
    return (
        <article className="rounded-lg border bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-semibold">Sesi #{ session.id }</div>
                </div>
                <StatusChip status={ session.status } />
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                    <dt className="text-gray-600">Dibuka oleh &amp; pada</dt>
                    <dd>{ session.openedBy || '-' }</dd>
                    <dd className="text-gray-600">{ sessionDate(session.openedAt) || '-' }</dd>
                </div>
                <div><dt className="text-gray-600">Kas awal</dt><dd>{ money(session.openingCash) }</dd></div>
                <div><dt className="text-gray-600">Kas diharapkan</dt><dd>{ session.status === 'CLOSED' ? money(session.expectedClosingCash) : 'Belum final' }</dd></div>
                <div><dt className="text-gray-600">Kas aktual</dt><dd>{ session.status === 'CLOSED' ? money(session.actualClosingCash) : 'Belum final' }</dd></div>
                <div><dt className="text-gray-600">Selisih</dt><dd><ClosingResult session={ session } /></dd></div>
            </dl>
            <Button component={ Link } to={ `/cash-sessions/${ session.id }` } state={ { from: returnTo } }>
                Lihat detail
            </Button>
        </article>
    );
}

SessionCard.propTypes = { session: PropTypes.object.isRequired, returnTo: PropTypes.string.isRequired };

export default function CashSessionHistory() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [sessions, setSessions] = useState([]);
    const [paging, setPaging] = useState({});
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retryVersion, setRetryVersion] = useState(0);
    const {
        page,
        size,
        status,
        canonicalSearch,
        needsSanitization
    } = getQueryState(searchParams);
    const returnTo = `${ location.pathname }${ location.search }`;
    const totalElements = Number.isInteger(paging.totalElements)
        ? paging.totalElements
        : sessions.length;
    const totalPages = Number.isInteger(paging.totalPages) ? paging.totalPages : 0;
    const firstVisibleItem = sessions.length ? ((page - 1) * size) + 1 : 0;
    const lastVisibleItem = sessions.length
        ? Math.min(firstVisibleItem + sessions.length - 1, totalElements)
        : 0;

    const updateQuery = updates => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => value
            ? next.set(key, String(value)) : next.delete(key));
        setSearchParams(next);
    };

    useEffect(() => setBreadcrumbs(['Sesi Kas']), [setBreadcrumbs]);

    useEffect(() => {
        if (needsSanitization) setSearchParams(canonicalSearch, { replace: true });
    }, [canonicalSearch, needsSanitization, setSearchParams]);

    useEffect(() => {
        if (needsSanitization) return undefined;
        const controller = new AbortController();
        const params = { page, size, ...(status ? { status } : {}) };
        setLoading(true);
        setError('');
        cashSessionApi.getSessionHistory({ params, signal: controller.signal })
            .then(({ data: response }) => {
                if (controller.signal.aborted) return;
                const { content = [], ...nextPaging } = response.data || {};
                setSessions(content);
                setPaging(nextPaging);
            })
            .catch(requestError => {
                if (controller.signal.aborted) return;
                setSessions([]);
                setPaging({});
                setError(requestError?.message || GENERIC_ERR_MESSAGE);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [needsSanitization, page, retryVersion, size, status]);

    return (
        <div className="space-y-4">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="font-bold text-2xl">Sesi kas</h2>
                    <p className="mt-1 text-gray-600">
                        Pantau sesi aktif dan rekonsiliasi yang dikonfirmasi server.
                    </p>
                </div>
                <Button component={ Link } to="/cashier" variant="outlined">
                    Buka Kasir
                </Button>
            </header>

            <CurrentCashSession
                onSessionOpened={ () => setRetryVersion(value => value + 1) }
            />

            { error && (
                <Alert severity="error" action={ <Button color="inherit" onClick={ () => setRetryVersion(value => value + 1) }>Coba lagi</Button> }>
                    { error }
                </Alert>
            ) }

            <section className="card" aria-label="Filter riwayat sesi kas">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <TextField
                        select
                        label="Status sesi"
                        value={ status }
                        className="md:w-56"
                        onChange={ event => updateQuery({ status: event.target.value, page: 1 }) }
                    >
                        <MenuItem value="">Semua status</MenuItem>
                        { Object.entries(STATUS_OPTIONS).map(([value, label]) => <MenuItem key={ value } value={ value }>{ label }</MenuItem>) }
                    </TextField>
                    <Button disabled={ !status } onClick={ () => updateQuery({ status: '', page: 1 }) }>Hapus filter</Button>
                </div>
            </section>

            <section className="rounded-lg bg-white shadow-lg pb-2" aria-label="Daftar sesi kas">
                <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="text-xl font-bold">Riwayat sesi kas</h3>
                        { !isLoading && !error && (
                            <p className="mt-1 text-sm text-gray-600" aria-live="polite">
                                { sessions.length
                                    ? `${ firstVisibleItem }–${ lastVisibleItem } dari ${ totalElements } sesi`
                                    : '0 sesi' }
                            </p>
                        ) }
                    </div>
                    <div
                        className="flex flex-wrap items-center gap-2"
                        aria-label="Navigasi halaman riwayat sesi kas"
                    >
                        <span className="text-sm">Per halaman:</span>
                        <TextField
                            select
                            size="small"
                            value={ size }
                            className="w-20"
                            aria-label="Data per halaman"
                            onChange={ event => updateQuery({ size: event.target.value, page: 1 }) }
                        >
                            { PAGE_SIZE_OPTIONS.map(value => <MenuItem key={ value } value={ value }>{ value }</MenuItem>) }
                        </TextField>
                        <Button
                            size="small"
                            disabled={ isLoading || page <= 1 || !totalPages }
                            onClick={ () => updateQuery({ page: page - 1 }) }
                        >
                            Sebelumnya
                        </Button>
                        <span className="min-w-24 text-center text-sm" aria-current="page">
                            Halaman { totalPages ? Math.min(page, totalPages) : 1 } dari { totalPages || 1 }
                        </span>
                        <Button
                            size="small"
                            disabled={ isLoading || !totalPages || page >= totalPages }
                            onClick={ () => updateQuery({ page: page + 1 }) }
                        >
                            Berikutnya
                        </Button>
                    </div>
                </div>

                { isLoading ? (
                    <div className="py-12 text-center" role="status" aria-live="polite">
                        <CircularProgress size={ 22 } aria-hidden="true" /> <span>Memuat sesi kas...</span>
                    </div>
                ) : error ? (
                    <div className="py-12 text-center text-gray-600">Riwayat sesi belum dapat ditampilkan.</div>
                ) : sessions.length ? (
                    <>
                        <div className="space-y-3 p-4 md:hidden">
                            { sessions.map(session => <SessionCard key={ session.id } session={ session } returnTo={ returnTo } />) }
                        </div>
                        <TableContainer component={ Paper } elevation={ 0 } className="hidden md:block">
                            <Table sx={ { minWidth: 1050 } } aria-label="Riwayat sesi kas">
                                <TableHead className="bg-gray-100"><TableRow>
                                    <TableCell>Sesi</TableCell><TableCell>Status</TableCell><TableCell>Dibuka oleh &amp; pada</TableCell>
                                    <TableCell align="right">Kas awal</TableCell><TableCell align="right">Kas diharapkan</TableCell>
                                    <TableCell align="right">Kas aktual</TableCell><TableCell>Selisih</TableCell><TableCell />
                                </TableRow></TableHead>
                                <TableBody>{ sessions.map(session => (
                                    <TableRow key={ session.id } hover>
                                        <TableCell><strong>#{ session.id }</strong></TableCell>
                                        <TableCell><StatusChip status={ session.status } /></TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <span>{ session.openedBy || '-' }</span>
                                            <div className="text-sm text-gray-600">
                                                { sessionDate(session.openedAt) || '-' }
                                            </div>
                                        </TableCell>
                                        <TableCell align="right">{ money(session.openingCash) }</TableCell>
                                        <TableCell align="right">{ session.status === 'CLOSED' ? money(session.expectedClosingCash) : 'Belum final' }</TableCell>
                                        <TableCell align="right">{ session.status === 'CLOSED' ? money(session.actualClosingCash) : '-' }</TableCell>
                                        <TableCell><ClosingResult session={ session } /></TableCell>
                                        <TableCell><Button component={ Link } to={ `/cash-sessions/${ session.id }` } state={ { from: returnTo } }>Detail</Button></TableCell>
                                    </TableRow>
                                )) }</TableBody>
                            </Table>
                        </TableContainer>
                    </>
                ) : (
                    <div className="py-12 px-4 text-center">
                        <div className="font-semibold">Tidak ada sesi kas</div>
                        <p className="mt-1 text-gray-600">{ status ? 'Ubah atau hapus filter untuk melihat sesi lain.' : 'Riwayat akan tampil setelah sesi kas dibuat.' }</p>
                    </div>
                ) }
            </section>
        </div>
    );
}
