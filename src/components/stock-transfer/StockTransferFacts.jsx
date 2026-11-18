import PropTypes from 'prop-types';

import { formatCashSessionDate } from '@components/cash-session/cash-session-date.js';
import { formatQuantity } from '@utils/quantity-utils.js';
import { TRANSFER_LOCATIONS } from '@utils/stock-transfer-utils.js';

export default function StockTransferFacts({ transfer }) {
    return (
        <div className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                    <dt>Lokasi asal</dt>
                    <dd className="font-semibold">{ TRANSFER_LOCATIONS[transfer.sourceLocation] || '-' }</dd>
                </div>
                <div>
                    <dt>Lokasi tujuan</dt>
                    <dd className="font-semibold">{ TRANSFER_LOCATIONS[transfer.destinationLocation] || '-' }</dd>
                </div>
                <div>
                    <dt>Dicatat oleh</dt>
                    <dd className="break-words font-semibold">{ transfer.createdBy || '-' }</dd>
                </div>
                <div>
                    <dt>Waktu</dt>
                    <dd className="font-semibold">{ formatCashSessionDate(transfer.createdAt) }</dd>
                </div>
                <div className="min-w-0 sm:col-span-2">
                    <dt>Keterangan</dt>
                    <dd className="whitespace-pre-wrap break-words font-semibold">{ transfer.description || 'Tidak ada' }</dd>
                </div>
            </dl>
            <ol className="space-y-3" aria-label="Barang transfer">
                { transfer.lines?.map((line, index) => (
                    <li key={ line.id ?? line.itemSku ?? index } className="rounded-lg border p-3">
                        <span className="text-sm">Baris { index + 1 }</span>
                        <strong className="block break-words">{ line.itemName || line.itemSku } · { line.itemSku }</strong>
                        <span>Jumlah dipindahkan: { formatQuantity(line.quantity, line.unitOfMeasure) }</span>
                    </li>
                )) }
            </ol>
        </div>
    );
}

StockTransferFacts.propTypes = {
    transfer: PropTypes.object.isRequired
};
