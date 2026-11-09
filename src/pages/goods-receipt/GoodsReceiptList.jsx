import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    MenuItem,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip
} from '@mui/material';
import {
    Eye,
    Plus,
    RotateCcw
} from 'lucide-react';
import PropTypes from 'prop-types';

import BloomDateRangePicker from '@components/_ui/BloomDateRangePicker.jsx';
import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { useBreadcrumbStore, useGoodsReceiptStore } from '@stores/index.js';
import { formatDate, isValidDateInput } from '@utils/date-utils.js';
import {
    getGoodsReceiptStatusColor,
    GOODS_RECEIPT_PAYMENT_STATUS_LABELS,
    GOODS_RECEIPT_STATUS_LABELS
} from '@utils/goods-receipt-utils.js';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const FILTER_KEYS = {
    code: 'Nomor penerimaan',
    supplierCode: 'Kode pemasok',
    supplierName: 'Nama pemasok'
};
const FILTER_PLACEHOLDERS = {
    code: 'Contoh: GR/IX-2026/0003',
    supplierCode: 'Contoh: SUP-BANGUN-01',
    supplierName: 'Contoh: CV Bangun Jaya'
};
const getQueryState = params => {
    const next = new URLSearchParams(params);
    const requestedPage = Number(params.get('page'));
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    if (params.has('page') && params.get('page') !== String(page)) {
        next.set('page', String(page));
    }

    const requestedSize = Number(params.get('size'));
    const size = PAGE_SIZE_OPTIONS.includes(requestedSize) ? requestedSize : 10;

    if (params.has('size') && params.get('size') !== String(size)) {
        next.set('size', String(size));
    }

    const requestedKey = params.get('key');
    const filterKey = Object.hasOwn(FILTER_KEYS, requestedKey) ? requestedKey : 'code';

    if (params.has('key') && requestedKey !== filterKey) {
        next.set('key', filterKey);
    }

    const startDate = isValidDateInput(params.get('receivedDateFrom'))
        ? params.get('receivedDateFrom')
        : '';
    const endDate = isValidDateInput(params.get('receivedDateTo'))
        ? params.get('receivedDateTo')
        : '';

    if (params.has('receivedDateFrom') && !startDate) {
        next.delete('receivedDateFrom');
    }
    if (params.has('receivedDateTo') && !endDate) {
        next.delete('receivedDateTo');
    }
    if (startDate && endDate && startDate > endDate) {
        next.delete('receivedDateFrom');
        next.delete('receivedDateTo');
    }

    const canonicalSearch = next.toString();

    return {
        page,
        size,
        filterKey,
        query: params.get('q') || '',
        startDate: startDate && (!endDate || startDate <= endDate) ? startDate : '',
        endDate: endDate && (!startDate || startDate <= endDate) ? endDate : '',
        canonicalSearch,
        needsSanitization: canonicalSearch !== params.toString()
    };
};

const money = value => value == null ? '-' : formatRupiah(value);

const StatusChip = ({ labels, value, type }) => (
    <Chip
        size="small"
        variant="outlined"
        color={ getGoodsReceiptStatusColor(value) }
        label={ labels[value] || value || '-' }
        aria-label={ `${ type}: ${ labels[value] || value || '-' }` }
    />
);

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
        <strong className="block font-semibold">Total: { money(receipt.totalAmount) }</strong>
        <span className="block text-sm text-gray-600">Dibayar: { money(receipt.paidAmount) }</span>
        <span className="block text-sm font-medium">Sisa: { money(receipt.outstandingAmount) }</span>
    </div>
);

ReceiptValues.propTypes = {
    receipt: PropTypes.object.isRequired
};

