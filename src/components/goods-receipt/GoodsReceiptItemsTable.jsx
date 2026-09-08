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

import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import { GOODS_RECEIPT_LOCATION_LABELS } from '@utils/goods-receipt-utils.js';
import { formatQuantity } from '@utils/quantity-utils.js';

const decimalType = PropTypes.oneOfType([PropTypes.number, PropTypes.string]);
const money = value => value == null ? '-' : formatRupiah(value);

const propTypes = {
    goodsReceiptItems: PropTypes.arrayOf(PropTypes.shape({
        item: PropTypes.shape({ name: PropTypes.string, sku: PropTypes.string }),
        quantity: decimalType,
        baseUnitOfMeasure: PropTypes.string,
        purchasePrice: decimalType,
        lineTotal: decimalType,
        stockLocation: PropTypes.string
    })).isRequired
};

const GoodsReceiptItemsTable = ({ goodsReceiptItems }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
                <Typography variant="h6" className="font-bold text-gray-800">
                    Daftar Barang Diterima
                </Typography>
                <p className="text-sm text-gray-600">Jumlah, UOM, lokasi, harga, dan subtotal adalah nilai yang disimpan server.</p>
            </div>
            <div className="space-y-3 p-4 md:hidden">
                { goodsReceiptItems.length ? goodsReceiptItems.map((line, index) => (
                    <article key={ line.id || `${ line.item?.sku }-${ line.stockLocation }-${ index }` }
                        className="space-y-3 rounded-lg border p-4">
                        <div><strong>{ line.item?.name || '-' }</strong><div className="text-sm text-gray-600">{ line.item?.sku || '-' }</div></div>
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                            <div><dt className="text-gray-600">Jumlah</dt><dd>{ formatQuantity(line.quantity, line.baseUnitOfMeasure) }</dd></div>
                            <div><dt className="text-gray-600">Lokasi</dt><dd>{ GOODS_RECEIPT_LOCATION_LABELS[line.stockLocation] || line.stockLocation || '-' }</dd></div>
                            <div><dt className="text-gray-600">Harga beli</dt><dd>{ money(line.purchasePrice) }</dd></div>
                            <div><dt className="text-gray-600">Subtotal baris</dt><dd className="font-semibold">{ money(line.lineTotal) }</dd></div>
                        </dl>
                    </article>
                )) : <div className="py-6 text-center text-gray-500">Tidak ada barang pada penerimaan ini.</div> }
            </div>
            <TableContainer component={ Paper } elevation={ 0 }>
                <Table className="hidden md:table" sx={ { minWidth: 820 } } aria-label="Baris barang penerimaan">
                    <TableHead className="bg-gray-100">
                        <TableRow>
                            <TableCell className="font-semibold">Barang</TableCell>
                            <TableCell className="font-semibold">Lokasi</TableCell>
                            <TableCell align="right" className="font-semibold">Jumlah</TableCell>
                            <TableCell align="right" className="font-semibold">Harga beli</TableCell>
                            <TableCell align="right" className="font-semibold">Subtotal baris</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        { goodsReceiptItems && goodsReceiptItems.length > 0 ? (
                            goodsReceiptItems.map((goodsReceiptItem, index) => (
                                <TableRow key={ goodsReceiptItem.id || `${ goodsReceiptItem.item?.sku }-${ goodsReceiptItem.stockLocation }-${ index }` } hover>
                                    <TableCell>
                                        <div className="font-medium">{ goodsReceiptItem.item?.name || '-' }</div>
                                        <div className="text-sm text-gray-600">{ goodsReceiptItem.item?.sku || '-' }</div>
                                    </TableCell>
                                    <TableCell>{ GOODS_RECEIPT_LOCATION_LABELS[goodsReceiptItem.stockLocation] || goodsReceiptItem.stockLocation || '-' }</TableCell>
                                    <TableCell align="right">{ formatQuantity(goodsReceiptItem.quantity, goodsReceiptItem.baseUnitOfMeasure) }</TableCell>
                                    <TableCell align="right" className="tabular-nums">{ money(goodsReceiptItem.purchasePrice) }</TableCell>
                                    <TableCell align="right" className="font-medium tabular-nums">{ money(goodsReceiptItem.lineTotal) }</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={ 5 } align="center" className="text-gray-500 italic py-8">
                                    Tidak ada barang pada penerimaan ini.
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
