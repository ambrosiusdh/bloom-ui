import { useState, useEffect } from 'react';

import { enqueueSnackbar } from 'notistack';

import { useNavigate } from 'react-router-dom';

import {
    Autocomplete,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    MenuItem,
    Paper,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Alert,
    Tooltip
} from '@mui/material';

import { Trash, Plus, Save, Upload, AlertTriangle, Download, Edit2 } from 'lucide-react';

import { useBreadcrumbStore, useStockAdjustmentStore, useItemStore } from '@stores/index.js';

import { debounce } from '@utils/general-utils.js';

import BloomInputNumber from '@components/_ui/BloomInputNumber.jsx';

const ACTION_TYPES = [
    { value: 'ADD', label: 'Tambah Stok (+)', color: 'success.main' },
    { value: 'REMOVE', label: 'Kurangi Stok (-)', color: 'error.main' },
    { value: 'CORRECTION', label: 'Koreksi Stok (=)', color: 'warning.main' }
];

const StockAdjustmentCreate = () => {
    const navigate = useNavigate();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);

    const createStockAdjustment = useStockAdjustmentStore(state => state.createStockAdjustment);
    const uploadCsv = useStockAdjustmentStore(state => state.uploadCsv);
    const downloadTemplate = useStockAdjustmentStore(state => state.downloadTemplate);
    const clearParsedItems = useStockAdjustmentStore(state => state.clearParsedItems);
    const parsedItems = useStockAdjustmentStore(state => state.parsedItems);
    const isSubmitting = useStockAdjustmentStore(state => state.isSubmitting);

    const getItemList = useItemStore(state => state.getItemList);

    const [tabValue, setTabValue] = useState(0);
    const [reason, setReason] = useState('');
    const [items, setItems] = useState([
        { itemSku: null, itemName: '', currentStock: 0, actionType: 'ADD', changeQuantity: 1, isLocked: false }
    ]);

    const [itemOptions, setItemOptions] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [hasCorrection, setHasCorrection] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        setBreadcrumbs(['Penyesuaian Stok', 'Buat Penyesuaian']);
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
        debounce(() => { handleSearchItems(value)  }, 'searchItems', 500);
    }

    const handleAddItem = () => {
        setItems([...items, { itemSku: null, itemName: '', currentStock: 0, actionType: 'ADD', changeQuantity: 1, isLocked: false }]);
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
            // Reset if cleared (though usually handled by isLocked logic)
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

    const handleDownloadTemplate = async () => {
        setIsDownloading(true);
        try {
            await downloadTemplate();
            enqueueSnackbar("Template berhasil didownload", { variant: 'success' });
        } catch (error) {
            enqueueSnackbar(error.message || "Gagal download template", { variant: 'error' });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await uploadCsv(file, { useLoader: true });
            // parsedItems is updated in store
        } catch (error) {
            enqueueSnackbar(error.message || "Gagal mengupload CSV", { variant: 'error' });
        }
    };

    const validateForm = (targetItems) => {
        if (!reason) return "Alasan penyesuaian wajib diisi";
        if (targetItems.length === 0) return "Min. 1 barang";

        const skus = new Set();
        let correctionFound = false;

        for (let i = 0; i < targetItems.length; i++) {
            const item = targetItems[i];
            if (!item.itemSku) return `Barang pada baris ${i + 1} wajib dipilih`;
            // Check if manual items are locked
            if (tabValue === 0 && !item.isLocked) return `Barang pada baris ${i + 1} belum dipilih`;

            if (item.actionType === 'ADD' || item.actionType === 'REMOVE') {
                if (item.changeQuantity <= 0) return `Jumlah pada baris ${i + 1} harus > 0 untuk ADD/REMOVE`;
            } else if (item.actionType === 'CORRECTION') {
                if (item.changeQuantity < 0) return `Jumlah pada baris ${i + 1} tidak boleh negatif`;
                correctionFound = true;
            }

            if (skus.has(item.itemSku)) return `Duplikasi barang ${item.itemSku} tidak diperbolehkan`;
            skus.add(item.itemSku);
        }

        setHasCorrection(correctionFound);
        return null;
    };

    const handlePreSubmit = () => {
        const targetItems = tabValue === 0 ? items : parsedItems;
        const error = validateForm(targetItems);
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            return;
        }
        setConfirmDialogOpen(true);
    };

    const handleFinalSubmit = async () => {
        setConfirmDialogOpen(false);
        const targetItems = tabValue === 0 ? items : parsedItems;

        const payload = {
            reason,
            items: targetItems.map(item => ({
                itemSku: item.itemSku,
                actionType: item.actionType,
                changeQuantity: item.changeQuantity
            }))
        };

        try {
            await createStockAdjustment(payload);
            enqueueSnackbar("Penyesuaian stok berhasil dibuat", { variant: 'success' });
            navigate('/stock-adjustments');
        } catch (err) {
            enqueueSnackbar(err.message || "Gagal membuat penyesuaian stok", { variant: 'error' });
        }
    };

    // Check if submit should be disabled (any unlocked item)
    const hasUnlockedItems = tabValue === 0 && items.some(item => !item.isLocked);

    return (
        <div className="stock-adjustment-create">
            <div className="flex justify-between items-center mb-4">
                <Typography variant="h5" className="font-bold">Buat Penyesuaian Stok</Typography>
            </div>

            <Card className="mb-6">
                <CardContent>
                    <TextField
                        label="Alasan Penyesuaian"
                        fullWidth
                        multiline
                        rows={ 2 }
                        value={ reason }
                        onChange={ (e) => setReason(e.target.value) }
                        placeholder="Contoh: Selisih stok fisik opname Desember"
                        required
                    />
                </CardContent>
            </Card>

            <Paper className="mb-6">
                <Tabs value={ tabValue } onChange={ (e, v) => setTabValue(v) } className="border-b">
                    <Tab label="Input Manual" />
                    <Tab label="Upload CSV" />
                </Tabs>

                { tabValue === 0 && (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <Typography variant="h6" className="font-bold">Daftar Barang</Typography>
                            <Button
                                startIcon={ <Plus /> }
                                onClick={ handleAddItem }
                                variant="outlined"
                                size="small"
                            >
                                Tambah Baris
                            </Button>
                        </div>

                        <TableContainer component={ Paper } elevation={ 0 } className="border">
                            <Table size="small">
                                <TableHead className="bg-gray-100">
                                    <TableRow>
                                        <TableCell width="35%">Item (SKU / Nama)</TableCell>
                                        <TableCell width="15%" align="center">Stok Saat Ini</TableCell>
                                        <TableCell width="20%">Tindakan</TableCell>
                                        <TableCell width="15%" align="center">Qty</TableCell>
                                        <TableCell width="15%" align="center">Aksi</TableCell>
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
                                                                placeholder="Cari SKU"
                                                                variant="standard"
                                                                size="small"
                                                                slotProps={ {
                                                                    input: {
                                                                        ...params.InputProps,
                                                                        disableUnderline: true,
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
                                            <TableCell align="center" className="text-gray-700 font-medium">
                                                { row.isLocked ? row.currentStock : '-' }
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    select
                                                    value={ row.actionType }
                                                    onChange={ (e) => handleItemChange(index, 'actionType', e.target.value) }
                                                    variant="standard"
                                                    fullWidth
                                                    slotProps={ { input: { disableUnderline: true } } }
                                                >
                                                    { ACTION_TYPES.map(option => (
                                                        <MenuItem key={ option.value } value={ option.value }>
                                                            <Typography variant="body2" color={ option.color || 'textPrimary' }>
                                                                { option.label }
                                                            </Typography>
                                                        </MenuItem>
                                                    )) }
                                                </TextField>
                                            </TableCell>
                                            <TableCell align="center">
                                                <BloomInputNumber
                                                    value={ row.changeQuantity }
                                                    onChange={ (val) => handleItemChange(index, 'changeQuantity', val) }
                                                    min={ 0 }
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    color="error"
                                                    onClick={ () => handleRemoveItem(index) }
                                                    disabled={ items.length === 1 }
                                                >
                                                    <Trash size={ 16 } />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    )) }
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                ) }

                { tabValue === 1 && (
                    <div className="p-6">
                        <div className="flex justify-end mb-4">
                            <Button
                                startIcon={ <Download /> }
                                onClick={ handleDownloadTemplate }
                                disabled={ isDownloading }
                                variant="outlined"
                                color="primary"
                            >
                                { isDownloading ? 'Downloading...' : 'Download Template' }
                            </Button>
                        </div>

                        { !parsedItems.length && (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center bg-gray-50">
                                <Upload size={ 48 } className="text-gray-400 mb-4" />
                                <Typography variant="h6" className="mb-2">Upload File CSV</Typography>
                                <Typography variant="body2" className="text-gray-500 mb-6">
                                    Gunakan template yang disediakan untuk hasil terbaik.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                >
                                    Pilih File
                                    <input
                                        type="file"
                                        hidden
                                        accept=".csv"
                                        onChange={ handleFileUpload }
                                    />
                                </Button>
                            </div>
                        ) }

                        { parsedItems.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <Alert severity="info" className="mb-2">
                                    Berhasil membaca { parsedItems.length } baris data. Silakan review sebelum simpan.
                                    <Button size="small" onClick={ clearParsedItems } className="ml-4">Reset</Button>
                                </Alert>
                                <TableContainer component={ Paper } elevation={ 0 } className="border max-h-[500px]">
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>SKU</TableCell>
                                                <TableCell>Tindakan</TableCell>
                                                <TableCell align="right">Qty</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            { parsedItems.map((item, idx) => (
                                                <TableRow key={ idx }>
                                                    <TableCell>{ item.itemSku }</TableCell>
                                                    <TableCell>{ item.actionType }</TableCell>
                                                    <TableCell align="right">{ item.changeQuantity }</TableCell>
                                                </TableRow>
                                            )) }
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </div>
                        ) }
                    </div>
                ) }
            </Paper>

            <div className="flex justify-end gap-3">
                <Button
                    variant="outlined"
                    onClick={ () => navigate('/stock-adjustments') }
                    disabled={ isSubmitting }
                >
                    Batal
                </Button>
                <Button
                    variant="contained"
                    onClick={ handlePreSubmit }
                    startIcon={ <Save /> }
                    disabled={ isSubmitting || (tabValue === 1 && parsedItems.length === 0) || hasUnlockedItems }
                    color={ hasCorrection ? "warning" : "primary" }
                >
                    Simpan Penyesuaian
                </Button>
            </div>

            { /* Confirmation Dialog */ }
            <Dialog open={ confirmDialogOpen } onClose={ () => setConfirmDialogOpen(false) }>
                <DialogTitle className="flex items-center gap-2">
                    { hasCorrection && <AlertTriangle className="text-orange-500" /> }
                    Konfirmasi Penyesuaian
                </DialogTitle>
                <DialogContent>
                    <DialogContentText className="space-y-2">
                        Apakah Anda yakin ingin menyimpan penyesuaian stok ini?
                        { hasCorrection && (
                            <Alert severity="warning" className="mt-2">
                                <strong>PERHATIAN:</strong> Terdapat tindakan <strong>CORRECTION</strong> yang akan
                                menimpa stok saat ini dengan nilai baru. Pastikan data sudah benar.
                            </Alert>
                        ) }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={ () => setConfirmDialogOpen(false) }>Batal</Button>
                    <Button onClick={ handleFinalSubmit } variant="contained" color={ hasCorrection ? "warning" : "primary" } autoFocus>
                        Ya, Simpan
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default StockAdjustmentCreate;
