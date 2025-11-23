import React from 'react';
import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button
} from '@mui/material';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LowStockAlert = ({ data }) => {
    return (
        <Paper className="dashboard__low-stock p-6 rounded-xl shadow-md h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-red-600">
                    <div className="p-2 bg-red-100 rounded-lg mr-3">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <Typography variant="h6" className="font-bold text-gray-800">
                            Stok Menipis
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
                            Perlu segera di-restock
                        </Typography>
                    </div>
                </div>
            </div>

            <TableContainer className="flex-grow">
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell className="font-bold bg-gray-50 text-gray-600">Barang</TableCell>
                            <TableCell align="right" className="font-bold bg-gray-50 text-gray-600">Sisa</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.id} hover className="transition-colors">
                                <TableCell component="th" scope="row" className="border-b border-gray-100">
                                    <div className="font-medium text-sm text-gray-800">{row.name}</div>
                                    <div className="text-xs text-gray-500">{row.sku}</div>
                                </TableCell>
                                <TableCell align="right" className="border-b border-gray-100">
                                    <Chip
                                        label={row.stock}
                                        size="small"
                                        color={row.stock === 0 ? "error" : "warning"}
                                        variant={row.stock === 0 ? "filled" : "outlined"}
                                        className="min-w-[40px] font-bold"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <div className="mt-4 pt-2 border-t border-gray-100 text-center">
                <Button
                    component={Link}
                    to="/items"
                    endIcon={<ArrowRight size={16} />}
                    className="text-maroon-600 hover:bg-maroon-600/5 normal-case font-bold"
                >
                    Lihat Semua Barang
                </Button>
            </div>
        </Paper>
    );
};

export default LowStockAlert;
