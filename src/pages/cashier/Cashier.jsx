import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from '@mui/material';
import { ShoppingCartIcon } from 'lucide-react';

import { API_ERROR_CATEGORY } from '@api/index.js';
import itemApi from '@api/item.js';
import CurrentCashSession from '@components/cash-session/CurrentCashSession.jsx';
import CashierCart from '@components/cashier/CashierCart.jsx';
import { useBreadcrumbStore, useCashSessionStore } from '@stores/index.js';
import { createKeyboardWedgeScanner } from '@utils/keyboard-wedge-scanner.js';
import {
    formatQuantity,
    formatUnitOfMeasure,
    incrementQuantityByOne
} from '@utils/quantity-utils.js';

const formatPrice = value => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 4
}).format(Number(value || 0));

export default function Cashier() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const currentSession = useCashSessionStore(state => state.currentSession);
    const currentStatus = useCashSessionStore(state => state.currentStatus);
    const drawerActionsEnabled = useCashSessionStore(state => state.drawerActionsEnabled);

    const [searchValue, setSearchValue] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [searchStatus, setSearchStatus] = useState('idle');
    const [searchError, setSearchError] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [cartNotice, setCartNotice] = useState('');
    const [scannerFeedback, setScannerFeedback] = useState(null);

    const searchInputRef = useRef(null);
    const searchFeedbackRef = useRef(null);
    const requestRef = useRef(null);
    const sessionWasEnabledRef = useRef(false);
    const cartItemsRef = useRef([]);
    const hasVerifiedOpenSessionRef = useRef(false);
    const mountedRef = useRef(true);
    const scanItemRef = useRef(null);
    const scanQueueRef = useRef(Promise.resolve());

    const hasVerifiedOpenSession = currentStatus === 'ready'
        && currentSession?.status === 'OPEN'
        && drawerActionsEnabled;
    hasVerifiedOpenSessionRef.current = hasVerifiedOpenSession;
    const normalizedSearch = searchValue.trim();
    const hasStaleResults = Boolean(submittedQuery && normalizedSearch !== submittedQuery);

    useEffect(() => {
        mountedRef.current = true;
        setBreadcrumbs(['Cashier']);
        return () => {
            mountedRef.current = false;
            requestRef.current?.abort();
        };
    }, [setBreadcrumbs]);

    useEffect(() => {
        if (searchStatus === 'error') searchFeedbackRef.current?.focus();
    }, [searchStatus]);

    useEffect(() => {
        if (hasVerifiedOpenSession && !sessionWasEnabledRef.current) {
            searchInputRef.current?.focus();
        }
        sessionWasEnabledRef.current = hasVerifiedOpenSession;
    }, [hasVerifiedOpenSession]);

    const focusSearch = () => searchInputRef.current?.focus();

    const searchItems = async event => {
        event.preventDefault();
        if (!hasVerifiedOpenSession || !normalizedSearch) return;

        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        const query = normalizedSearch;

        setSubmittedQuery(query);
        setSearchStatus('loading');
        setSearchError('');

        try {
            const { data: response } = await itemApi.getItemList({
                signal: controller.signal,
                params: { page: 1, size: 10, skuOrName: query }
            });
            if (controller.signal.aborted || requestRef.current !== controller) return;

            setSearchResults(response.data?.content || []);
            setSearchStatus('ready');
        } catch (error) {
            if (controller.signal.aborted || requestRef.current !== controller) return;
            setSearchResults([]);
            setSearchError(error?.message || 'Pencarian barang gagal. Silakan coba lagi.');
            setSearchStatus('error');
        } finally {
            if (requestRef.current === controller) requestRef.current = null;
        }
    };

    const addItemToCart = item => {
        const duplicate = cartItemsRef.current.some(cartItem => cartItem.sku === item.sku);
        const nextItems = duplicate
            ? cartItemsRef.current.map(cartItem => cartItem.sku === item.sku
                ? { ...cartItem, quantity: incrementQuantityByOne(cartItem.quantity) }
                : cartItem)
            : [...cartItemsRef.current, { ...item, quantity: '1' }];
        cartItemsRef.current = nextItems;
        setCartItems(nextItems);
        setCartNotice(duplicate
            ? `${ item.name } sudah ada; jumlah ditambah 1 ${ formatUnitOfMeasure(item.baseUnitOfMeasure) }.`
            : `${ item.name } ditambahkan ke keranjang.`);
        focusSearch();
    };

    const updateQuantity = (quantity, sku) => {
        const nextItems = cartItemsRef.current.map(item => item.sku === sku
            ? { ...item, quantity }
            : item);
        cartItemsRef.current = nextItems;
        setCartItems(nextItems);
    };

    const removeItem = sku => {
        const item = cartItemsRef.current.find(cartItem => cartItem.sku === sku);
        const nextItems = cartItemsRef.current.filter(cartItem => cartItem.sku !== sku);
        cartItemsRef.current = nextItems;
        setCartItems(nextItems);
        setCartNotice(`${ item?.name || 'Barang' } dihapus dari keranjang.`);
        focusSearch();
    };

    const lookupScannedItem = async sku => {
        if (!hasVerifiedOpenSessionRef.current) return;

        setScannerFeedback({
            severity: 'info',
            message: `Membaca barcode ${ sku }...`
        });

        try {
            const { data: response } = await itemApi.getItemDetails(sku);
            if (!mountedRef.current || !hasVerifiedOpenSessionRef.current) return;

            const scannedItem = response.data;
            if (!scannedItem?.active) {
                setScannerFeedback({
                    severity: 'warning',
                    message: scannedItem
                        ? `${ scannedItem.name } ditemukan, tetapi barang tidak aktif dan tidak ditambahkan.`
                        : `Barcode ${ sku } tidak ditemukan.`
                });
                focusSearch();
                return;
            }

            setScannerFeedback(null);
            addItemToCart(scannedItem);
        } catch (error) {
            if (!mountedRef.current || !hasVerifiedOpenSessionRef.current) return;

            const notFound = error?.status === 404
                || error?.category === API_ERROR_CATEGORY.NOT_FOUND;
            setScannerFeedback({
                severity: notFound ? 'warning' : 'error',
                message: notFound
                    ? `Barcode ${ sku } tidak ditemukan.`
                    : `Barcode ${ sku } gagal diperiksa. Silakan pindai lagi atau gunakan pencarian manual.`
            });
            focusSearch();
        }
    };

    scanItemRef.current = lookupScannedItem;

    useEffect(() => {
        if (!hasVerifiedOpenSession) return undefined;

        const scanner = createKeyboardWedgeScanner({
            onScan: value => {
                scanQueueRef.current = scanQueueRef.current
                    .catch(() => undefined)
                    .then(() => scanItemRef.current?.(value));
            }
        });
        const handleKeyDown = event => scanner.handleKeyDown(event);
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            scanner.reset();
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [hasVerifiedOpenSession]);

    const sessionGateMessage = currentStatus === 'error'
        ? 'Pencarian dan keranjang dikunci sampai status sesi kas berhasil dimuat ulang.'
        : currentStatus !== 'ready'
            ? 'Pencarian dan keranjang menunggu verifikasi sesi kas.'
            : !hasVerifiedOpenSession
                ? 'Buka sesi kas untuk mulai mencari dan menyusun keranjang.'
                : '';

    return (
        <>
            <div className="mb-4">
                <CurrentCashSession />
            </div>

            { sessionGateMessage && (
                <Alert className="mb-4" severity="info">
                    { sessionGateMessage }
                </Alert>
            ) }

            <div className="cashier flex flex-col gap-4 xl:flex-row">
                <div className="cashier__content min-w-0 xl:basis-2/3">
                    <section className="cashier__content-filter card mb-4" aria-labelledby="cashier-search-title">
                        <h1 id="cashier-search-title" className="text-xl font-bold">Cari barang</h1>
                        <p className="mt-1 mb-4 text-sm text-gray-600">
                            Ketik SKU atau nama barang. Tekan Enter atau tombol Cari untuk menampilkan hasil.
                        </p>
                        <p className="mb-4 text-sm text-gray-600">
                            Pemindai barcode E81W siap saat sesi kas terbuka. Pindai menambah barang ke keranjang
                            dan tidak pernah menjalankan pembayaran.
                        </p>
                        { scannerFeedback && (
                            <Alert
                                className="mb-4"
                                severity={ scannerFeedback.severity }
                                role={ scannerFeedback.severity === 'error' ? 'alert' : 'status' }
                                aria-live={ scannerFeedback.severity === 'error' ? 'assertive' : 'polite' }
                            >
                                { scannerFeedback.message }
                            </Alert>
                        ) }
                        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={ searchItems }>
                            <TextField
                                className="cashier__content-filter-value flex-grow"
                                label="SKU atau nama barang"
                                size="small"
                                value={ searchValue }
                                inputRef={ searchInputRef }
                                autoFocus
                                disabled={ !hasVerifiedOpenSession }
                                onChange={ event => setSearchValue(event.target.value) }
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={ !hasVerifiedOpenSession
                                    || !normalizedSearch
                                    || (searchStatus === 'loading' && normalizedSearch === submittedQuery) }
                            >
                                Cari
                            </Button>
                        </form>
                    </section>

                    <section className="cashier-products card" aria-labelledby="cashier-results-title">
                        <h2 id="cashier-results-title" className="text-lg font-bold mb-3">Hasil pencarian</h2>

                        { cartNotice && (
                            <Alert className="mb-3" severity="success" role="status" aria-live="polite">
                                { cartNotice }
                            </Alert>
                        ) }

                        { hasStaleResults && searchStatus !== 'loading' && (
                            <Alert className="mb-3" severity="info" role="status">
                                Hasil ini untuk “{ submittedQuery }” dan tidak dapat ditambahkan. Cari lagi untuk “{ normalizedSearch }”.
                            </Alert>
                        ) }

                        { searchStatus === 'error' && (
                            <Alert
                                className="mb-3"
                                severity="error"
                                tabIndex={ -1 }
                                ref={ searchFeedbackRef }
                                action={ <Button color="inherit" size="small" onClick={ searchItems }>Coba lagi</Button> }
                            >
                                { searchError }
                            </Alert>
                        ) }

                        { searchStatus === 'idle' ? (
                            <div className="py-12 text-center text-gray-500">Masukkan kata pencarian untuk mulai.</div>
                        ) : searchStatus === 'loading' ? (
                            <div className="py-12 text-center" role="status" aria-live="polite">
                                <CircularProgress size={ 22 } aria-hidden="true" />
                                <span className="ml-2">Mencari barang...</span>
                            </div>
                        ) : searchStatus === 'ready' && !searchResults.length ? (
                            <div className="py-12 text-center text-gray-500">
                                Tidak ada barang aktif untuk “{ submittedQuery }”.
                            </div>
                        ) : searchResults.length ? (
                            <TableContainer component={ Paper } elevation={ 0 }>
                                <Table aria-label="Hasil pencarian barang">
                                    <TableHead className="bg-gray-100">
                                        <TableRow>
                                            <TableCell>Barang</TableCell>
                                            <TableCell>Harga satuan</TableCell>
                                            <TableCell>STORE (informasi)</TableCell>
                                            <TableCell align="right">Aksi</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        { searchResults.map(item => (
                                            <TableRow key={ item.sku }>
                                                <TableCell>
                                                    <div className="font-semibold">{ item.name }</div>
                                                    <div className="text-sm text-gray-600">
                                                        { item.sku } · { formatUnitOfMeasure(item.baseUnitOfMeasure) }
                                                    </div>
                                                </TableCell>
                                                <TableCell>{ formatPrice(item.price) }</TableCell>
                                                <TableCell>{ formatQuantity(item.stockStore, item.baseUnitOfMeasure) }</TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={ <ShoppingCartIcon aria-hidden="true" /> }
                                                        disabled={ !hasVerifiedOpenSession || hasStaleResults }
                                                        onClick={ () => addItemToCart(item) }
                                                        aria-label={ `Tambah ${ item.name } ke keranjang` }
                                                    >
                                                        Tambah
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) }
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <div className="py-12 text-center text-gray-500">
                                Hasil pencarian belum dapat ditampilkan.
                            </div>
                        ) }
                    </section>
                </div>

                <div className="cashier__cart xl:basis-1/3 xl:min-w-[20rem]">
                    <CashierCart
                        itemList={ cartItems }
                        disabled={ !hasVerifiedOpenSession }
                        onQuantityUpdate={ updateQuantity }
                        onRemove={ removeItem }
                        onEditComplete={ focusSearch }
                    />
                </div>
            </div>
        </>
    );
}
