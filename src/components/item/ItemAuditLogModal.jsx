import {
    useCallback,
    useEffect,
    useRef
} from 'react';
import { Link } from "react-router-dom"
import {
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItem,
    Typography
} from '@mui/material';
import {
    ArrowRight,
    SquareArrowOutUpRightIcon,
    X
} from 'lucide-react';
import PropTypes from 'prop-types';

import { useItemStore } from '@stores/index.js';
import { formatDate } from '@utils/date-utils';

const propTypes = {
    onClose: PropTypes.func.isRequired,
    sku: PropTypes.string
};

const ItemAuditLogModal = (props) => {
    const {
        onClose,
        sku
    } = props

    const {
        auditLogs,
        auditLogPaging,
        isFetchingAuditLogs,
        getItemAuditLog,
        resetAuditLogs
    } = useItemStore();

    useEffect(() => {
        if (sku) {
            const payload = {
                params: {
                    page: 1,
                    size: 20
                }
            };
            getItemAuditLog(sku, payload);
        }
    }, [sku]);

    useEffect(() => {
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
            resetAuditLogs();
        }
    }, []);

    // Infinite Scroll Logic
    const observer = useRef();
    const lastLogElementRef = useCallback(node => {
        if (isFetchingAuditLogs) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && auditLogPaging.hasNext) {
                // Fetch next page
                getItemAuditLog(sku, { params: { page: auditLogPaging.page + 1, size: 20 } });
            }
        });

        if (node) observer.current.observe(node);
    }, [isFetchingAuditLogs, auditLogPaging.hasNext, sku]);

    const getSourceChipAttributes = (source) => {
        switch (source) {
            case 'OPENING_BALANCE':
                return { color: 'default', label: 'Stok Awal' };

            case 'GOODS_RECEIPT':
                return { color: 'success', label: 'Penerimaan Barang' };

            case 'SALE':
                return { color: 'primary', label: 'Penjualan' };

            case 'STOCK_ADJUSTMENT':
                return { color: 'warning', label: 'Penyesuaian Stok' };

            case 'STOCK_OPNAME':
                return { color: 'info', label: 'Stok Opname' };

            case 'PURCHASE':
                return { color: 'success', label: 'Pembelian' };

            case 'RETURN':
                return { color: 'secondary', label: 'Retur Barang' };

            case 'TRANSFER':
                return { color: 'info', label: 'Transfer Stok' };

            default:
                return { color: 'default', label: source ?? '-' };
        }
    };

    const getReferenceLink = (source, referenceNo) => {
        switch (source) {
            case 'GOODS_RECEIPT':
                return `/goods-receipts/${ encodeURIComponent(referenceNo) }`;
            case 'SALE':
                return `/sales/${ encodeURIComponent(referenceNo) }`;
            case 'STOCK_ADJUSTMENT':
                return `/stock-adjustments/${ encodeURIComponent(referenceNo) }`;
            default:
                return '#';
        }
    }

    return (
        <Dialog
            onClose={ onClose }
            maxWidth="md"
            open
            fullWidth
            scroll="paper"
        >
            <DialogTitle className="flex justify-between items-center border-b pb-2">
                <Typography className="font-bold">
                    Riwayat Stok: <span className="text-primary-main">{ sku }</span>
                </Typography>
                <IconButton onClick={ onClose } size="small">
                    <X/>
                </IconButton>
            </DialogTitle>

            <DialogContent dividers className="p-0">
                <List className="p-0">
                    { auditLogs.map((log, index) => {
                        const diff = log.qtyAfter - log.qtyBefore;
                        const isPositive = diff > 0;
                        const isLastElement = auditLogs.length === index + 1;

                        return (
                            <div key={ `${ log.id }-${ index }` } ref={ isLastElement ? lastLogElementRef : null }>
                                <ListItem
                                    className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between py-4 px-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Typography variant="subtitle2" className="font-bold">
                                                { formatDate(log.createdDate) }
                                            </Typography>
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                className="h-6 text-xs"
                                                { ...getSourceChipAttributes(log.source) }
                                            />
                                        </div>
                                        <Typography variant="body2"
color="textSecondary"
                                                    className="flex items-center gap-1">
                                            Ref:
                                            <Link
                                                to={ getReferenceLink(log.source, log.referenceNo) }
                                                className="item-audit--reference-link flex items-start gap-0.5"
                                            >
                                                { log.referenceNo }
                                                <SquareArrowOutUpRightIcon
                                                    className="gr-content__table-link w-3.5 h-3.5"
                                                />
                                            </Link>
                                            <span className="text-gray-400 mx-1">•</span>
                                            Oleh: { log.createdBy }
                                        </Typography>
                                    </div>

                                    <div
                                        className="flex items-center gap-4 bg-white p-2 rounded-lg border border-gray-100 shadow-sm min-w-[200px] justify-center">
                                        <div className="text-center">
                                            <Typography variant="caption" color="textSecondary">Awal</Typography>
                                            <Typography variant="body2" className="font-medium text-gray-600">
                                                { log.qtyBefore }
                                            </Typography>
                                        </div>
                                        <ArrowRight size={ 16 } className="text-gray-300"/>
                                        <div className="text-center">
                                            <Typography variant="caption" color="textSecondary">Akhir</Typography>
                                            <Typography variant="body2" className="font-bold text-gray-800">
                                                { log.qtyAfter }
                                            </Typography>
                                        </div>
                                        <div
                                            className={ `ml-2 font-bold ${ isPositive ? 'text-green-600' : 'text-red-600' }` }>
                                            { isPositive ? '+' : '' }{ diff }
                                        </div>
                                    </div>
                                </ListItem>
                                <Divider component="li"/>
                            </div>
                        );
                    }) }
                </List>

                { isFetchingAuditLogs && (
                    <div className="flex justify-center p-4">
                        <CircularProgress size={ 24 }/>
                    </div>
                ) }

                { !isFetchingAuditLogs && !auditLogPaging.hasNext && auditLogs.length > 0 && (
                    <Typography variant="body2" align="center" className="p-4 text-gray-500 italic">
                        Tidak ada riwayat lagi
                    </Typography>
                ) }

                { !isFetchingAuditLogs && auditLogs.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                        <Typography>Belum ada riwayat perubahan stok</Typography>
                    </div>
                ) }
            </DialogContent>

            <DialogActions className="border-t pt-2">
                <Button onClick={ onClose } variant="outlined" color="inherit">
                    Tutup
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ItemAuditLogModal.propTypes = propTypes;

export default ItemAuditLogModal;
