import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, TextField } from '@mui/material';

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import GoodsReceiptInfoCard from '@components/goods-receipt/GoodsReceiptInfoCard.jsx';
import GoodsReceiptItemsTable from '@components/goods-receipt/GoodsReceiptItemsTable.jsx';
import {
    formatReceiptDraftDateTime,
    getReceiptInputEstimate,
    getReceiptLineInputEstimate,
    RECEIPT_OFFSETS,
    validateReceipt
} from '@components/goods-receipt/receipt-create.js';
import ReceiptLineEditor from '@components/goods-receipt/ReceiptLineEditor.jsx';
import ReceiptLookup from '@components/goods-receipt/ReceiptLookup.jsx';
import { useBreadcrumbStore } from '@stores/index.js';
import useGoodsReceiptCreateStore from '@stores/modules/goods-receipt-create.js';
import { GOODS_RECEIPT_LOCATION_LABELS } from '@utils/goods-receipt-utils.js';
import { formatUnitOfMeasure } from '@utils/quantity-utils.js';

const MESSAGES = {
    storageUnavailable: 'Penyimpanan pemulihan di tab ini tidak tersedia. Belum ada permintaan baru yang dikirim. Aktifkan penyimpanan browser, lalu coba kembali.',
    rejected: 'Penerimaan ditolak. Masukan tetap tersimpan. Periksa pemasok, aturan jumlah, harga dan lokasi; pilih ulang barang/pemasok bila datanya berubah.',
    conflict: 'Data berubah saat diproses. Masukan tetap tersimpan. Pilih ulang barang/pemasok untuk memuat data terbaru, lalu tinjau kembali.',
    authentication: 'Sesi berakhir. Masuk kembali untuk melanjutkan masukan yang tersimpan.',
    authorization: 'Anda tidak memiliki izin membuat penerimaan. Masukan tetap tersimpan.',
    uncertain: 'Hasil penyimpanan belum dapat dipastikan. Masukan dikunci. Coba kembali permintaan yang sama agar tidak membuat penerimaan ganda.',
    keyConflict: 'Identitas permintaan sudah dipakai untuk data berbeda. Masukan dikunci. Periksa riwayat dan minta bantuan sebelum membuat penerimaan lain.'
};

