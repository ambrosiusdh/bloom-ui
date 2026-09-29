import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    CircularProgress,
    InputAdornment,
    TextField
} from '@mui/material';
import {
    PackageSearchIcon,
    SearchIcon,
    ShoppingCartIcon
} from 'lucide-react';

import { API_ERROR_CATEGORY } from '@api/index.js';
import itemApi from '@api/item.js';
import BloomConfirmationModal from '@components/_ui/BloomConfirmationModal.jsx';
import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import CashierCart from '@components/cashier/CashierCart.jsx';
import CashierCheckout from '@components/cashier/CashierCheckout.jsx';
import {
    useBreadcrumbStore,
    useCashSessionStore,
    useItemCategoryStore
} from '@stores/index.js';
import { createKeyboardWedgeScanner } from '@utils/keyboard-wedge-scanner.js';
import {
    formatQuantity,
    formatUnitOfMeasure,
    incrementQuantityByOne
} from '@utils/quantity-utils.js';

export default function Cashier() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const currentSession = useCashSessionStore(state => state.currentSession);
    const currentStatus = useCashSessionStore(state => state.currentStatus);
    const drawerActionsEnabled = useCashSessionStore(state => state.drawerActionsEnabled);
    const getItemCategoryList = useItemCategoryStore(state => state.getItemCategoryList);

    const [searchValue, setSearchValue] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [submittedCategory, setSubmittedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [categoryStatus, setCategoryStatus] = useState('loading');
    const [categoryError, setCategoryError] = useState('');
    const [searchStatus, setSearchStatus] = useState('idle');
    const [searchError, setSearchError] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [cartNotice, setCartNotice] = useState('');
    const [removedCartItem, setRemovedCartItem] = useState(null);
    const [scannerFeedback, setScannerFeedback] = useState(null);
    const [checkoutLocked, setCheckoutLocked] = useState(false);
    const [invalidQuantitySkus, setInvalidQuantitySkus] = useState(() => new Set());
    const [cancelConfirmationOpen, setCancelConfirmationOpen] = useState(false);
    const [checkoutDraftKey, setCheckoutDraftKey] = useState(0);

    const searchInputRef = useRef(null);
    const searchFeedbackRef = useRef(null);
    const requestRef = useRef(null);
    const interactionWasEnabledRef = useRef(false);
    const preserveCheckoutFeedbackFocusRef = useRef(false);
    const checkoutWasLockedRef = useRef(false);
    const cartItemsRef = useRef([]);
    const cashierInteractionEnabledRef = useRef(false);
    const mountedRef = useRef(true);
    const scanItemRef = useRef(null);
    const scanQueueRef = useRef(Promise.resolve());

    const hasVerifiedOpenSession = currentStatus === 'ready'
        && currentSession?.status === 'OPEN'
        && drawerActionsEnabled;
    const cashierInteractionEnabled = hasVerifiedOpenSession && !checkoutLocked;
    cashierInteractionEnabledRef.current = cashierInteractionEnabled;
    const normalizedSearch = searchValue.trim();
    const hasStaleResults = searchStatus === 'ready'
        && (normalizedSearch !== submittedQuery || selectedCategory !== submittedCategory);

    useEffect(() => {
        mountedRef.current = true;
        setBreadcrumbs(['Cashier']);
        return () => {
            mountedRef.current = false;
            requestRef.current?.abort();
        };
    }, [setBreadcrumbs]);

    const loadCategories = useCallback(async signal => {
        setCategoryStatus('loading');
        setCategoryError('');

        try {
            const response = await getItemCategoryList({
                signal,
                params: {
                    page: 1,
                    size: 100
                }
            });
            if (signal?.aborted || !mountedRef.current) return;

            setCategories(response?.data?.content || []);
            setCategoryStatus('ready');
        } catch (error) {
            if (signal?.aborted || !mountedRef.current) return;

            setCategoryError(error?.message || 'Kategori barang gagal dimuat.');
            setCategoryStatus('error');
        }
    }, [getItemCategoryList]);

    useEffect(() => {
        const controller = new AbortController();
        loadCategories(controller.signal);

        return () => controller.abort();
    }, [loadCategories]);

    useEffect(() => {
        if (searchStatus === 'error') searchFeedbackRef.current?.focus();
    }, [searchStatus]);

    useEffect(() => {
        if (cashierInteractionEnabled && !interactionWasEnabledRef.current) {
            if (preserveCheckoutFeedbackFocusRef.current) {
                preserveCheckoutFeedbackFocusRef.current = false;
            } else {
                searchInputRef.current?.focus();
            }
        }
        interactionWasEnabledRef.current = cashierInteractionEnabled;
    }, [cashierInteractionEnabled]);

    const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);

    const searchCatalog = async (query, categoryCode) => {
        if (!cashierInteractionEnabledRef.current) return;

        if (!query && !categoryCode) {
            requestRef.current?.abort();
            requestRef.current = null;
            setSubmittedQuery('');
            setSubmittedCategory('');
            setSearchResults([]);
            setSearchStatus('idle');
            return;
        }

        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;

        setSubmittedQuery(query);
        setSubmittedCategory(categoryCode);
        setSearchStatus('loading');
        setSearchError('');
        setCartNotice('');

        try {
            const { data: response } = await itemApi.getItemList({
                signal: controller.signal,
                params: {
                    page: 1,
                    size: 10,
                    ...(query ? { skuOrName: query } : {}),
                    ...(categoryCode ? { category: categoryCode } : {})
                }
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

    const searchItems = event => {
        event.preventDefault();
        searchCatalog(normalizedSearch, selectedCategory);
    };

    const selectCategory = categoryCode => {
        setSelectedCategory(categoryCode);
        setCartNotice('');
        searchCatalog(normalizedSearch, categoryCode);
    };

    const addItemToCart = item => {
        if (!cashierInteractionEnabledRef.current) return;
        setRemovedCartItem(null);
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
        if (!cashierInteractionEnabledRef.current) return;
        const nextItems = cartItemsRef.current.map(item => item.sku === sku
            ? { ...item, quantity }
            : item);
        cartItemsRef.current = nextItems;
        setCartItems(nextItems);
    };

    const removeItem = sku => {
        if (!cashierInteractionEnabledRef.current) return;
        const item = cartItemsRef.current.find(cartItem => cartItem.sku === sku);
        const itemIndex = cartItemsRef.current.findIndex(cartItem => cartItem.sku === sku);
        const nextItems = cartItemsRef.current.filter(cartItem => cartItem.sku !== sku);
        cartItemsRef.current = nextItems;
        setCartItems(nextItems);
        setInvalidQuantitySkus(previous => {
            const next = new Set(previous);
            next.delete(sku);
            return next;
        });
        setRemovedCartItem(item ? { item, index: itemIndex } : null);
        setCartNotice(`${ item?.name || 'Barang' } dihapus dari keranjang.`);
        focusSearch();
    };

    const undoRemoveItem = () => {
        if (!removedCartItem || checkoutLocked) return;

        if (cartItemsRef.current.some(item => item.sku === removedCartItem.item.sku)) {
            setRemovedCartItem(null);
            setCartNotice(`${ removedCartItem.item.name } sudah ada di keranjang.`);
            return;
        }

        const nextItems = [...cartItemsRef.current];
        nextItems.splice(removedCartItem.index, 0, removedCartItem.item);
        cartItemsRef.current = nextItems;
        setCartItems(nextItems);
        setRemovedCartItem(null);
        setCartNotice(`${ removedCartItem.item.name } dikembalikan ke keranjang.`);
    };

    const lookupScannedItem = async sku => {
        if (!cashierInteractionEnabledRef.current) return;

        setCartNotice('');
        setScannerFeedback({
            severity: 'info',
            message: `Membaca barcode ${ sku }...`
        });

        try {
            const { data: response } = await itemApi.getItemDetails(sku);
            if (!mountedRef.current || !cashierInteractionEnabledRef.current) return;

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
            if (!mountedRef.current || !cashierInteractionEnabledRef.current) return;

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
        if (!cashierInteractionEnabled) return undefined;

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
    }, [cashierInteractionEnabled]);

    const updateQuantityValidity = useCallback((sku, isValid) => {
        setInvalidQuantitySkus(previous => {
            const next = new Set(previous);
            if (isValid) next.delete(sku);
            else next.add(sku);
            return next;
        });
    }, []);

    const updateCheckoutLock = useCallback(locked => {
        if (!locked && checkoutWasLockedRef.current) {
            preserveCheckoutFeedbackFocusRef.current = true;
        }

        checkoutWasLockedRef.current = locked;
        setCheckoutLocked(locked);
    }, []);

    const completeSale = useCallback(sale => {
        if (sale) {
            preserveCheckoutFeedbackFocusRef.current = true;
            cartItemsRef.current = [];
            setCartItems([]);
            setRemovedCartItem(null);
            setInvalidQuantitySkus(new Set());
            setCartNotice(`Penjualan ${ sale.code } dikonfirmasi server.`);
            return;
        }

        focusSearch();
    }, [focusSearch]);

    const confirmCancelTransaction = () => {
        cartItemsRef.current = [];
        setCartItems([]);
        setRemovedCartItem(null);
        setInvalidQuantitySkus(new Set());
        setCancelConfirmationOpen(false);
        setCheckoutDraftKey(previous => previous + 1);
        setCartNotice('Transaksi dibatalkan. Keranjang dan persiapan pembayaran dikosongkan.');
        requestAnimationFrame(() => focusSearch());
    };

    const sessionGateMessage = currentStatus === 'error'
        ? 'Pencarian dan keranjang dikunci sampai status sesi kas berhasil dimuat ulang.'
        : currentStatus !== 'ready'
            ? 'Pencarian dan keranjang menunggu verifikasi sesi kas.'
            : !hasVerifiedOpenSession
                ? 'Buka sesi kas untuk mulai mencari dan menyusun keranjang.'
                : '';

    return (
        <>
            { sessionGateMessage && (
                <Alert className="cashier-session-gate" severity="info">
                    { sessionGateMessage }
                </Alert>
            ) }

            <div className="cashier cashier-workspace">
                <div className="cashier__content cashier-catalog min-w-0">
                    <section className="cashier__content-filter" aria-labelledby="cashier-search-title">
                        <h1 id="cashier-search-title" className="sr-only">Pilih barang</h1>

                        <div className="cashier-catalog__categories" aria-labelledby="cashier-category-filter-label">
                            <div id="cashier-category-filter-label" className="sr-only">
                                Kategori barang
                            </div>
                            { categoryStatus === 'loading' ? (
                                <div className="text-sm text-gray-500" role="status">
                                    Memuat kategori...
                                </div>
                            ) : categoryStatus === 'error' ? (
                                <Alert
                                    className="mt-2"
                                    severity="warning"
                                    action={ (
                                        <Button color="inherit" size="small" onClick={ () => loadCategories() }>
                                            Coba lagi
                                        </Button>
                                    ) }
                                >
                                    { categoryError }
                                </Alert>
                            ) : (
                                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori barang">
                                    <Button
                                        type="button"
                                        size="small"
                                        className="cashier-category-chip"
                                        variant={ selectedCategory ? 'outlined' : 'contained' }
                                        aria-pressed={ !selectedCategory }
                                        disabled={ !cashierInteractionEnabled }
                                        onClick={ () => selectCategory('') }
                                    >
                                        Semua
                                    </Button>
                                    { categories.map(category => (
                                        <Button
                                            type="button"
                                            size="small"
                                            className="cashier-category-chip"
                                            key={ category.code }
                                            variant={ selectedCategory === category.code ? 'contained' : 'outlined' }
                                            aria-pressed={ selectedCategory === category.code }
                                            disabled={ !cashierInteractionEnabled }
                                            onClick={ () => selectCategory(category.code) }
                                        >
                                            { category.name }
                                        </Button>
                                    )) }
                                </div>
                            ) }
                        </div>

                        <form className="cashier-catalog__search" onSubmit={ searchItems }>
                            <TextField
                                className="cashier__content-filter-value"
                                placeholder="Cari Triplek, BB-00001, atau pindai barcode..."
                                size="small"
                                value={ searchValue }
                                inputRef={ searchInputRef }
                                autoFocus
                                disabled={ !cashierInteractionEnabled }
                                slotProps={ {
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon size={ 18 } aria-hidden="true" />
                                            </InputAdornment>
                                        )
                                    },
                                    htmlInput: {
                                        'aria-label': 'SKU atau nama barang',
                                        'aria-describedby': 'cashier-scanner-guidance'
                                    }
                                } }
                                onChange={ event => setSearchValue(event.target.value) }
                            />
                            <Button
                                type="submit"
                                variant="outlined"
                                aria-label="Cari"
                                disabled={ !cashierInteractionEnabled
                                    || (!normalizedSearch && !selectedCategory)
                                    || (searchStatus === 'loading'
                                        && normalizedSearch === submittedQuery
                                        && selectedCategory === submittedCategory) }
                            >
                                Enter
                            </Button>
                        </form>

                        <p id="cashier-scanner-guidance" className="sr-only">
                            Pemindai barcode keyboard dapat langsung digunakan saat sesi kas terbuka.
                        </p>

                        { scannerFeedback && (
                            <Alert
                                severity={ scannerFeedback.severity }
                                role={ scannerFeedback.severity === 'error' ? 'alert' : 'status' }
                                aria-live={ scannerFeedback.severity === 'error' ? 'assertive' : 'polite' }
                            >
                                { scannerFeedback.message }
                            </Alert>
                        ) }

                        <a
                            className="cashier-catalog__transaction-link mt-4 inline-flex min-h-11 items-center gap-2 rounded border border-blue-700 px-3 text-sm font-semibold text-blue-700 xl:hidden"
                            href="#cashier-transaction"
                        >
                            <ShoppingCartIcon size={ 18 } aria-hidden="true" />
                            Buka transaksi ({ cartItems.length })
                        </a>
                    </section>

                    <section className="cashier-products" aria-labelledby="cashier-results-title">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h2 id="cashier-results-title" className="text-lg font-bold">Barang tersedia</h2>
                            { searchStatus === 'ready' && (
                                <span className="text-sm text-gray-500">{ searchResults.length } hasil</span>
                            ) }
                        </div>

                        { hasStaleResults && searchStatus !== 'loading' && (
                            <Alert className="mb-3" severity="info" role="status">
                                Hasil ini untuk pencarian sebelumnya dan tidak dapat ditambahkan.
                                Jalankan pencarian lagi untuk memakai kata atau kategori terbaru.
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
                            <div className="flex flex-col items-center gap-3 py-12 text-center text-gray-500">
                                <PackageSearchIcon size={ 44 } aria-hidden="true" />
                                <span>Masukkan nama atau SKU, atau pilih kategori untuk mulai.</span>
                            </div>
                        ) : searchStatus === 'loading' ? (
                            <div className="py-12 text-center" role="status" aria-live="polite">
                                <CircularProgress size={ 22 } aria-hidden="true" />
                                <span className="ml-2">Mencari barang...</span>
                            </div>
                        ) : searchStatus === 'ready' && !searchResults.length ? (
                            <div className="py-12 text-center text-gray-500">
                                { submittedQuery
                                    ? `Tidak ada barang aktif untuk “${ submittedQuery }”.`
                                    : 'Tidak ada barang aktif dalam kategori ini.' }
                            </div>
                        ) : searchResults.length ? (
                            <div className="cashier-products__list" role="list" aria-label="Hasil pencarian barang">
                                { searchResults.map(item => {
                                    const stockRequiresCheck = Number(item.stockStore) <= 0;

                                    return (
                                        <article
                                            className="cashier-products__row"
                                            key={ item.sku }
                                            role="listitem"
                                        >
                                            <div className="cashier-products__identity">
                                                <span className="cashier-products__category">
                                                    { item.category?.name || 'Tanpa kategori' }
                                                </span>
                                                <strong>{ item.name }</strong>
                                                <small>
                                                    SKU { item.sku } · { formatUnitOfMeasure(item.baseUnitOfMeasure) }
                                                </small>
                                            </div>
                                            <div className={ `cashier-products__stock ${ stockRequiresCheck ? 'cashier-products__stock--warning' : '' }` }>
                                                <strong>{ formatQuantity(item.stockStore, item.baseUnitOfMeasure) }</strong>
                                                <small>{ ' tersedia di STORE' }</small>
                                            </div>
                                            <div className="cashier-products__price">
                                                <strong>{ formatRupiah(item.price) }</strong>
                                                <small>{ ` per ${ formatUnitOfMeasure(item.baseUnitOfMeasure) }` }</small>
                                            </div>
                                            <Button
                                                size="small"
                                                variant={ stockRequiresCheck ? 'outlined' : 'contained' }
                                                color={ stockRequiresCheck ? 'warning' : 'primary' }
                                                startIcon={ <ShoppingCartIcon aria-hidden="true" /> }
                                                disabled={ !cashierInteractionEnabled || hasStaleResults }
                                                onClick={ () => addItemToCart(item) }
                                                aria-label={ `Tambah ${ item.name } ke keranjang` }
                                            >
                                                <span className="cashier-products__action-label">
                                                    { stockRequiresCheck ? 'Tambah & periksa' : 'Tambah' }
                                                </span>
                                            </Button>
                                        </article>
                                    );
                                }) }
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-500">
                                Hasil pencarian belum dapat ditampilkan.
                            </div>
                        ) }
                    </section>
                </div>

                <aside
                    id="cashier-transaction"
                    className="cashier__cart cashier-transaction min-w-0 scroll-mt-4"
                    aria-label="Transaksi saat ini"
                >
                    { cartNotice && (
                        <Alert
                            className="mb-3"
                            severity={ cartItems.length ? 'success' : 'info' }
                            role="status"
                            aria-live="polite"
                            action={ removedCartItem ? (
                                <Button color="inherit" size="small" onClick={ undoRemoveItem }>
                                    Urungkan
                                </Button>
                            ) : undefined }
                        >
                            { cartNotice }
                        </Alert>
                    ) }
                    <CashierCart
                        itemList={ cartItems }
                        disabled={ !cashierInteractionEnabled }
                        onQuantityUpdate={ updateQuantity }
                        onQuantityValidityChange={ updateQuantityValidity }
                        onRemove={ removeItem }
                        onEditComplete={ focusSearch }
                        onCancel={ () => setCancelConfirmationOpen(true) }
                    />
                    <CashierCheckout
                        key={ checkoutDraftKey }
                        itemList={ cartItems }
                        disabled={ !hasVerifiedOpenSession || invalidQuantitySkus.size > 0 }
                        disabledMessage={ invalidQuantitySkus.size > 0
                            ? 'Perbaiki jumlah barang yang belum valid sebelum checkout.'
                            : '' }
                        onLockChange={ updateCheckoutLock }
                        onSaleCompleted={ completeSale }
                    />
                </aside>
            </div>

            { cancelConfirmationOpen && (
                <BloomConfirmationModal
                    title="Batalkan transaksi?"
                    confirmButtonText="Ya, batalkan"
                    confirmButtonColor="error"
                    onCancel={ () => setCancelConfirmationOpen(false) }
                    onConfirm={ confirmCancelTransaction }
                    focusCancel
                >
                    <p>
                        { cartItems.length } jenis barang dan seluruh persiapan pembayaran akan dikosongkan.
                        Tindakan ini belum mengubah stok atau membuat penjualan.
                    </p>
                </BloomConfirmationModal>
            ) }
        </>
    );
}
