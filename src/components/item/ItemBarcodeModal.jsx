import {
    useRef
} from 'react'

import Barcode from 'react-barcode'

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton
} from '@mui/material'

import {
    PrinterIcon,
    XIcon
} from 'lucide-react'


const ItemBarcodeModal = ({
    itemData = {},
    onClose
}) => {
    const printRef = useRef();

    const handlePrint = () => {
        const printContent = printRef.current;
        const windowPrint = window.open('', '', 'width=900,height=650');
        windowPrint.document.write('<html><head><title>Print Barcode</title>');
        windowPrint.document.write('<style>@media print { body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; } }</style>');
        windowPrint.document.write('</head><body>');
        windowPrint.document.write(printContent.innerHTML);
        windowPrint.document.write('</body></html>');
        windowPrint.document.close();
        windowPrint.focus();
        windowPrint.print();
        windowPrint.close();
    }

    return (
        <Dialog
            open={ !!itemData.sku }
            onClose={ onClose }
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle className="flex justify-between items-center">
                <span className="font-bold">Cetak Barcode</span>
                <IconButton onClick={ onClose } size="small">
                    <XIcon className="w-5 h-5" />
                </IconButton>
            </DialogTitle>

            <DialogContent className="flex flex-col items-center justify-center py-8">
                <div ref={ printRef } className="text-center">
                    <div className="font-bold text-lg mb-2">{ itemData.name }</div>
                    <Barcode value={ itemData.sku || '' } />
                </div>
            </DialogContent>

            <DialogActions className="p-4 pt-0">
                <Button
                    variant="contained"
                    fullWidth
                    startIcon={ <PrinterIcon className="w-5 h-5" /> }
                    onClick={ handlePrint }
                >
                    Cetak
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ItemBarcodeModal
