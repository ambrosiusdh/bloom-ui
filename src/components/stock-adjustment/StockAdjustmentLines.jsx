import { Chip, Typography } from '@mui/material';
import { ArrowRightIcon } from 'lucide-react';
import PropTypes from 'prop-types';

import {
    formatQuantity,
    formatUnitOfMeasure
} from '@utils/quantity-utils.js';

const ACTION_LABELS = {
    ADD: 'Tambah',
    REMOVE: 'Kurangi',
    CORRECTION: 'Koreksi stok'
};
const LOCATION_LABELS = {
    STORE: 'Toko',
    WAREHOUSE: 'Gudang'
};

export default function StockAdjustmentLines({ items, heading = 'Rincian penyesuaian' }) {
    return (
        <section
            className="overflow-hidden rounded-lg bg-white shadow-lg"
            aria-labelledby="stock-adjustment-lines-heading"
        >
            <div className="border-b bg-gray-50 p-4">
                <Typography
                    id="stock-adjustment-lines-heading"
                    variant="h6"
                    className="font-bold text-gray-800"
                >
                    { heading }
                </Typography>
                <p className="text-sm text-slate-600">
                    Stok sebelumnya dan stok baru di bawah adalah hasil yang dikembalikan server.
                </p>
            </div>

            { items?.length ? (
                <div>
                    { items.map((row, index) => {
                        const unit = row.item?.baseUnitOfMeasure;
                        const isLastRow = index === items.length - 1;

                        return (
                            <article
                                key={ row.id || `${ row.item?.sku }-${ row.stockLocation }` }
                                className={ `grid min-w-0 grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(13rem,1.4fr)_minmax(7rem,0.65fr)_minmax(8rem,0.75fr)_minmax(8rem,0.8fr)_minmax(15rem,1.2fr)] lg:items-center ${ isLastRow ? '' : 'border-b' }` }
                            >
                                <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                                    <span className="block text-xs font-medium text-slate-600 lg:hidden">
                                        Barang
                                    </span>
                                    <strong className="mt-1 block break-words lg:mt-0">
                                        { row.item?.name || '-' }
                                    </strong>
                                    <span className="mt-1 block break-all text-sm text-slate-600">
                                        { row.item?.sku || '-' } · { formatUnitOfMeasure(unit) }
                                    </span>
                                </div>

                                <div>
                                    <span className="block text-xs font-medium text-slate-600">Lokasi</span>
                                    <strong className="mt-1 block font-medium">
                                        { LOCATION_LABELS[row.stockLocation] || row.stockLocation || '-' }
                                    </strong>
                                </div>

                                <div>
                                    <span className="block text-xs font-medium text-slate-600">Tindakan</span>
                                    <Chip
                                        className="mt-1"
                                        size="small"
                                        variant="outlined"
                                        label={ ACTION_LABELS[row.actionType] || row.actionType || '-' }
                                    />
                                </div>

                                <div>
                                    <span className="block text-xs font-medium text-slate-600">
                                        { row.actionType === 'CORRECTION' ? 'Target stok' : 'Jumlah perubahan' }
                                    </span>
                                    <strong className="mt-1 block whitespace-nowrap font-medium tabular-nums">
                                        { formatQuantity(row.changeQuantity, unit) }
                                    </strong>
                                </div>

                                <div className="sm:col-span-2 lg:col-span-1">
                                    <span className="block text-xs font-medium text-slate-600">
                                        Hasil stok server
                                    </span>
                                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 tabular-nums">
                                        <span>
                                            <span className="sr-only">Sebelumnya </span>
                                            { formatQuantity(row.previousStock, unit) }
                                        </span>
                                        <ArrowRightIcon size={ 17 } aria-hidden="true" />
                                        <strong>
                                            <span className="sr-only">Stok baru </span>
                                            { formatQuantity(row.newStock, unit) }
                                        </strong>
                                    </div>
                                </div>
                            </article>
                        );
                    }) }
                </div>
            ) : (
                <p className="p-8 text-center text-slate-500">
                    Tidak ada baris penyesuaian.
                </p>
            ) }
        </section>
    );
}

const decimalValue = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

StockAdjustmentLines.propTypes = {
    heading: PropTypes.string,
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
