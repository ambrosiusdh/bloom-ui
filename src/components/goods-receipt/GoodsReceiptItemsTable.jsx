import PropTypes from 'prop-types';

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography
} from '@mui/material';

const propTypes = {
    goodsReceiptItems: PropTypes.array.isRequired
};

const GoodsReceiptItemsTable = ({ goodsReceiptItems }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
                <Typography variant="h6" className="font-bold text-gray-800">
                    Daftar Barang Diterima
                </Typography>
            </div>
            <TableContainer component={ Paper } elevation={ 0 }>
                <Table>
                    <TableHead className="bg-gray-100">
                        <TableRow>
                            <TableCell className="font-semibold">SKU</TableCell>
                            <TableCell className="font-semibold">Nama Barang</TableCell>
                            <TableCell align="center" className="font-semibold">Qty Diterima</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { goodsReceiptItems && goodsReceiptItems.length > 0 ? (
                            goodsReceiptItems.map((goodsReceiptItem, index) => (
                                <TableRow key={ index } hover>
                                    <TableCell>{ goodsReceiptItem.item.sku }</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{ goodsReceiptItem.item.name }</div>
                                    </TableCell>
                                    <TableCell align="center">{ goodsReceiptItem.quantity }</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={ 3 } align="center" className="text-gray-500 italic py-8">
                                    Tidak ada barang
                                </TableCell>
                            </TableRow>
                        ) }
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

GoodsReceiptItemsTable.propTypes = propTypes;

export default GoodsReceiptItemsTable;
