import React from 'react';

import { Link } from 'react-router-dom';

import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button
} from '@mui/material';

import { ArrowRight } from 'lucide-react';

const RecentTransactions = ({ data }) => {
    return (
        <Paper className="dashboard__recent-transactions p-6 rounded-xl shadow-md h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <Typography variant="h6" className="font-bold text-gray-800">
                        Transaksi Terakhir
                    </Typography>
                    <Typography variant="body2" className="text-gray-500">
                        5 transaksi penjualan terbaru
                    </Typography>
                </div>
            </div>

            <TableContainer className="flex-grow">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell className="font-bold bg-gray-50 text-gray-600">Kode Transaksi</TableCell>
                            <TableCell className="font-bold bg-gray-50 text-gray-600">Waktu</TableCell>
                            <TableCell className="font-bold bg-gray-50 text-gray-600">Admin</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { data.map((row) => (
                            <TableRow key={ row.id } hover className="transition-colors">
                                <TableCell className="font-medium text-gray-800">
                                    { row.id }
                                </TableCell>
                                <TableCell className="text-gray-600">
                                    { row.time }
                                </TableCell>
                                <TableCell className="text-gray-800">
                                    { row.admin }
                                </TableCell>
                            </TableRow>
                        )) }
                    </TableBody>
                </Table>
            </TableContainer>

            <div className="mt-4 pt-2 border-t border-gray-100 text-center">
                <Button
                    component={ Link }
                    to="/sales"
                    endIcon={ <ArrowRight size={ 16 } /> }
                    className="text-maroon-600 hover:bg-maroon-600/5 normal-case font-bold"
                >
                    Lihat Semua Transaksi
                </Button>
            </div>
        </Paper>
    );
};

export default RecentTransactions;
