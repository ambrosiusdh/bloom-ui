import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Chip
} from '@mui/material';
import PropTypes from 'prop-types';
import { ArrowRight } from 'lucide-react';

const propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        item: PropTypes.shape({
            sku: PropTypes.string,
            name: PropTypes.string
        }),
        previousStock: PropTypes.number,
        newStock: PropTypes.number
    }))
};

const StockAdjustmentItemsTable = ({ items }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
                <Typography variant="h6" className="font-bold text-gray-800">
                    Rincian Penyesuaian
                </Typography>
            </div>
            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead className="bg-gray-100">
                        <TableRow>
                            <TableCell className="font-semibold">SKU</TableCell>
                            <TableCell className="font-semibold">Nama Barang</TableCell>
                            <TableCell align="center" className="font-semibold">Stok Awal</TableCell>
                            <TableCell align="center" className="font-semibold"></TableCell>
                            <TableCell align="center" className="font-semibold">Stok Akhir</TableCell>
                            <TableCell align="center" className="font-semibold">Selisih</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items && items.length > 0 ? (
                            items.map((row, index) => {
                                const diff = row.newStock - row.previousStock;
                                const isPositive = diff > 0;
                                const isZero = diff === 0;

                                return (
                                    <TableRow key={index} hover>
                                        <TableCell>{row.item?.sku}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{row.item?.name}</div>
                                        </TableCell>
                                        <TableCell align="center" className="text-gray-600">{row.previousStock}</TableCell>
                                        <TableCell align="center"><ArrowRight size={16} className="text-gray-400" /></TableCell>
                                        <TableCell align="center" className="font-bold">{row.newStock}</TableCell>
                                        <TableCell align="center">
                                            {!isZero && (
                                                <Chip
                                                    label={`${isPositive ? '+' : ''}${diff}`}
                                                    color={isPositive ? "success" : "error"}
                                                    size="small"
                                                    variant="soft" // if supported or outlined
                                                    className="font-bold"
                                                />
                                            )}
                                            {isZero && <span className="text-gray-400">-</span>}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" className="text-gray-500 italic py-8">
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

StockAdjustmentItemsTable.propTypes = propTypes;

export default StockAdjustmentItemsTable;
