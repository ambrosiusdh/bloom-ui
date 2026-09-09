import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
    Alert, Button, Chip, CircularProgress, MenuItem, Pagination, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField
} from '@mui/material';
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
    const totalPages = Number(paging.totalPages) || 0;
    const pageOutOfRange = listStatus === 'ready'
        && totalPages > 0
        && queryState.page > totalPages;
    const returnTo = `${ location.pathname }${ location.search }`;

    const updateQuery = updates => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => value
            ? next.set(key, String(value))
            : next.delete(key));
        setSearchParams(next);
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
        setDraft({ filterKey: 'code', query: '' });
        updateQuery({ key: '', q: '', page: 1 });
    };

    return (
        <div className="space-y-4">
            <header>
                <h2 className="font-bold text-2xl">Utang Pemasok</h2>
                <p className="mt-1 text-gray-600">
                    Nominal dan status di bawah ini dihitung oleh server dari penerimaan dan pembayaran yang sah.
                </p>
            </header>

            <Alert severity="info">
                Daftar mencakup semua status pembayaran. Periksa label “Belum dibayar”, “Dibayar sebagian”, atau “Lunas” pada setiap penerimaan.
            </Alert>

            { listError && (
                <Alert
                    severity="error"
                    action={ (
                        <Button color="inherit" onClick={ () => setRetryVersion(value => value + 1) }>
                            Coba lagi
                        </Button>
                    ) }
                >
                    { listError.message || 'Daftar utang pemasok gagal dimuat.' }
                </Alert>
            ) }

            <form className="card space-y-3" aria-label="Filter utang pemasok" onSubmit={ applyFilter }>
                <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                        select
                        label="Cari berdasarkan"
                        value={ draft.filterKey }
                        onChange={ event => setDraft(value => ({ ...value, filterKey: event.target.value })) }
                    >
                        { Object.entries(FILTER_KEYS).map(([value, label]) => (
                            <MenuItem key={ value } value={ value }>{ label }</MenuItem>
                        )) }
                    </TextField>
                    <TextField
                        label={ FILTER_KEYS[draft.filterKey] }
                        value={ draft.query }
                        onChange={ event => setDraft(value => ({ ...value, query: event.target.value })) }
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="contained">Terapkan filter</Button>
                    <Button
                        type="button"
                        onClick={ clearFilter }
                        disabled={ !queryState.query && !draft.query && draft.filterKey === 'code' }
                    >
                        Hapus filter
                    </Button>
                </div>
            </form>

            <section className="rounded-lg bg-white shadow-lg pb-2" aria-label="Daftar utang pemasok">
                <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-xl font-bold">Penerimaan dan sisa utang</h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm">Data per halaman:</span>
                        <TextField
                            select
                            size="small"
                            value={ queryState.size }
                            className="w-20"
                            aria-label="Data utang per halaman"
                            onChange={ event => updateQuery({ size: event.target.value, page: 1 }) }
                        >
                            { PAGE_SIZE_OPTIONS.map(value => (
                                <MenuItem key={ value } value={ value }>{ value }</MenuItem>
                            )) }
                        </TextField>
                        <Pagination
                            page={ totalPages ? Math.min(queryState.page, totalPages) : queryState.page }
                            count={ totalPages || 1 }
                            disabled={ listStatus === 'loading' || !paging.totalPages }
                            onChange={ (_, value) => updateQuery({ page: value }) }
                            aria-label="Halaman utang pemasok"
                        />
                    </div>
                </div>

                { listStatus === 'loading' || listStatus === 'idle' || pageOutOfRange ? (
                    <div className="py-12 text-center" role="status" aria-live="polite">
                        <CircularProgress size={ 22 } aria-hidden="true" /> <span>
                            { pageOutOfRange ? 'Menyesuaikan halaman utang...' : 'Memuat utang pemasok...' }
                        </span>
                    </div>
                ) : listStatus === 'error' ? (
                    <div className="py-12 text-center text-gray-600">Daftar utang belum dapat ditampilkan.</div>
                ) : receipts.length ? (
                    <TableContainer component={ Paper } elevation={ 0 }>
                        <Table sx={ { minWidth: 1050 } } aria-label="Penerimaan dan utang pemasok">
                            <TableHead className="bg-gray-100">
                                <TableRow>
                                    <TableCell>Pemasok</TableCell>
                                    <TableCell>Penerimaan</TableCell>
                                    <TableCell>Status server</TableCell>
                                    <TableCell align="right">Nominal server</TableCell>
                                    <TableCell>Tanggal diterima</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                { receipts.map(receipt => (
                                    <TableRow key={ receipt.code } hover>
                                        <TableCell>
                                            <Button
                                                component={ Link }
                                                to={ `/suppliers/${ encodeURIComponent(receipt.supplierCode || '') }` }
                                                state={ { from: returnTo } }
                                                disabled={ !receipt.supplierCode }
                                                className="normal-case"
                                            >
                                                { receipt.supplierName || '-' }
                                            </Button>
                                            <div className="text-sm text-gray-600 break-all">{ receipt.supplierCode || '-' }</div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                component={ Link }
                                                to={ `/goods-receipts/${ encodeURIComponent(receipt.code) }` }
                                                state={ { from: returnTo } }
                                                className="normal-case break-all"
                                            >
                                                { receipt.code }
                                            </Button>
                                            <div className="text-sm text-gray-600">{ receipt.createdBy || 'SYSTEM' }</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-start gap-1">
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
                                        </TableCell>
                                        <TableCell align="right" className="tabular-nums">
                                            <div>Total: { money(receipt.totalAmount) }</div>
                                            <div className="text-sm text-gray-600">Dibayar: { money(receipt.paidAmount) }</div>
                                            <div className="font-medium">Sisa: { money(receipt.outstandingAmount) }</div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            { formatDate(receipt.receivedDate) || '-' }
                                        </TableCell>
                                    </TableRow>
                                )) }
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <div className="py-12 px-4 text-center">
                        <div className="font-semibold">Belum ada penerimaan pemasok</div>
                        <p className="mt-1 text-gray-600">
                            { queryState.query
                                ? 'Ubah atau hapus filter untuk melihat penerimaan lain.'
                                : 'Utang akan tampil setelah penerimaan berhasil dibukukan.' }
                        </p>
                    </div>
                ) }
            </section>
        </div>
    );
}
