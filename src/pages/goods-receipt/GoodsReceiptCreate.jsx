import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, TextField } from '@mui/material';

import GoodsReceiptInfoCard from '@components/goods-receipt/GoodsReceiptInfoCard.jsx';
import GoodsReceiptItemsTable from '@components/goods-receipt/GoodsReceiptItemsTable.jsx';
import { RECEIPT_OFFSETS, validateReceipt } from '@components/goods-receipt/receipt-create.js';
import ReceiptLineEditor from '@components/goods-receipt/ReceiptLineEditor.jsx';
import ReceiptLookup from '@components/goods-receipt/ReceiptLookup.jsx';
import { useBreadcrumbStore } from '@stores/index.js';
import useGoodsReceiptCreateStore from '@stores/modules/goods-receipt-create.js';
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
    const { draft, attempt, pending, result, outcome, errors, updateDraft, submit, reset } = useGoodsReceiptCreateStore();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const [reviewing, setReviewing] = useState(false);
    const [localErrors, setLocalErrors] = useState({});
    const refs = useRef({});
    const noticeRef = useRef(null);
    const focusAfterEdit = useRef(null);
    const mergedErrors = { ...errors, ...localErrors };
    const locked = pending || !!attempt || !!result;
    useEffect(() => setBreadcrumbs(['Penerimaan Barang', 'Buat Penerimaan']), [setBreadcrumbs]);
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
    const ref = name => element => { refs.current[name] = element; };
    const change = (name, value) => { setLocalErrors({}); updateDraft({ ...draft, [name]: value }); };
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
    const input = (name, label) => ({
        name, label, value: draft[name], disabled: locked || reviewing, inputRef: ref(name),
        error: !!mergedErrors[name], helperText: mergedErrors[name],
        onChange: event => change(name, event.target.value)
    });

    return (
        <div className="max-w-6xl space-y-4">
            <h2 className="text-2xl font-bold">Buat Penerimaan Barang</h2>
            { (result || MESSAGES[outcome]) && <Alert ref={ noticeRef }
                tabIndex={ -1 }
                role={ result ? 'status' : 'alert' }
                severity={ result ? 'success' : 'warning' }>
                { result ? `Penerimaan ${ result.code } berhasil dikonfirmasi server.` : MESSAGES[outcome] }
            </Alert> }
            { result ? <>
                <GoodsReceiptInfoCard receipt={ result } />
                <GoodsReceiptItemsTable goodsReceiptItems={ result.items } />
                <Button onClick={ reset }>Buat penerimaan berikutnya</Button>
            </> : <Paper component="form" onSubmit={ review } noValidate className="space-y-5 p-4 md:p-6" aria-busy={ pending }>
                <p>Pilih pemasok dan barang terdaftar. Setelah dikonfirmasi, stok dan tagihan penerimaan dicatat bersama. Pembayaran dicatat terpisah.</p>
                <ReceiptLookup kind="supplier"
                    value={ draft.supplier }
                    onChange={ value => change('supplier', value) }
                    disabled={ locked || reviewing }
                    error={ mergedErrors.supplier }
                    inputRef={ ref('supplier') } />
                { draft.supplier && <p className="text-sm">Pemasok terpilih: [{ draft.supplier.code }] { draft.supplier.name }</p> }
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextField { ...input('receivedTime', 'Tanggal dan waktu penerimaan') } type="datetime-local" slotProps={ { inputLabel: { shrink: true } } } />
                    <TextField { ...input('offset', 'Zona waktu penerimaan') } select>
                        { Object.entries(RECEIPT_OFFSETS).map(([value, label]) => <MenuItem key={ value } value={ value }>{ label }</MenuItem>) }
                    </TextField>
                </div>
                <TextField { ...input('description', 'Keterangan (opsional)') } fullWidth multiline minRows={ 2 } />
                <ReceiptLookup kind="item"
                    value={ null }
                    disabled={ locked || reviewing }
                    error={ mergedErrors.items }
                    inputRef={ ref('items') }
                    onChange={ item => {
                        if (!item) return;
                        focusAfterEdit.current = `items[${ draft.items.length }].quantity`;
                        change('items', [...draft.items, { id: crypto.randomUUID(), item, quantity: '1', purchasePrice: '', stockLocation: '' }]);
                    } } />
                <p className="text-sm text-gray-600">Barang yang sama boleh muncul di beberapa baris; setiap baris tetap dicatat terpisah. Tombol +/− mengubah tepat 1 satuan; pecahan dapat diketik.</p>
                { !draft.items.length && <p role="status">Belum ada barang. Cari barang untuk menambahkan baris.</p> }
                { draft.items.map((line, index) => <ReceiptLineEditor key={ line.id }
                    line={ line }
                    index={ index }
                    disabled={ locked || reviewing }
                    errors={ mergedErrors }
                    fieldRef={ name => ref(`items[${ index }].${ name }`) }
                    onChange={ (name, value) => change('items', draft.items.map(row => row.id === line.id ? { ...row, [name]: value } : row)) }
                    onRemove={ () => {
                        focusAfterEdit.current = draft.items.length === 1 ? 'items' : `items[${ Math.min(index, draft.items.length - 2) }].quantity`;
                        change('items', draft.items.filter(row => row.id !== line.id));
                    } } />) }
                <Button type="submit" variant="contained" disabled={ locked || reviewing }>Tinjau penerimaan</Button>
                { pending && <p role="status">Menyimpan penerimaan. Tunggu konfirmasi server...</p> }
                { (outcome === 'uncertain' || (attempt && outcome === 'storageUnavailable')) && <Button type="button" variant="contained" disabled={ pending } onClick={ () => setReviewing(true) }>Coba kembali permintaan yang sama</Button> }
            </Paper> }
            <Button component={ Link } to="/goods-receipts" disabled={ pending }>Riwayat penerimaan</Button>
            { reviewing && <Dialog open
                fullWidth
                maxWidth="md"
                aria-labelledby="receipt-review-title"
                disableEscapeKeyDown={ pending }
                onClose={ pending ? undefined : () => setReviewing(false) }>
                <DialogTitle id="receipt-review-title">Konfirmasi penerimaan barang</DialogTitle>
                <DialogContent className="space-y-3">
                    <p>Pemasok: [{ draft.supplier.code }] { draft.supplier.name }</p>
                    <p>Diterima: { draft.receivedTime.replace('T', ' ') } · { RECEIPT_OFFSETS[draft.offset] }</p>
                    { draft.description && <p className="whitespace-pre-wrap break-words">{ draft.description }</p> }
                    <ol className="list-decimal pl-6 space-y-2">
                        { draft.items.map(line => <li key={ line.id } className="break-words">[{ line.item.sku }] { line.item.name }: { line.quantity } { formatUnitOfMeasure(line.item.baseUnitOfMeasure) } · Rp { line.purchasePrice } per satuan · { line.stockLocation }</li>) }
                    </ol>
                    <p>Semua baris menambah stok di lokasi masing-masing. Total dan sisa tagihan ditentukan server. Penerimaan ini tidak mencatat pembayaran awal.</p>
                    { attempt && <p>Pengiriman memakai permintaan yang sama untuk mencegah penerimaan ganda.</p> }
                    { pending && <p role="status">Menyimpan penerimaan...</p> }
                </DialogContent>
                <DialogActions>
                    <Button autoFocus disabled={ pending } onClick={ () => setReviewing(false) }>Kembali</Button>
                    <Button variant="contained" disabled={ pending } aria-busy={ pending } onClick={ confirm }>Simpan penerimaan</Button>
                </DialogActions>
            </Dialog> }
        </div>
    );
}
