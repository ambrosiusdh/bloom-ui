import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
    Alert, Button, Chip, CircularProgress, IconButton, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip
} from '@mui/material';
import { Eye, RotateCcw } from 'lucide-react';
import PropTypes from 'prop-types';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { useBreadcrumbStore, useGoodsReceiptStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils.js';
import {
    getGoodsReceiptStatusColor,
    GOODS_RECEIPT_PAYMENT_STATUS_LABELS,
    GOODS_RECEIPT_STATUS_LABELS
} from '@utils/goods-receipt-utils.js';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const FILTER_KEYS = {
    code: 'Nomor penerimaan',
    supplierName: 'Nama pemasok'
};
const FILTER_PLACEHOLDERS = {
    code: 'Contoh: GR/IX-2026/0002',
    supplierName: 'Contoh: CV Bangun Jaya'
};

const readQueryState = params => {
    const canonical = new URLSearchParams(params);
    const requestedPage = Number(params.get('page'));
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    if (params.has('page') && params.get('page') !== String(page)) {
        canonical.set('page', String(page));
    }

    const requestedSize = Number(params.get('size'));
    const size = PAGE_SIZE_OPTIONS.includes(requestedSize) ? requestedSize : 10;
    if (params.has('size') && params.get('size') !== String(size)) {
        canonical.set('size', String(size));
    }

    const requestedKey = params.get('key');
    const filterKey = Object.hasOwn(FILTER_KEYS, requestedKey) ? requestedKey : 'code';
    if (params.has('key') && requestedKey !== filterKey) {
        canonical.set('key', filterKey);
    }

    return {
        page,
        size,
        filterKey,
        query: params.get('q') || '',
        canonicalSearch: canonical.toString(),
        needsSanitization: canonical.toString() !== params.toString()
    };
};

const money = value => value == null ? '-' : formatRupiah(value);

const StatusChip = ({ labels, type, value }) => {
    const label = labels[value] || value || '-';

    return (
        <Chip
            size="small"
            variant="outlined"
            color={ getGoodsReceiptStatusColor(value) }
            label={ label }
            aria-label={ `${ type }: ${ label }` }
        />
    );
};

StatusChip.propTypes = {
    labels: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    value: PropTypes.string
};

const ReceiptStatuses = ({ receipt }) => (
    <div className="flex flex-wrap items-start gap-2">
        <StatusChip
            labels={ GOODS_RECEIPT_STATUS_LABELS }
            value={ receipt.status }
            type="Status penerimaan"
        />
        <StatusChip
            labels={ GOODS_RECEIPT_PAYMENT_STATUS_LABELS }
            value={ receipt.paymentStatus }
            type="Status pembayaran"
        />
    </div>
);

ReceiptStatuses.propTypes = {
    receipt: PropTypes.object.isRequired
};

const ReceiptValues = ({ receipt }) => (
    <div className="space-y-1 tabular-nums">
        <strong className="block whitespace-nowrap font-semibold">
            Sisa: { money(receipt.outstandingAmount) }
        </strong>
        <span className="block whitespace-nowrap text-sm text-gray-600">
            Total: { money(receipt.totalAmount) }
        </span>
        <span className="block whitespace-nowrap text-sm text-gray-600">
            Dibayar: { money(receipt.paidAmount) }
        </span>
    </div>
);

ReceiptValues.propTypes = {
    receipt: PropTypes.object.isRequired
};

const ReceiptDetailAction = ({ receipt, returnTo }) => (
    <Tooltip title="Lihat detail utang" arrow>
        <IconButton
            component={ Link }
            to={ `/goods-receipts/${ encodeURIComponent(receipt.code) }` }
            state={ { from: returnTo } }
            aria-label={ `Buka detail utang ${ receipt.code }` }
            sx={ {
                width: 44,
                height: 44
            } }
        >
            <Eye size={ 19 } aria-hidden="true" />
        </IconButton>
    </Tooltip>
);

ReceiptDetailAction.propTypes = {
    receipt: PropTypes.object.isRequired,
    returnTo: PropTypes.string.isRequired
};

export default function SupplierPayableList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const receipts = useGoodsReceiptStore(state => state.goodsReceiptList);
    const paging = useGoodsReceiptStore(state => state.goodsReceiptPaging);
    const listStatus = useGoodsReceiptStore(state => state.goodsReceiptListStatus);
    const listError = useGoodsReceiptStore(state => state.goodsReceiptListError);
    const getGoodsReceiptList = useGoodsReceiptStore(state => state.getGoodsReceiptList);
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [retryVersion, setRetryVersion] = useState(0);
    const queryState = readQueryState(searchParams);
    const [draft, setDraft] = useState({
        filterKey: queryState.filterKey,
        query: queryState.query
    });
    const totalElements = Number.isFinite(Number(paging.totalElements))
        ? Number(paging.totalElements)
        : receipts.length;
    const totalPages = Math.max(Number(paging.totalPages) || 0, 0);
    const pageOutOfRange = listStatus === 'ready'
        && totalPages > 0
        && queryState.page > totalPages;
    const returnTo = `${ location.pathname }${ location.search }`;
    const firstVisibleItem = receipts.length
        ? ((queryState.page - 1) * queryState.size) + 1
        : 0;
    const lastVisibleItem = receipts.length
        ? Math.min(firstVisibleItem + receipts.length - 1, totalElements)
        : 0;
    const hasAppliedFilter = Boolean(queryState.query);
    const hasDraftFilter = Boolean(draft.query || draft.filterKey !== 'code');

    const updateQuery = updates => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                next.set(key, String(value));
            } else {
                next.delete(key);
            }
        });
        setSearchParams(next);
    };

    const updateDraft = updates => {
        setDraft(current => ({
            ...current,
            ...updates
        }));
    };

    useEffect(() => setBreadcrumbs(['Utang Pemasok']), [setBreadcrumbs]);

    useEffect(() => {
        if (queryState.needsSanitization) {
            setSearchParams(queryState.canonicalSearch, { replace: true });
        }
    }, [queryState.canonicalSearch, queryState.needsSanitization, setSearchParams]);

    useEffect(() => {
        setDraft({ filterKey: queryState.filterKey, query: queryState.query });
    }, [queryState.filterKey, queryState.query]);

    useEffect(() => {
        if (queryState.needsSanitization) return undefined;
        const controller = new AbortController();
        const params = {
            page: queryState.page,
            size: queryState.size,
            ...(queryState.query ? { [queryState.filterKey]: queryState.query } : {})
        };

        getGoodsReceiptList(params, { signal: controller.signal }, { useLoader: false })
            .catch(() => {});
        return () => controller.abort();
    }, [getGoodsReceiptList, queryState.filterKey, queryState.needsSanitization,
        queryState.page, queryState.query, queryState.size, retryVersion]);

    useEffect(() => {
        if (!pageOutOfRange) return;
        setSearchParams(current => {
            const next = new URLSearchParams(current);
            next.set('page', String(totalPages));
            return next;
        }, { replace: true });
    }, [pageOutOfRange, setSearchParams, totalPages]);

    const applyFilter = event => {
        event.preventDefault();
        updateQuery({
            key: draft.filterKey,
            q: draft.query.trim(),
            page: 1
        });
    };

    const clearFilter = () => {
        setDraft({
            filterKey: 'code',
            query: ''
        });
        updateQuery({
            key: '',
            q: '',
            page: 1
        });
    };

    return (
        <div className="space-y-5 pb-8">
            <header>
                <h1 className="text-2xl font-bold">Utang pemasok</h1>
                <p className="mt-1 text-gray-600">
                    Temukan satu penerimaan dan periksa status serta nilai terbaru dari server.
                </p>
            </header>

            <form className="card space-y-3" aria-label="Filter utang pemasok" onSubmit={ applyFilter }>
                <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                        select
                        label="Cari berdasarkan"
                        value={ draft.filterKey }
                        onChange={ event => updateDraft({ filterKey: event.target.value }) }
                    >
                        { Object.entries(FILTER_KEYS).map(([value, label]) => (
                            <MenuItem key={ value } value={ value }>{ label }</MenuItem>
                        )) }
                    </TextField>
                    <TextField
                        label={ FILTER_KEYS[draft.filterKey] }
                        value={ draft.query }
                        placeholder={ FILTER_PLACEHOLDERS[draft.filterKey] }
                        onChange={ event => updateDraft({ query: event.target.value }) }
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="contained">Terapkan filter</Button>
                    <Button
                        type="button"
                        onClick={ clearFilter }
                        disabled={ !hasAppliedFilter && !hasDraftFilter }
                        startIcon={ <RotateCcw aria-hidden="true" /> }
                    >
                        Reset filter
                    </Button>
                </div>
            </form>

            <section
                className="overflow-hidden rounded-lg bg-white pb-2 shadow-lg"
                aria-labelledby="supplier-payable-list-heading"
            >
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 id="supplier-payable-list-heading" className="text-xl font-bold">
                            Penerimaan dan sisa utang
                        </h2>
                        { listStatus === 'ready' && !pageOutOfRange && (
                            <p className="mt-1 text-sm text-gray-600" aria-live="polite">
                                { receipts.length
                                    ? `${ firstVisibleItem }–${ lastVisibleItem } dari ${ totalElements } penerimaan · Terbaru lebih dulu`
                                    : '0 penerimaan' }
                            </p>
                        ) }
                    </div>
                    <div
                        className="flex flex-wrap items-center gap-2"
                        aria-label="Navigasi halaman utang pemasok"
                    >
                        <TextField
                            select
                            size="small"
                            label="Per halaman"
                            value={ queryState.size }
                            className="w-32"
                            onChange={ event => updateQuery({
                                size: event.target.value,
                                page: 1
                            }) }
                        >
                            { PAGE_SIZE_OPTIONS.map(value => (
                                <MenuItem key={ value } value={ value }>{ value }</MenuItem>
                            )) }
                        </TextField>
                        <Button
                            type="button"
                            size="small"
                            disabled={ listStatus === 'loading'
                                || queryState.page <= 1
                                || !totalPages }
                            onClick={ () => updateQuery({ page: queryState.page - 1 }) }
                        >
                            Sebelumnya
                        </Button>
                        <span className="min-w-24 text-center text-sm text-gray-600" aria-current="page">
                            Halaman { totalPages
                                ? Math.min(queryState.page, totalPages)
                                : 1 } dari { totalPages || 1 }
                        </span>
                        <Button
                            type="button"
                            size="small"
                            disabled={ listStatus === 'loading'
                                || !totalPages
                                || queryState.page >= totalPages }
                            onClick={ () => updateQuery({ page: queryState.page + 1 }) }
                        >
                            Berikutnya
                        </Button>
                    </div>
                </div>

                { listStatus === 'loading' || listStatus === 'idle' || pageOutOfRange ? (
                    <div className="py-12 text-center" role="status" aria-live="polite">
                        <CircularProgress size={ 22 } aria-hidden="true" />{ ' ' }
                        <span>
                            { pageOutOfRange
                                ? 'Menyesuaikan halaman utang...'
                                : 'Memuat utang pemasok...' }
                        </span>
                    </div>
                ) : listStatus === 'error' ? (
                    <div className="p-4">
                        <Alert
                            severity="error"
                            action={ (
                                <Button
                                    color="inherit"
                                    onClick={ () => setRetryVersion(value => value + 1) }
                                >
                                    Coba lagi
                                </Button>
                            ) }
                        >
                            <strong>Daftar utang pemasok gagal dimuat.</strong>{ ' ' }
                            { listError?.message || 'Periksa koneksi lalu coba lagi.' }{ ' ' }
                            Filter tetap dipertahankan.
                        </Alert>
                    </div>
                ) : receipts.length ? (
                    <TableContainer component="div" className="!overflow-x-hidden">
                        <Table
                            className="!block xl:!table xl:!table-fixed"
                            aria-label="Penerimaan dan utang pemasok"
                        >
                            <caption className="sr-only">
                                Pemasok, penerimaan, status, nilai resmi, dan tindakan detail.
                            </caption>
                            <TableHead className="hidden bg-gray-100 xl:!table-header-group">
                                <TableRow>
                                    <TableCell className="xl:!w-[24%]">Pemasok</TableCell>
                                    <TableCell className="xl:!w-[24%]">Penerimaan</TableCell>
                                    <TableCell className="xl:!w-[18%]">Status</TableCell>
                                    <TableCell className="xl:!w-[26%]">Nilai</TableCell>
                                    <TableCell className="xl:!w-[4rem]" align="right">
                                        <span className="sr-only">Detail</span>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody className="!block xl:!table-row-group">
                                { receipts.map((receipt, index) => {
                                    const isLastRow = index === receipts.length - 1;
                                    const rowBorderClass = isLastRow ? '' : 'border-b border-gray-200';
                                    const tableCellClass = isLastRow ? '!border-b-0' : '';

                                    return (
                                        <TableRow
                                            key={ receipt.code }
                                            className={ `!grid grid-cols-1 gap-x-5 gap-y-4 px-4 py-4 sm:grid-cols-2 xl:!table-row xl:p-0 ${ rowBorderClass } xl:border-b-0` }
                                        >
                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 sm:col-span-2 xl:!table-cell xl:!border-b xl:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                    Pemasok
                                                </span>
                                                <Button
                                                    component={ Link }
                                                    to={ `/suppliers/${ encodeURIComponent(receipt.supplierCode || '') }` }
                                                    state={ { from: returnTo } }
                                                    disabled={ !receipt.supplierCode }
                                                    className="!mt-1 !min-w-0 !justify-start !p-0 !normal-case xl:!mt-0"
                                                >
                                                    <span className="break-words text-left font-semibold">
                                                        { receipt.supplierName || '-' }
                                                    </span>
                                                </Button>
                                                <span className="mt-1 block break-all text-sm text-gray-600">
                                                    { receipt.supplierCode || '-' }
                                                </span>
                                            </TableCell>
                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                    Penerimaan
                                                </span>
                                                <strong className="mt-1 block break-all font-medium xl:mt-0">
                                                    { receipt.code }
                                                </strong>
                                                <span className="mt-1 block text-sm text-gray-600">
                                                    { formatDate(receipt.receivedDate) || 'Waktu tidak tersedia' }
                                                </span>
                                            </TableCell>
                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4` }>
                                                <span className="mb-1 block text-xs font-medium text-gray-600 xl:hidden">
                                                    Status
                                                </span>
                                                <ReceiptStatuses receipt={ receipt } />
                                            </TableCell>
                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                    Nilai
                                                </span>
                                                <div className="mt-1 xl:mt-0">
                                                    <ReceiptValues receipt={ receipt } />
                                                </div>
                                            </TableCell>
                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 sm:col-span-2 xl:!table-cell xl:!border-b xl:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                    Detail
                                                </span>
                                                <div className="mt-1 flex xl:mt-0 xl:justify-end">
                                                    <ReceiptDetailAction
                                                        receipt={ receipt }
                                                        returnTo={ returnTo }
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) }
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <div className="px-4 py-12 text-center" role="status">
                        <strong className="block">Tidak ada penerimaan yang cocok</strong>
                        <p className="mt-1 text-gray-600">
                            { hasAppliedFilter
                                ? 'Ubah atau reset filter untuk melihat penerimaan lain.'
                                : 'Utang akan tampil setelah penerimaan berhasil dibukukan.' }
                        </p>
                        { hasAppliedFilter && (
                            <Button className="mt-3" onClick={ clearFilter }>Reset filter</Button>
                        ) }
                    </div>
                ) }
            </section>
        </div>
    );
}
