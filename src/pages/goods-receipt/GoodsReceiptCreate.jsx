import { useState, useEffect } from 'react';

import { format } from 'date-fns';
import { enqueueSnackbar } from 'notistack';

import { useNavigate } from 'react-router-dom';

import {
    Autocomplete,
    Button,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    CircularProgress,
    Tooltip
} from '@mui/material';

import { Trash, Plus, Save, Edit2 } from 'lucide-react';

import { useBreadcrumbStore, useGoodsReceiptStore, useItemStore } from '@stores/index.js';

import { debounce } from '@utils/general-utils.js';

import BloomInputNumber from '@components/_ui/BloomInputNumber.jsx';

const GoodsReceiptCreate = () => {
    const navigate = useNavigate();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const createGoodsReceipt = useGoodsReceiptStore(state => state.createGoodsReceipt);
    const isSubmitting = useGoodsReceiptStore(state => state.isSubmitting);
    const getItemList = useItemStore(state => state.getItemList);

    const [receivedDate, setReceivedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [supplierName, setSupplierName] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState([
        { itemSku: null, itemName: '', currentStock: 0, quantity: 1, isLocked: false }
    ]);

    const [itemOptions, setItemOptions] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);

    useEffect(() => {
        setBreadcrumbs(['Penerimaan Barang', 'Buat Penerimaan']);
    }, [setBreadcrumbs]);

    const handleSearchItems = async (query) => {
        if (!query) return;
        setLoadingItems(true);
        try {
            const payload = {
                params: {
                    page: 1,
                    size: 20,
                    sku: query
                }
            };
            const response = await getItemList(payload);
            setItemOptions(response.data.content || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingItems(false);
        }
    };

    const debouncedSearch = value => {
        debounce(() => { handleSearchItems(value) }, 'searchItems', 500);
    }

    const handleAddItem = () => {
        setItems([...items, { itemSku: null, itemName: '', currentStock: 0, quantity: 1, isLocked: false }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSkuChange = (index, newValue) => {
        const newItems = [...items];
        if (newValue) {
            newItems[index].itemSku = newValue.sku;
            newItems[index].itemName = newValue.name;
            newItems[index].currentStock = newValue.stockQuantity || 0;
            newItems[index].isLocked = true;
        } else {
            newItems[index].itemSku = null;
            newItems[index].itemName = '';
            newItems[index].currentStock = 0;
            newItems[index].isLocked = false;
        }
        setItems(newItems);
    };

    const handleUnlockItem = (index) => {
        const newItems = [...items];
        newItems[index].isLocked = false;
        newItems[index].itemSku = null;
        newItems[index].itemName = '';
        newItems[index].currentStock = 0;
        setItems(newItems);
    };

    const validateForm = () => {
        if (!receivedDate) return "Tanggal penerimaan wajib diisi";
        if (items.length === 0) return "Min. 1 barang";

        const skus = new Set();
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.itemSku) return `Barang pada baris ${i + 1} wajib dipilih`;
            if (!item.isLocked) return `Barang pada baris ${i + 1} belum dipilih`;
            if (item.quantity < 1) return `Jumlah pada baris ${i + 1} harus >= 1`;
            if (skus.has(item.itemSku)) return `Duplikasi barang ${item.itemSku} tidak diperbolehkan`;
            skus.add(item.itemSku);
        }
        return null;
    };

    const handleSubmit = async () => {
        const error = validateForm();
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            return;
        }

        const payload = {
            receivedDate: new Date(receivedDate).toISOString(),
            supplierName,
            description,
            items: items.map(item => ({
                itemSku: item.itemSku,
                quantity: item.quantity
            }))
        };

        try {
            await createGoodsReceipt(payload);
            enqueueSnackbar("Penerimaan barang berhasil dibuat", { variant: 'success' });
            navigate('/goods-receipts');
        } catch (err) {
            enqueueSnackbar(err.message || "Gagal membuat penerimaan barang", { variant: 'error' });
        }
    };

    // Check if submit should be disabled (any unlocked item)
    const hasUnlockedItems = items.some(item => !item.isLocked);

    return (
        <div className="goods-receipt-create">
            <div className="flex justify-between items-center mb-6">
                <Typography variant="h5" className="font-bold">Buat Penerimaan Barang</Typography>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                { /* Header Form */ }
                <Paper className="p-4 space-y-4">
                    <TextField
                        label="Tanggal Penerimaan"
                        type="date"
                        fullWidth
                        value={ receivedDate }
                        onChange={ (e) => setReceivedDate(e.target.value) }
                        slotProps={ { inputLabel: { shrink: true } } }
                    />
                    <TextField
                        label="Supplier"
                        fullWidth
                        value={ supplierName }
                        onChange={ (e) => setSupplierName(e.target.value) }
                        placeholder="Nama Supplier"
                    />
                    <TextField
                        label="Keterangan"
                        fullWidth
                        multiline
                        rows={ 3 }
                        value={ description }
                        onChange={ (e) => setDescription(e.target.value) }
                        placeholder="Opsional"
                    />
                </Paper>

                { /* Instructions */ }
                <Paper className="p-4 bg-blue-50">
                    <Typography variant="subtitle2" className="font-bold text-blue-800 mb-2">Panduan</Typography>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                        <li>Pilih tanggal penerimaan yang sesuai.</li>
                        <li>Pastikan SKU barang sudah terdaftar di sistem.</li>
                        <li>Stok akan otomatis <strong>BERTAMBAH</strong> setelah disimpan.</li>
                        <li>Tidak bisa input barang yang sama dua kali dalam satu dokumen.</li>
                    </ul>
                </Paper>
            </div>

            { /* Items Table */ }
            <Paper className="mb-6 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <Typography variant="h6" className="font-bold">Barang</Typography>
                    <Button
                        startIcon={ <Plus /> }
                        onClick={ handleAddItem }
                        variant="outlined"
                        size="small"
                    >
                        Tambah Baris
                    </Button>
                </div>
                <TableContainer>
                    <Table>
                        <TableHead className="bg-gray-100">
                            <TableRow>
                                <TableCell width="40%">Item (SKU / Nama)</TableCell>
                                <TableCell width="20%">Stok Saat Ini</TableCell>
                                <TableCell width="20%" align="center">Qty Diterima</TableCell>
                                <TableCell width="10%" align="center">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            { items.map((row, index) => (
                                <TableRow key={ index }>
                                    <TableCell>
                                        { row.isLocked ? (
                                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                                                <div>
                                                    <div className="font-bold text-sm">{ row.itemSku }</div>
                                                    <div className="text-xs text-gray-600">{ row.itemName }</div>
                                                </div>
                                                <Tooltip title="Ganti Barang">
                                                    <IconButton size="small" onClick={ () => handleUnlockItem(index) }>
                                                        <Edit2 size={ 14 } className="text-blue-500" />
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        ) : (
                                            <Autocomplete
                                                freeSolo
                                                options={ itemOptions }
                                                getOptionLabel={ (option) => {
                                                    if (typeof option === 'string') return option;
                                                    return `${option.sku} - ${option.name}`;
                                                } }
                                                loading={ loadingItems }
                                                onInputChange={ (e, value) => {
                                                    debouncedSearch(value);
                                                } }
                                                onChange={ (e, value) => handleSkuChange(index, value) }
                                                renderInput={ (params) => (
                                                    <TextField
                                                        { ...params }
                                                        label="Cari SKU / Nama"
                                                        variant="outlined"
                                                        size="small"
                                                        slotProps={ {
                                                            input: {
                                                                ...params.InputProps,
                                                                endAdornment: (
                                                                    <>
                                                                        { loadingItems ? <CircularProgress color="inherit" size={ 20 } /> : null }
                                                                        { params.InputProps.endAdornment }
                                                                    </>
                                                                ),
                                                            },
                                                        } }
                                                    />
                                                ) }
                                            />
                                        ) }
                                    </TableCell>
                                    <TableCell className="text-gray-700 font-medium">
                                        { row.isLocked ? row.currentStock : '-' }
                                    </TableCell>
                                    <TableCell align="center">
                                        <BloomInputNumber
                                            value={ row.quantity }
                                            onChange={ (val) => handleItemChange(index, 'quantity', val) }
                                            min={ 1 }
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            color="error"
                                            onClick={ () => handleRemoveItem(index) }
                                            disabled={ items.length === 1 }
                                        >
                                            <Trash size={ 18 } />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            )) }
                            { items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={ 4 } align="center" className="py-8 text-gray-400">
                                        Klik "Tambah Baris" untuk memasukkan barang
                                    </TableCell>
                                </TableRow>
                            ) }
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <div className="flex justify-end gap-3">
                <Button
                    variant="outlined"
                    onClick={ () => navigate('/goods-receipts') }
                    disabled={ isSubmitting }
                >
                    Batal
                </Button>
                <Button
                    variant="contained"
                    onClick={ handleSubmit }
                    startIcon={ <Save /> }
                    disabled={ isSubmitting || hasUnlockedItems }
                >
                    { isSubmitting ? 'Menyimpan...' : 'Simpan Penerimaan' }
                </Button>
            </div>
        </div>
    );
};

export default GoodsReceiptCreate;
