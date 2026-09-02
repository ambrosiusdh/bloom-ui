import {
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

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { formatQuantity } from '@utils/quantity-utils.js';

const decimalType = PropTypes.oneOfType([PropTypes.number, PropTypes.string]);
const LOCATION_LABELS = { STORE: 'Toko', WAREHOUSE: 'Gudang' };

const LineDetails = ({ line }) => {
    const unit = line.item?.baseUnitOfMeasure;
    return (
        <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-600">Jumlah</dt><dd>{ formatQuantity(line.quantity, unit) }</dd></div>
            <div><dt className="text-gray-600">Lokasi</dt><dd>{ LOCATION_LABELS[line.stockLocation] || line.stockLocation || '-' }</dd></div>
            <div><dt className="text-gray-600">Harga satuan</dt><dd>{ formatRupiah(line.unitPrice) }</dd></div>
            <div><dt className="text-gray-600">Subtotal baris</dt><dd className="font-semibold">{ formatRupiah(line.subtotal) }</dd></div>
        </dl>
    );
};

LineDetails.propTypes = { line: PropTypes.object.isRequired };

const SaleItemsTable = ({ items = [] }) => (
    <section className="overflow-hidden rounded-lg bg-white shadow-lg" aria-labelledby="sale-lines-heading">
        <div className="border-b bg-gray-50 p-4">
            <Typography id="sale-lines-heading" variant="h6" className="font-bold text-gray-800">Daftar Barang</Typography>
            <p className="text-sm text-gray-600">Jumlah, harga, dan subtotal berikut adalah nilai baris yang disimpan server.</p>
        </div>

        { items.length ? (
            <>
                <div className="space-y-3 p-4 md:hidden">
                    { items.map((line, index) => (
                        <article key={ `${ line.item?.sku || 'item' }-${ line.stockLocation || index }-${ index }` }
                            className="space-y-3 rounded-lg border p-4">
                            <div><strong>{ line.item?.name || '-' }</strong><div className="text-sm text-gray-600">{ line.item?.sku || '-' }</div></div>
                            <LineDetails line={ line } />
                        </article>
                    )) }
                </div>
                <TableContainer component={ Paper } elevation={ 0 } className="hidden md:block">
                    <Table sx={ { minWidth: 820 } } aria-label="Baris barang penjualan">
                        <TableHead className="bg-gray-100"><TableRow>
                            <TableCell>Barang</TableCell><TableCell>Lokasi</TableCell><TableCell align="right">Jumlah</TableCell>
                            <TableCell align="right">Harga satuan</TableCell><TableCell align="right">Subtotal baris</TableCell>
                        </TableRow></TableHead>
                        <TableBody>{ items.map((line, index) => (
                            <TableRow key={ `${ line.item?.sku || 'item' }-${ line.stockLocation || index }-${ index }` } hover>
                                <TableCell><strong>{ line.item?.name || '-' }</strong><div className="text-sm text-gray-600">{ line.item?.sku || '-' }</div></TableCell>
                                <TableCell>{ LOCATION_LABELS[line.stockLocation] || line.stockLocation || '-' }</TableCell>
                                <TableCell align="right">{ formatQuantity(line.quantity, line.item?.baseUnitOfMeasure) }</TableCell>
                                <TableCell align="right" className="tabular-nums">{ formatRupiah(line.unitPrice) }</TableCell>
                                <TableCell align="right" className="font-medium tabular-nums">{ formatRupiah(line.subtotal) }</TableCell>
                            </TableRow>
                        )) }</TableBody>
                    </Table>
                </TableContainer>
            </>
        ) : (
            <div className="p-8 text-center text-gray-600">Tidak ada baris barang pada penjualan ini.</div>
        ) }
    </section>
);

SaleItemsTable.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        item: PropTypes.shape({
            name: PropTypes.string,
            sku: PropTypes.string,
            baseUnitOfMeasure: PropTypes.string
        }),
        stockLocation: PropTypes.string,
        unitPrice: decimalType,
        quantity: decimalType,
        subtotal: decimalType
    }))
};

export default SaleItemsTable;
