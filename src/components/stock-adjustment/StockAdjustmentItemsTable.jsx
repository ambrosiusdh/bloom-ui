import {
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import PropTypes from 'prop-types';

import {
    formatQuantity,
    formatUnitOfMeasure
} from '@utils/quantity-utils.js';

const ACTION_LABELS = {
    ADD: 'Tambah',
    REMOVE: 'Kurangi',
    CORRECTION: 'Koreksi absolut'
};
const LOCATION_LABELS = {
    STORE: 'Toko (STORE)',
    WAREHOUSE: 'Gudang (WAREHOUSE)'
};

export default function StockAdjustmentItemsTable({ items }) {
    return (
        <section className="overflow-hidden rounded-lg bg-white shadow-lg" aria-label="Rincian penyesuaian stok">
            <div className="border-b bg-gray-50 p-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                    Rincian penyesuaian
                </Typography>
                <p className="text-sm text-slate-600">
                    Stok awal dan akhir di bawah adalah hasil yang disimpan server.
                </p>
            </div>
            <TableContainer component={ Paper } elevation={ 0 }>
                <Table sx={ { minWidth: 820 } }>
                    <TableHead className="bg-gray-100">
                        <TableRow>
                            <TableCell>Barang</TableCell>
                            <TableCell>Lokasi</TableCell>
                            <TableCell>Tindakan</TableCell>
                            <TableCell align="right">Nilai permintaan</TableCell>
                            <TableCell align="right">Stok sebelumnya</TableCell>
                            <TableCell align="right">Stok baru</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { items?.length ? items.map(row => {
                            const unit = row.item?.baseUnitOfMeasure;

                            return (
                                <TableRow key={ row.id || `${ row.item?.sku }-${ row.stockLocation }` } hover>
                                    <TableCell>
                                        <strong>{ row.item?.sku || '-' }</strong>
                                        <div className="text-sm text-slate-600">{ row.item?.name || '-' }</div>
                                        <div className="text-xs text-slate-500">{ formatUnitOfMeasure(unit) }</div>
                                    </TableCell>
                                    <TableCell>{ LOCATION_LABELS[row.stockLocation] || row.stockLocation || '-' }</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            label={ ACTION_LABELS[row.actionType] || row.actionType || '-' }
                                        />
                                    </TableCell>
                                    <TableCell align="right">{ formatQuantity(row.changeQuantity, unit) }</TableCell>
                                    <TableCell align="right">{ formatQuantity(row.previousStock, unit) }</TableCell>
                                    <TableCell align="right"><strong>{ formatQuantity(row.newStock, unit) }</strong></TableCell>
                                </TableRow>
                            );
                        }) : (
                            <TableRow>
                                <TableCell colSpan={ 6 } align="center" className="py-8 text-slate-500">
                                    Tidak ada baris penyesuaian.
                                </TableCell>
                            </TableRow>
                        ) }
                    </TableBody>
                </Table>
            </TableContainer>
        </section>
    );
}

const decimalValue = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

StockAdjustmentItemsTable.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        actionType: PropTypes.string,
        stockLocation: PropTypes.string,
        changeQuantity: decimalValue,
        previousStock: decimalValue,
        newStock: decimalValue,
        item: PropTypes.shape({
            sku: PropTypes.string,
            name: PropTypes.string,
            baseUnitOfMeasure: PropTypes.string
        })
    }))
};