const ReceiptDetailAction = ({ receipt, returnTo }) => (
    <Tooltip title="Lihat detail" arrow>
        <IconButton
            component={ Link }
            to={ `/goods-receipts/${ encodeURIComponent(receipt.code) }` }
            state={ { from: returnTo } }
            aria-label={ `Buka detail ${ receipt.code }` }
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

export default function GoodsReceiptList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const receipts = useGoodsReceiptStore(state => state.goodsReceiptList);
    const paging = useGoodsReceiptStore(state => state.goodsReceiptPaging);
    const status = useGoodsReceiptStore(state => state.goodsReceiptListStatus);
    const error = useGoodsReceiptStore(state => state.goodsReceiptListError);
    const getGoodsReceiptList = useGoodsReceiptStore(state => state.getGoodsReceiptList);
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [retryVersion, setRetryVersion] = useState(0);
    const queryState = getQueryState(searchParams);
    const [draft, setDraft] = useState({
        filterKey: queryState.filterKey,
        query: queryState.query,
        startDate: queryState.startDate,
        endDate: queryState.endDate
    });
    const returnTo = `${ location.pathname }${ location.search }`;
    const totalElements = Number.isFinite(Number(paging.totalElements))
        ? Number(paging.totalElements)
        : receipts.length;
    const totalPages = Number.isFinite(Number(paging.totalPages))
        ? Number(paging.totalPages)
        : 0;
    const isPageOutOfRange = status === 'ready'
        && totalPages > 0
        && queryState.page > totalPages;
    const firstVisibleItem = receipts.length
        ? ((queryState.page - 1) * queryState.size) + 1
        : 0;
    const lastVisibleItem = receipts.length
        ? Math.min(firstVisibleItem + receipts.length - 1, totalElements)
        : 0;
    const hasAppliedFilters = Boolean(
        queryState.query
        || queryState.startDate
        || queryState.endDate
    );
    const hasDraftFilters = Boolean(
        draft.query
        || draft.startDate
        || draft.endDate
        || draft.filterKey !== 'code'
    );

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

    useEffect(() => {
        setBreadcrumbs(['Penerimaan Barang']);
    }, [setBreadcrumbs]);

    useEffect(() => {
        if (queryState.needsSanitization) {
            setSearchParams(queryState.canonicalSearch, { replace: true });
        }
    }, [queryState.canonicalSearch, queryState.needsSanitization, setSearchParams]);

    useEffect(() => {
        setDraft({
            filterKey: queryState.filterKey,
            query: queryState.query,
            startDate: queryState.startDate,
            endDate: queryState.endDate
        });
    }, [queryState.filterKey, queryState.query, queryState.startDate, queryState.endDate]);

    useEffect(() => {
        if (queryState.needsSanitization) return undefined;

        const controller = new AbortController();
        const params = {
            page: queryState.page,
            size: queryState.size,
            ...(queryState.query ? {
                [queryState.filterKey]: queryState.query
            } : {}),
            ...(queryState.startDate ? {
                receivedDateFrom: queryState.startDate
            } : {}),
            ...(queryState.endDate ? {
                receivedDateTo: queryState.endDate
            } : {})
        };

        getGoodsReceiptList(
            params,
            { signal: controller.signal },
            { useLoader: false }
        ).catch(() => {});

        return () => controller.abort();
    }, [getGoodsReceiptList, queryState.endDate, queryState.filterKey,
        queryState.needsSanitization, queryState.page, queryState.query,
        queryState.size, queryState.startDate, retryVersion]);

    useEffect(() => {
        if (!isPageOutOfRange) return;

        setSearchParams(current => {
            const next = new URLSearchParams(current);

            next.set('page', String(totalPages));

            return next;
        }, { replace: true });
    }, [isPageOutOfRange, setSearchParams, totalPages]);

    const applyFilters = event => {
        event.preventDefault();
        updateQuery({
            key: draft.filterKey,
            q: draft.query.trim(),
            receivedDateFrom: draft.startDate,
            receivedDateTo: draft.endDate,
            page: 1
        });
    };

    const clearFilters = () => {
        setDraft({
            filterKey: 'code',
            query: '',
            startDate: '',
            endDate: ''
        });
        updateQuery({
            key: '',
            q: '',
            receivedDateFrom: '',
            receivedDateTo: '',
            page: 1
        });
    };

    return (
        <div className="space-y-5 pb-8">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Penerimaan barang</h1>
                    <p className="mt-1 text-gray-600">
                        Telusuri penerimaan, barang yang datang, dan status pembayarannya.
                    </p>
                </div>
                <Button
                    component={ Link }
                    to="/goods-receipts/new"
                    variant="contained"
                    startIcon={ <Plus aria-hidden="true" /> }
                    className="self-start"
                >
                    Buat penerimaan
                </Button>
            </header>

            <form
                className="card space-y-3"
                aria-label="Filter riwayat penerimaan barang"
                onSubmit={ applyFilters }
            >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(10rem,0.7fr)_minmax(13rem,1fr)_minmax(18rem,1.25fr)]">
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
                    <BloomDateRangePicker
                        label="Rentang tanggal penerimaan"
                        startDate={ draft.startDate }
                        endDate={ draft.endDate }
                        onChange={ updateDraft }
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="contained">Terapkan filter</Button>
                    <Button
                        type="button"
                        onClick={ clearFilters }
                        disabled={ !hasAppliedFilters && !hasDraftFilters }
                        startIcon={ <RotateCcw aria-hidden="true" /> }
                    >
                        Reset filter
                    </Button>
                </div>
            </form>

            <section
                className="overflow-hidden rounded-lg bg-white pb-2 shadow-lg"
                aria-labelledby="goods-receipt-list-heading"
            >
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 id="goods-receipt-list-heading" className="text-xl font-bold">
                            Daftar penerimaan
                        </h2>
                        { status === 'ready' && !isPageOutOfRange && (
                            <p className="mt-1 text-sm text-gray-600" aria-live="polite">
                                { receipts.length
                                    ? `${ firstVisibleItem }–${ lastVisibleItem } dari ${ totalElements } penerimaan · Terbaru lebih dulu`
                                    : '0 penerimaan' }
                            </p>
                        ) }
                    </div>
                    <div
                        className="flex flex-wrap items-center gap-2"
                        aria-label="Navigasi halaman riwayat penerimaan barang"
                    >
                        <TextField
                            select
                            label="Per halaman"
                            size="small"
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
                        <span className="min-w-24 text-center text-sm text-gray-600" aria-current="page">
                            Halaman { totalPages
                                ? Math.min(queryState.page, totalPages)
                                : 1 } dari { totalPages || 1 }
                        </span>
                        <Pagination
                            page={ totalPages ? Math.min(queryState.page, totalPages) : 1 }
                            count={ totalPages || 1 }
                            onChange={ (_, value) => updateQuery({ page: value }) }
                            disabled={ status === 'loading' || !totalPages }
                            aria-label="Halaman penerimaan barang"
                            getItemAriaLabel={ (type, page) => type === 'page'
                                ? `Ke halaman ${ page }`
                                : `${ type } halaman` }
                        />
                    </div>
                </div>

                { error && (
                    <div className="px-4 pb-4 pt-4">
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
                            <strong>Riwayat penerimaan gagal dimuat.</strong>{ ' ' }
                            { error.message || 'Periksa koneksi lalu coba lagi.' }{ ' ' }
                            Filter tetap dipertahankan.
                        </Alert>
                    </div>
                ) }

                { status === 'loading' || status === 'idle' || isPageOutOfRange ? (
                    <div className="py-12 text-center" role="status" aria-live="polite">
                        <CircularProgress size={ 22 } aria-hidden="true" />{ ' ' }
                        <span>
                            { isPageOutOfRange
                                ? 'Menyesuaikan halaman penerimaan...'
                                : 'Memuat penerimaan barang...' }
                        </span>
                    </div>
                ) : status === 'error' ? (
                    <div className="px-4 py-12 text-center text-gray-600">
                        Riwayat penerimaan belum dapat ditampilkan.
                    </div>
                ) : receipts.length ? (
                    <TableContainer component="div" className="!overflow-x-hidden">
                        <Table
                            className="!block xl:!table xl:!table-fixed"
                            aria-label="Riwayat penerimaan barang"
                        >
                            <caption className="sr-only">
                                Penerimaan, pemasok, status, nilai, waktu, dan tindakan detail.
                            </caption>
                            <TableHead className="hidden bg-gray-100 xl:!table-header-group">
                                <TableRow>
                                    <TableCell className="xl:!w-[20%]">Penerimaan</TableCell>
                                    <TableCell className="xl:!w-[20%]">Pemasok</TableCell>
                                    <TableCell className="xl:!w-[18%]">Status</TableCell>
                                    <TableCell className="xl:!w-[19%]">Nilai</TableCell>
                                    <TableCell className="xl:!w-[18%]">Diterima &amp; dibuat</TableCell>
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
                                                    Penerimaan
                                                </span>
                                                <strong className="mt-1 block break-all font-semibold xl:mt-0">
                                                    { receipt.code || '-' }
                                                </strong>
                                                <span className="mt-1 block text-sm text-gray-600">
                                                    { GOODS_RECEIPT_STATUS_LABELS[receipt.status]
                                                        || receipt.status
                                                        || '-' }
                                                </span>
                                            </TableCell>

                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                    Pemasok
                                                </span>
                                                <strong className="mt-1 block break-words font-medium xl:mt-0">
                                                    { receipt.supplierName || '-' }
                                                </strong>
                                                <span className="mt-1 block break-all text-sm text-gray-600">
                                                    ID #{ receipt.supplierId ?? '-' } · { receipt.supplierCode || '-' }
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

                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 xl:!table-cell xl:!border-b xl:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                    Diterima &amp; dibuat
                                                </span>
                                                <span className="mt-1 block xl:mt-0">
                                                    { formatDate(receipt.receivedDate) || '-' }
                                                </span>
                                                <span className="mt-1 block text-sm text-gray-600">
                                                    { receipt.createdBy || 'SYSTEM' } · { formatDate(receipt.createdAt) || '-' }
                                                </span>
                                            </TableCell>

                                            <TableCell className={ `${ tableCellClass } !block !border-b-0 !p-0 sm:col-span-2 xl:!table-cell xl:!border-b xl:!p-4` }>
                                                <span className="block text-xs font-medium text-gray-600 xl:hidden">
                                                    Detail
                                                </span>
                                                <div className="mt-1 flex xl:mt-0 xl:justify-end">
                                                    <ReceiptDetailAction receipt={ receipt } returnTo={ returnTo } />
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
                        <h3 className="font-semibold">Tidak ada penerimaan barang</h3>
                        <p className="mt-1 text-gray-600">
                            { hasAppliedFilters
                                ? 'Tidak ada penerimaan yang cocok. Ubah atau reset filter untuk melihat catatan lain.'
                                : 'Riwayat akan tampil setelah penerimaan berhasil dibukukan.' }
                        </p>
                        { hasAppliedFilters && (
                            <Button className="mt-3" onClick={ clearFilters }>
                                Reset filter
                            </Button>
                        ) }
                    </div>
                ) }
            </section>
        </div>
    );
}
