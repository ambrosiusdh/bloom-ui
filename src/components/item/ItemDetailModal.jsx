import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Alert,
    Button,
    CircularProgress
} from "@mui/material";
import { XIcon } from "lucide-react";
import PropTypes from "prop-types";

import { formatDate } from "@utils/date-utils.js";
import { formatQuantity, formatUnitOfMeasure } from "@utils/quantity-utils.js";


const propTypes = {
    onClose: PropTypes.func.isRequired,
    itemData: PropTypes.object,
    isLoading: PropTypes.bool,
    error: PropTypes.string,
    onRetry: PropTypes.func
}

export default function ItemDetailModal(props) {
    const {
        onClose,
        itemData,
        isLoading = false,
        error = '',
        onRetry
    } = props;

    return (
        <Dialog
            className="item-detail"
            open
            onClose={ onClose }
            fullWidth
            aria-labelledby="item-detail-title"
        >
            <DialogTitle id="item-detail-title" className="item-detail__header flex justify-between items-center">
                <div className="item-detail__header-title font-bold">{ itemData?.sku || 'Detail barang' }</div>

                <IconButton
                    className="item-detail__header-close"
                    onClick={ onClose }
                    aria-label="Tutup detail barang"
                >
                    <XIcon/>
                </IconButton>
            </DialogTitle>
            <DialogContent className="item-detail__content flex flex-col gap-2">
                { isLoading && (
                    <div className="py-8 text-center" role="status">
                        <CircularProgress size={ 24 } />
                        <div className="mt-2">Memuat detail barang...</div>
                    </div>
                ) }

                { error && (
                    <Alert
                        severity="error"
                        action={ onRetry && <Button color="inherit" size="small" onClick={ onRetry }>Coba lagi</Button> }
                    >
                        { error }
                    </Alert>
                ) }

                { !isLoading && !error && itemData && <>
                <div className="item-detail__content-item flex justify-between items-start">
                    <div className="item-detail__content-item-name">
                        Nama
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { itemData?.name }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start">
                    <div className="item-detail__content-item-name">
                        SKU
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { itemData?.sku }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start">
                    <div className="item-detail__content-item-name">
                        Harga
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR'
                        }).format(itemData?.price || 0) }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start border-b border-dashed border-gray-600 pb-4">
                    <div className="item-detail__content-item-name">
                        Stok toko
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { formatQuantity(itemData?.stockStore, itemData?.baseUnitOfMeasure) }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start border-b border-dashed border-gray-600 pb-4">
                    <div className="item-detail__content-item-name">
                        Stok gudang
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { formatQuantity(itemData?.stockWarehouse, itemData?.baseUnitOfMeasure) }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start">
                    <div className="item-detail__content-item-name">
                        Satuan dasar
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { formatUnitOfMeasure(itemData?.baseUnitOfMeasure) }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start">
                    <div className="item-detail__content-item-name">
                        Jumlah pecahan
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { itemData?.fractionalQuantityAllowed ? 'Diizinkan' : 'Unit utuh saja' }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start">
                    <div className="item-detail__content-item-name">
                        Status barang
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { itemData?.active ? 'Aktif' : 'Nonaktif' }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start">
                    <div className="item-detail__content-item-name">
                        Pergerakan stok
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { itemData?.hasStockMovements ? 'Sudah ada' : 'Belum ada' }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start border-b border-dashed border-gray-600 pb-4">
                    <div className="item-detail__content-item-name">
                        Aturan satuan
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right basis-1/2">
                        { itemData?.baseUnitOfMeasureLocked || itemData?.fractionalQuantityAllowedLocked
                            ? 'Terkunci karena sudah ada pergerakan stok'
                            : 'Belum terkunci' }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start pt-2">
                    <div className="item-detail__content-item-name">
                        Kode Kategori Barang
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { itemData?.category?.code }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start">
                    <div className="item-detail__content-item-name">
                        Nama Kategori Barang
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { itemData?.category?.name }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start border-b border-dashed border-gray-600 pb-4">
                    <div className="item-detail__content-item-name">
                        Deskripsi Kategori Barang
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right basis-1/2 break-all">
                        { itemData?.category?.description || '-' }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start pt-2">
                    <div className="item-detail__content-item-name">
                        Dibuat pada
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { formatDate(itemData?.createdAt) }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start">
                    <div className="item-detail__content-item-name">
                        Dibuat oleh
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { itemData?.createdBy }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start">
                    <div className="item-detail__content-item-name">
                        Diperbarui pada
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { formatDate(itemData?.updatedAt) || '-' }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start">
                    <div className="item-detail__content-item-name">
                        Diperbarui oleh
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { itemData?.updatedBy || '-' }
                    </div>
                </div>
                </> }
            </DialogContent>
        </Dialog>
    )
}

ItemDetailModal.propTypes = propTypes