export default function GoodsReceiptCreate() {
    const {
        draft,
        attempt,
        pending,
        result,
        outcome,
        errors,
        updateDraft,
        submit,
        reset
    } = useGoodsReceiptCreateStore();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const [reviewing, setReviewing] = useState(false);
    const [localErrors, setLocalErrors] = useState({});
    const refs = useRef({});
    const noticeRef = useRef(null);
    const focusAfterEdit = useRef(null);
    const mergedErrors = {
        ...errors,
        ...localErrors
    };
    const locked = pending || !!attempt || !!result;
    const inputEstimate = getReceiptInputEstimate(draft.items);
    const noticeSeverity = result
        ? 'success'
        : ['rejected', 'conflict', 'authentication', 'authorization', 'keyConflict'].includes(outcome)
            ? 'error'
            : 'warning';

    useEffect(() => {
        setBreadcrumbs(['Penerimaan Barang', 'Buat Penerimaan']);
    }, [setBreadcrumbs]);

    useEffect(() => {
        if (!reviewing && (result || MESSAGES[outcome])) {
            const target = Object.keys(errors)[0];
            (refs.current[target] || noticeRef.current)?.focus();
        }
    }, [outcome, result, reviewing, errors]);

    useEffect(() => {
        if (focusAfterEdit.current) {
            refs.current[focusAfterEdit.current]?.focus();
            focusAfterEdit.current = null;
        }
    }, [draft.items]);

    const ref = name => element => {
        refs.current[name] = element;
    };
    const change = (name, value) => {
        setLocalErrors({});
        updateDraft({
            ...draft,
            [name]: value
        });
    };
    const review = event => {
        event.preventDefault();
        if (locked) return;

        const validation = validateReceipt(draft);
        setLocalErrors(validation);
        if (Object.keys(validation).length) {
            refs.current[Object.keys(validation)[0]]?.focus();

            return;
        }

        setReviewing(true);
    };
    const confirm = async () => {
        if (useGoodsReceiptCreateStore.getState().pending) return;

        await submit();
        setReviewing(false);
    };

    const input = (name, label, helperText) => ({
        name,
        label,
        value: draft[name],
        disabled: locked || reviewing,
        inputRef: ref(name),
        error: !!mergedErrors[name],
        helperText: mergedErrors[name] || helperText,
        onChange: event => change(name, event.target.value)
    });

    return (
        <div className="min-w-0 max-w-6xl space-y-4">
            <header>
                <h1 className="text-2xl font-bold">
                    { result ? 'Penerimaan berhasil dicatat' : 'Buat penerimaan barang' }
                </h1>
                <p className="text-sm text-gray-600">
                    { result
                        ? `${ result.code } · hasil resmi yang dikonfirmasi server.`
                        : 'Catat barang yang benar-benar diterima.' }
                </p>
            </header>

            { (result || MESSAGES[outcome]) && (
                <Alert
                    ref={ noticeRef }
                    tabIndex={ -1 }
                    role={ result ? 'status' : 'alert' }
                    severity={ noticeSeverity }
                >
                    { result
                        ? `Penerimaan ${ result.code } berhasil dikonfirmasi server.`
                        : MESSAGES[outcome] }
                </Alert>
            ) }

            { result ? (
                <>
                    <GoodsReceiptInfoCard receipt={ result } />
                    <GoodsReceiptItemsTable goodsReceiptItems={ result.items } />
                    <div className="flex flex-wrap gap-2">
                        <Button
                            component={ Link }
                            to={ `/goods-receipts/${ encodeURIComponent(result.code) }` }
                        >
                            Buka detail penerimaan
                        </Button>
                        <Button variant="contained" onClick={ reset }>
                            Buat penerimaan berikutnya
                        </Button>
                    </div>
                </>
            ) : (
                <Paper
                    component="form"
                    onSubmit={ review }
                    noValidate
                    className="min-w-0 space-y-6 overflow-hidden p-4 md:p-6"
                    aria-busy={ pending }
                >
                    <section className="min-w-0 space-y-4" aria-labelledby="receipt-information-title">
                        <div>
                            <h2 id="receipt-information-title" className="text-lg font-semibold">
                                Informasi penerimaan
                            </h2>
                            <p className="text-sm text-gray-600">
                                Penerimaan menambah stok dan mencatat tagihan. Pembayaran dilakukan terpisah.
                            </p>
                        </div>

                        <ReceiptLookup
                            kind="supplier"
                            value={ draft.supplier }
                            onChange={ value => change('supplier', value) }
                            disabled={ locked || reviewing }
                            error={ mergedErrors.supplier }
                            inputRef={ ref('supplier') }
                        />

                        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            <TextField
                                { ...input(
                                    'receivedDate',
                                    'Tanggal diterima',
                                    'Format DD-MM-YYYY, contoh 24-09-2026.'
                                ) }
                                placeholder="DD-MM-YYYY"
                                slotProps={ { htmlInput: { inputMode: 'numeric' } } }
                            />
                            <TextField
                                { ...input(
                                    'receivedTime',
                                    'Waktu 24 jam',
                                    'Format HH:mm, contoh 21:35.'
                                ) }
                                placeholder="HH:mm"
                                slotProps={ { htmlInput: { inputMode: 'numeric' } } }
                            />
                            <TextField
                                { ...input('offset', 'Zona waktu penerimaan') }
                                select
                                className="sm:col-span-2 xl:col-span-1"
                            >
                                { Object.entries(RECEIPT_OFFSETS).map(([value, label]) => (
                                    <MenuItem key={ value } value={ value }>{ label }</MenuItem>
                                )) }
                            </TextField>
                        </div>

                        <TextField
                            { ...input('description', 'Keterangan (opsional)') }
                            fullWidth
                            multiline
                            minRows={ 2 }
                        />
                    </section>

                    <section className="min-w-0 space-y-4" aria-labelledby="receipt-items-title">
                        <div>
                            <h2 id="receipt-items-title" className="text-lg font-semibold">
                                Barang diterima
                            </h2>
                            <p className="text-sm text-gray-600">
                                SKU yang sama boleh dicatat pada baris dan lokasi berbeda.
                            </p>
                        </div>

                        <ReceiptLookup
                            kind="item"
                            value={ null }
                            disabled={ locked || reviewing }
                            error={ mergedErrors.items }
                            inputRef={ ref('items') }
                            onChange={ item => {
                                if (!item) return;

                                focusAfterEdit.current = `items[${ draft.items.length }].quantity`;
                                change('items', [
                                    ...draft.items,
                                    {
                                        id: crypto.randomUUID(),
                                        item,
                                        quantity: '1',
                                        purchasePrice: '',
                                        stockLocation: ''
                                    }
                                ]);
                            } }
                        />
                        <p className="text-sm text-gray-600">
                            Tombol +/− mengubah tepat 1 satuan; pecahan dapat diketik pada barang yang mendukungnya.
                        </p>

                        { !draft.items.length && (
                            <p role="status">Belum ada barang. Cari barang untuk menambahkan baris.</p>
                        ) }

                        <div className="min-w-0">
                            { draft.items.map((line, index) => (
                                <ReceiptLineEditor
                                    key={ line.id }
                                    line={ line }
                                    index={ index }
                                    disabled={ locked || reviewing }
                                    errors={ mergedErrors }
                                    fieldRef={ name => ref(`items[${ index }].${ name }`) }
                                    onChange={ (name, value) => change(
                                        'items',
                                        draft.items.map(row => row.id === line.id
                                            ? {
                                                ...row,
                                                [name]: value
                                            }
                                            : row)
                                    ) }
                                    onRemove={ () => {
                                        focusAfterEdit.current = draft.items.length === 1
                                            ? 'items'
                                            : `items[${ Math.min(index, draft.items.length - 2) }].quantity`;
                                        change(
                                            'items',
                                            draft.items.filter(row => row.id !== line.id)
                                        );
                                    } }
                                />
                            )) }
                        </div>

                        <div className="border-t border-dashed pt-4" aria-live="polite">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <span>{ draft.items.length } baris input</span>
                                <strong className="tabular-nums">
                                    { inputEstimate === null
                                        ? 'Perkiraan belum tersedia'
                                        : formatRupiah(inputEstimate) }
                                </strong>
                            </div>
                            <p className="text-sm text-gray-600">
                                Perkiraan dari jumlah dan harga input untuk membandingkan nota. Total resmi hanya berasal dari hasil server setelah penerimaan dicatat.
                            </p>
                        </div>
                    </section>

                    { attempt && !pending && (
                        <section
                            className="min-w-0 space-y-3 rounded border border-amber-300 bg-amber-50 p-4"
                            aria-labelledby="receipt-recovery-title"
                        >
                            <h2 id="receipt-recovery-title" className="font-semibold">
                                Permintaan yang sama disimpan
                            </h2>
                            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-gray-600">Pemasok</dt>
                                    <dd className="break-all font-medium">{ draft.supplier?.code || '-' }</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-600">Diterima pada</dt>
                                    <dd className="font-medium">{ formatReceiptDraftDateTime(draft) }</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-600">Baris terkunci</dt>
                                    <dd className="font-medium">{ draft.items.length } baris</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-600">Perkiraan input</dt>
                                    <dd className="font-medium tabular-nums">
                                        { inputEstimate === null ? '-' : formatRupiah(inputEstimate) }
                                    </dd>
                                </div>
                            </dl>
                            <p className="text-sm text-gray-600">
                                Payload dan kunci idempotensi tetap terkunci; pemulihan tidak membuat permintaan baru.
                            </p>
                        </section>
                    ) }

                    <div className="flex flex-wrap gap-2">
                        <Button component={ Link } to="/goods-receipts" disabled={ pending }>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={ locked || reviewing }
                        >
                            Tinjau penerimaan
                        </Button>
                        { (outcome === 'uncertain'
                                || (attempt && outcome === 'storageUnavailable')) && (
                            <Button
                                type="button"
                                variant="contained"
                                disabled={ pending }
                                onClick={ () => setReviewing(true) }
                            >
                                Pulihkan permintaan yang sama
                            </Button>
                        ) }
                    </div>
                    { pending && (
                        <p role="status">
                            Satu permintaan sedang dicatat. Semua masukan dikunci sampai server memberi hasil.
                        </p>
                    ) }
                </Paper>
            ) }

            { reviewing && (
                <Dialog
                    open
                    fullWidth
                    maxWidth="md"
                    aria-labelledby="receipt-review-title"
                    aria-describedby="receipt-review-description"
                    disableEscapeKeyDown={ pending }
                    onClose={ pending ? undefined : () => setReviewing(false) }
                >
                    <DialogTitle id="receipt-review-title">Tinjau penerimaan</DialogTitle>
                    <DialogContent className="min-w-0 space-y-4">
                        <p id="receipt-review-description" className="text-sm text-gray-600">
                            Periksa waktu, lokasi, jumlah, dan harga sebelum stok ditambahkan.
                        </p>

                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-gray-600">Pemasok</dt>
                                <dd className="break-words font-medium">
                                    { draft.supplier.name } · { draft.supplier.code }
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-600">Diterima pada</dt>
                                <dd className="font-medium">{ formatReceiptDraftDateTime(draft) }</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-gray-600">Keterangan</dt>
                                <dd className="whitespace-pre-wrap break-words font-medium">
                                    { draft.description.trim() || '-' }
                                </dd>
                            </div>
                        </dl>

                        <ol className="min-w-0 divide-y">
                            { draft.items.map(line => (
                                <li
                                    key={ line.id }
                                    className="grid min-w-0 gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                                >
                                    <div className="min-w-0">
                                        <strong className="block break-words">
                                            { line.item.name } · { line.item.sku }
                                        </strong>
                                        <span className="text-sm text-gray-600">
                                            { GOODS_RECEIPT_LOCATION_LABELS[line.stockLocation] }
                                            { ` (${ line.stockLocation }) · ${ line.quantity.replace('.', ',') } ${ formatUnitOfMeasure(line.item.baseUnitOfMeasure) } × ${ formatRupiah(line.purchasePrice) }` }
                                        </span>
                                    </div>
                                    <strong className="tabular-nums sm:text-right">
                                        { formatRupiah(getReceiptLineInputEstimate(line)) }
                                    </strong>
                                </li>
                            )) }
                        </ol>

                        <div className="flex flex-wrap items-baseline justify-between gap-2 rounded bg-gray-100 p-3">
                            <span>Perkiraan dari input</span>
                            <strong className="tabular-nums">{ formatRupiah(inputEstimate) }</strong>
                        </div>
                        <Alert severity="info">
                            Stok, total, jumlah dibayar, sisa utang, dan status pembayaran berasal dari hasil yang disimpan server. Langkah ini tidak mencatat pembayaran awal.
                        </Alert>
                        { attempt && (
                            <p className="text-sm text-gray-600">
                                Pengiriman ulang memakai payload dan kunci yang sama untuk mencegah penerimaan ganda.
                            </p>
                        ) }
                        { pending && (
                            <p role="status">
                                Mencatat satu permintaan penerimaan. Jangan tutup atau kirim ulang sampai hasil tersedia.
                            </p>
                        ) }
                    </DialogContent>
                    <DialogActions>
                        <Button
                            autoFocus
                            disabled={ pending }
                            onClick={ () => setReviewing(false) }
                        >
                            Kembali
                        </Button>
                        <Button
                            variant="contained"
                            disabled={ pending }
                            aria-busy={ pending }
                            onClick={ confirm }
                        >
                            Catat penerimaan
                        </Button>
                    </DialogActions>
                </Dialog>
            ) }
        </div>
    );
}
