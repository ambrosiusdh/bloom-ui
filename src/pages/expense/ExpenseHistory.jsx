import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import PropTypes from 'prop-types';

import expenseApi from '@api/expense.js';
import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import ExpenseVoidDialog from '@components/expense/ExpenseVoidDialog.jsx';
import useBreadcrumbStore from '@stores/modules/breadcrumb.js';
import useExpenseVoidStore from '@stores/modules/expense-void.js';
import { formatDate } from '@utils/date-utils.js';
import {
    EXPENSE_CATEGORIES,
    canVoidExpense,
    expenseClassificationLabel,
    expenseStatusLabel,
    expenseVoidEligibility
} from '@utils/expense-utils.js';

const sizes = [10, 25, 50];

function ExpenseHistoryRow({ record, actionDisabled, onOpenDetail }) {
    const blocked = !canVoidExpense(record);

    return (
        <TableRow
            aria-label={ `Pengeluaran #${ record.id }` }
            className="!grid grid-cols-1 gap-x-5 gap-y-4 border-b border-gray-200 px-4 py-4 sm:grid-cols-2 xl:!table-row xl:border-b-0 xl:p-0"
        >
            <TableCell className="!block !border-b-0 !p-0 sm:col-span-2 xl:!table-cell xl:!border-b xl:!p-4">
                <span className="block text-xs font-medium text-gray-600 xl:hidden">Pengeluaran</span>
                <strong className="mt-1 block xl:mt-0">
                    #{ record.id } · { EXPENSE_CATEGORIES[record.category] || record.category || '-' }
                </strong>
                <span className="mt-1 block text-sm text-gray-600">
                    { expenseClassificationLabel(record) } · { record.description || 'Tanpa catatan' }
                </span>
            </TableCell>
            <TableCell className="!block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4">
                <span className="mb-1 block text-xs font-medium text-gray-600 xl:hidden">
                    Status &amp; kelayakan
                </span>
                <div className="flex min-w-0 flex-col items-start gap-1">
                    <Chip
                        color={ record.voided ? 'default' : 'success' }
                        label={ expenseStatusLabel(record) }
                        size="small"
                    />
                    <span className={ `text-sm ${ blocked ? 'text-gray-700' : 'text-green-800' }` }>
                        { expenseVoidEligibility(record) }
                    </span>
                </div>
            </TableCell>
            <TableCell className="!block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4" align="right">
                <span className="block text-xs font-medium text-gray-600 xl:hidden">Nominal</span>
                <strong className="mt-1 block xl:mt-0">{ formatRupiah(record.amount) }</strong>
            </TableCell>
            <TableCell className="!block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4">
                <span className="block text-xs font-medium text-gray-600 xl:hidden">Sesi kas asli</span>
                <Button
                    component={ Link }
                    to={ `/cash-sessions/${ record.cashSessionId }` }
                    className="!mt-1 !min-h-11 !min-w-0 !justify-start !p-0 !normal-case xl:!mt-0"
                >
                    Sesi kas #{ record.cashSessionId }
                </Button>
            </TableCell>
            <TableCell className="!block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4">
                <span className="block text-xs font-medium text-gray-600 xl:hidden">
                    Dicatat oleh &amp; pada
                </span>
                <span className="mt-1 block xl:mt-0">{ record.createdBy || '-' }</span>
                <span className="mt-1 block text-sm text-gray-600">
                    { formatDate(record.createdAt) || '-' }
                </span>
            </TableCell>
            <TableCell className="!block !border-b-0 !p-0 sm:col-span-2 xl:!table-cell xl:!border-b xl:!p-4">
                <span className="block text-xs font-medium text-gray-600 xl:hidden">Tindakan</span>
                <div className="mt-1 flex xl:mt-0 xl:justify-end">
                    <Button
                        disabled={ actionDisabled }
                        onClick={ onOpenDetail }
                        sx={ { minHeight: 44 } }
                    >
                        Buka detail pengeluaran #{ record.id }
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

ExpenseHistoryRow.propTypes = {
    record: PropTypes.object.isRequired,
    actionDisabled: PropTypes.bool.isRequired,
    onOpenDetail: PropTypes.func.isRequired
};

export default function ExpenseHistory() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const reversal = useExpenseVoidStore();
    const headingRef = useRef(null);
    const triggerRef = useRef(null);
    const [params, setParams] = useSearchParams();
    const rawPage = params.get('page');
    const page = /^\d+$/.test(rawPage || '') && Number(rawPage) > 0 && Number(rawPage) <= 2147483647 ? Number(rawPage) : 1;
    const size = sizes.includes(Number(params.get('size'))) ? Number(params.get('size')) : 10;
    const query = `page=${ page }&size=${ size }`;
    const canonical = params.toString() === query;
    const [retry, setRetry] = useState(0);
    const [state, setState] = useState({
        status: 'loading',
        query: '',
        rows: [],
        pages: 0,
        totalElements: 0
    });
    const loading = state.status === 'loading' || state.query !== query;
    const firstVisibleItem = state.rows.length ? ((page - 1) * size) + 1 : 0;
    const lastVisibleItem = state.rows.length
        ? firstVisibleItem + state.rows.length - 1
        : 0;

    useEffect(() => setBreadcrumbs(['Pengeluaran']), [setBreadcrumbs]);

    useEffect(() => {
        if (params.toString() !== query) {
            setParams(query, { replace: true });
        }
    }, [params, query, setParams]);
    useEffect(() => {
        if (!canonical) {
            return;
        }
        let active = true;
        setState({
            status: 'loading',
            query,
            rows: [],
            pages: 0,
            totalElements: 0
        });
        expenseApi.getExpenseList({
            page,
            size
        }).then(({ data: response }) => {
            const data = response?.data;
            if (!Array.isArray(data?.content) || !Number.isInteger(data.totalPages)) {
                throw new Error('Invalid page');
            }
            if (!active) {
                return;
            }
            if (page > Math.max(1, data.totalPages)) {
                setParams({
                    page: String(Math.max(1, data.totalPages)),
                    size: String(size)
                }, { replace: true });
                return;
            }

            const minimumKnownTotal = data.totalPages > page
                ? page * size + 1
                : ((page - 1) * size) + data.content.length;

            setState({
                status: 'ready',
                query,
                rows: data.content,
                pages: data.totalPages,
                totalElements: Number.isInteger(data.totalElements)
                    ? data.totalElements
                    : minimumKnownTotal
            });
        }).catch(() => {
            if (active) {
                setState({
                    status: 'error',
                    query,
                    rows: [],
                    pages: 0,
                    totalElements: 0
                });
            }
        });
        return () => {
            active = false;
        };
    }, [page, size, query, canonical, retry, reversal.historyRevision, setParams]);

    const updatePage = nextPage => setParams({
        page: String(nextPage),
        size: String(size)
    });

    return (
        <div className="space-y-4">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Typography component="h1" variant="h4" tabIndex={ -1 } ref={ headingRef }>
                        Riwayat pengeluaran
                    </Typography>
                    <Typography sx={ { mt: 1, color: 'text.secondary' } }>
                        Pengeluaran seluruh sesi, terbaru terlebih dahulu. Tidak ada filter pada kontrak saat ini.
                    </Typography>
                </div>
                <Button component={ Link } to="/expenses/new" variant="contained" sx={ { minHeight: 44 } }>
                    Catat pengeluaran
                </Button>
            </header>

            <ExpenseVoidDialog
                onExited={ () => (triggerRef.current?.isConnected
                    ? triggerRef.current
                    : headingRef.current)?.focus() }
            />

            <section
                className="overflow-hidden rounded-lg bg-white pb-2 shadow-lg"
                aria-labelledby="expense-history-list-heading"
            >
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Typography component="h2" variant="h6" id="expense-history-list-heading">
                            Daftar pengeluaran
                        </Typography>
                        { !loading && state.status === 'ready' && (
                            <p className="mt-1 text-sm text-gray-600" aria-live="polite">
                                { state.rows.length
                                    ? `${ firstVisibleItem }–${ lastVisibleItem } dari ${ state.totalElements } pengeluaran`
                                    : '0 pengeluaran' }
                            </p>
                        ) }
                    </div>
                    <div
                        className="flex flex-wrap items-center gap-2"
                        aria-label="Navigasi halaman riwayat pengeluaran"
                    >
                        <TextField
                            select
                            size="small"
                            label="Per halaman"
                            value={ size }
                            className="w-32"
                            onChange={ event => setParams({
                                page: '1',
                                size: String(event.target.value)
                            }) }
                        >
                            { sizes.map(value => (
                                <MenuItem key={ value } value={ value }>{ value }</MenuItem>
                            )) }
                        </TextField>
                        <Button
                            type="button"
                            size="small"
                            disabled={ loading || state.status === 'error' || page <= 1 || !state.pages }
                            onClick={ () => updatePage(page - 1) }
                        >
                            Sebelumnya
                        </Button>
                        <span className="min-w-24 text-center text-sm text-gray-600" aria-current="page">
                            Halaman { state.pages ? Math.min(page, state.pages) : 1 } dari { state.pages || 1 }
                        </span>
                        <Button
                            type="button"
                            size="small"
                            disabled={ loading || state.status === 'error' || !state.pages || page >= state.pages }
                            onClick={ () => updatePage(page + 1) }
                        >
                            Berikutnya
                        </Button>
                        <Button
                            type="button"
                            size="small"
                            disabled={ loading }
                            onClick={ () => setRetry(value => value + 1) }
                        >
                            Muat ulang riwayat
                        </Button>
                    </div>
                </div>

                { loading ? (
                    <div className="py-12 text-center" role="status" aria-live="polite">
                        <CircularProgress size={ 22 } aria-hidden="true" />{ ' ' }
                        <span>Memuat pengeluaran...</span>
                    </div>
                ) : state.status === 'error' ? (
                    <div className="p-4">
                        <Alert
                            severity="error"
                            action={ (
                                <Button color="inherit" onClick={ () => setRetry(value => value + 1) }>
                                    Coba lagi
                                </Button>
                            ) }
                        >
                            Riwayat pengeluaran gagal dimuat. Halaman dan ukuran tetap dipertahankan.
                        </Alert>
                    </div>
                ) : !state.rows.length ? (
                    <div className="px-4 py-12 text-center" role="status">
                        <strong className="block">Belum ada pengeluaran</strong>
                        <p className="mt-1 text-gray-600">
                            Gunakan Catat pengeluaran setelah sesi kas terbuka.
                        </p>
                    </div>
                ) : (
                    <TableContainer component="div" className="!overflow-x-hidden">
                        <Table
                            className="!block xl:!table xl:!table-fixed"
                            aria-label="Daftar pengeluaran"
                        >
                            <caption className="sr-only">
                                Identitas, status dan kelayakan, nominal, sesi kas, audit, dan tindakan pengeluaran.
                            </caption>
                            <TableHead className="hidden bg-gray-100 xl:!table-header-group">
                                <TableRow>
                                    <TableCell className="xl:!w-[27%]">Pengeluaran</TableCell>
                                    <TableCell className="xl:!w-[20%]">Status &amp; kelayakan</TableCell>
                                    <TableCell className="xl:!w-[14%]" align="right">Nominal</TableCell>
                                    <TableCell className="xl:!w-[13%]">Sesi kas asli</TableCell>
                                    <TableCell className="xl:!w-[16%]">Dicatat oleh &amp; pada</TableCell>
                                    <TableCell className="xl:!w-[10%]" align="right">Tindakan</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody className="!block xl:!table-row-group">
                                { state.rows.map(record => (
                                    <ExpenseHistoryRow
                                        key={ record.id }
                                        record={ record }
                                        actionDisabled={ !!reversal.record }
                                        onOpenDetail={ event => {
                                            triggerRef.current = event.currentTarget;
                                            reversal.begin(record);
                                        } }
                                    />
                                )) }
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) }
            </section>
        </div>
    );
}
