import PropTypes from "prop-types";

import {
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton
} from "@mui/material";

import { XIcon } from "lucide-react";

import { formatDate } from "@utils/date-utils.js";


const propTypes = {
    onClose: PropTypes.func.isRequired,
    itemData: PropTypes.object.isRequired
}

export default function ItemDetailModal(props) {
    const {
        onClose,
        itemData
    } = props;

    return (
        <Dialog
            className="item-detail"
            open
            onClose={ onClose }
            fullWidth
        >
            <DialogTitle className="item-detail__header flex justify-between items-center">
                <div className="item-detail__header-title font-bold">{ itemData.sku }</div>

                <IconButton
                    className="item-detail__header-close"
                    onClick={ onClose }
                >
                    <XIcon/>
                </IconButton>
            </DialogTitle>
            <DialogContent className="item-detail__content flex flex-col gap-2">
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
                        { itemData?.price }
                    </div>
                </div>

                <div className="item-detail__content-item flex justify-between items-start border-b border-dashed border-gray-600 pb-4">
                    <div className="item-detail__content-item-name">
                        Stok
                    </div>

                    <div className="item-detail__content-item-value font-bold text-right">
                        { itemData?.stockQuantity }
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
            </DialogContent>
        </Dialog>
    )
}

ItemDetailModal.propTypes = propTypes