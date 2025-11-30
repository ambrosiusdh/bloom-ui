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
import PropTypes from 'prop-types';

const propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        item: PropTypes.shape({
            name: PropTypes.string,
            sku: PropTypes.string,
            description: PropTypes.string
        }),
        unitPrice: PropTypes.number,
        quantity: PropTypes.number,
        subtotal: PropTypes.number
    }))
};

const SaleItemsTable = ({ items }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
                <Typography variant="h6" className="font-bold text-gray-800">
                    Daftar Barang
                </Typography>
            </div>
            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead className="bg-gray-100">
                        <TableRow>
                            <TableCell className="font-semibold">Nama Barang</TableCell>
                            <TableCell className="font-semibold">SKU</TableCell>
                            <TableCell align="right" className="font-semibold">Harga Satuan</TableCell>
                            <TableCell align="center" className="font-semibold">Qty</TableCell>
                            <TableCell align="right" className="font-semibold">Subtotal</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items && items.length > 0 ? (
                            items.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>
                                        <div className="font-medium">{item.item.name}</div>
                                        <div className="text-xs text-gray-500">{item.item.description}</div>
                                    </TableCell>
                                    <TableCell>{item.item.sku}</TableCell>
                                    <TableCell align="right">
                                        Rp {item.unitPrice?.toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell align="center">{item.quantity}</TableCell>
                                    <TableCell align="right" className="font-medium">
                                        Rp {item.subtotal?.toLocaleString('id-ID')}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center" className="text-gray-500 italic py-8">
                                    Tidak ada barang
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

SaleItemsTable.propTypes = propTypes;

export default SaleItemsTable;
