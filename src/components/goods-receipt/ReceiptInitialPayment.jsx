import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, MenuItem, TextField } from '@mui/material';
import PropTypes from 'prop-types';

import BloomMoneyField from '@components/_ui/BloomMoneyField.jsx';
import { formatRupiah } from '@components/cash-session/cash-session-money.js';
import useCashSessionStore from '@stores/modules/cash-session.js';
import { formatDate } from '@utils/date-utils.js';
import { SUPPLIER_PAYMENT_METHODS } from '@utils/supplier-payment-utils.js';

export default function ReceiptInitialPayment({ payment, onChange, disabled, errors, fieldRef }) {
    const cash = useCashSessionStore();
    const isCash = payment?.paymentMethod === 'CASH';

    useEffect(() => {
        if (isCash && !disabled) {
            cash.getCurrentSession({ timeout: 15000 }).catch(() => {});
        }
    }, [isCash, disabled, cash.getCurrentSession]);

    const edit = (field, value) => onChange({
        ...payment,
        [field]: value
    });

    return (
        <section className="min-w-0 space-y-4" aria-labelledby="receipt-initial-payment-title">
            <h2 id="receipt-initial-payment-title" className="text-lg font-semibold">Pembayaran awal</h2>
            <TextField
                label="Pembayaran saat penerimaan"
                fullWidth
                select
                disabled={ disabled }
                value={ payment?.paymentMethod || '' }
                slotProps={ {
                    select: { displayEmpty: true },
                    inputLabel: { shrink: true }
                } }
                inputRef={ fieldRef('paymentMethod') }
                error={ Boolean(errors['initialPayment.paymentMethod']) }
                helperText={ errors['initialPayment.paymentMethod'] }
                onChange={ event => onChange(event.target.value ? {
                    amount: payment?.amount || '',
                    paymentMethod: event.target.value,
                    reference: payment?.reference || '',
                    note: payment?.note || ''
                } : null) }
            >
                <MenuItem value="">Tanpa pembayaran</MenuItem>
                { Object.entries(SUPPLIER_PAYMENT_METHODS).map(([method, label]) => (
                    <MenuItem key={ method } value={ method }>{ label }</MenuItem>
                )) }
            </TextField>
            { payment && (
                <>
                    <BloomMoneyField
                        label="Nominal pembayaran awal"
                        required
                        fullWidth
                        value={ payment.amount }
                        groupSeparator="."
                        decimalSeparator=","
                        disabled={ disabled }
                        inputRef={ fieldRef('amount') }
                        error={ Boolean(errors['initialPayment.amount']) }
                        helperText={ errors['initialPayment.amount'] || 'Maksimal 4 desimal. Server memeriksa nominal terhadap total resmi.' }
                        onValueChange={ value => edit('amount', value) }
                    />
                    <TextField
                        label="Referensi pembayaran awal (opsional)"
                        fullWidth
                        disabled={ disabled }
                        value={ payment.reference }
                        inputRef={ fieldRef('reference') }
                        error={ Boolean(errors['initialPayment.reference']) }
                        helperText={ errors['initialPayment.reference'] || 'Referensi bank atau QRIS, maksimal 255 karakter.' }
                        onChange={ event => edit('reference', event.target.value) }
                    />
                    <TextField
                        label="Catatan pembayaran awal (opsional)"
                        fullWidth
                        multiline
                        minRows={ 2 }
                        disabled={ disabled }
                        value={ payment.note }
                        inputRef={ fieldRef('note') }
                        error={ Boolean(errors['initialPayment.note']) }
                        helperText={ errors['initialPayment.note'] || 'Maksimal 255 karakter.' }
                        onChange={ event => edit('note', event.target.value) }
                    />
                    { isCash ? (
                        <Alert severity={ cash.currentStatus === 'ready' && cash.drawerActionsEnabled ? 'info' : 'warning' }>
                            { cash.currentStatus === 'loading'
                                ? 'Memeriksa sesi kas untuk pembayaran tunai...'
                                : cash.currentStatus === 'error'
                                    ? 'Sesi kas belum dapat diperiksa. Muat ulang sebelum meninjau pembayaran tunai.'
                                    : cash.drawerActionsEnabled
                                        ? `Pembayaran tunai memakai sesi kas #${ cash.currentSession.id } dan mengurangi kas laci.`
                                        : 'Pembayaran tunai memerlukan sesi kas yang terbuka.' }
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    disabled={ disabled || cash.currentStatus === 'loading' }
                                    onClick={ () => cash.getCurrentSession({ timeout: 15000 }).catch(() => {}) }
                                >
                                    Periksa sesi kas
                                </Button>
                                <Button component={ Link } to="/cash-sessions">Buka sesi kas</Button>
                            </div>
                        </Alert>
                    ) : (
                        <p className="text-sm text-gray-600">
                            Transfer bank dan QRIS mencatat pembayaran yang sudah dilakukan, tanpa mengubah kas laci.
                        </p>
                    ) }
                    <p className="text-sm text-gray-600">
                        Waktu pembayaran diambil saat Anda membuka tinjauan. Penerimaan dan pembayaran disimpan bersama.
                    </p>
                </>
            ) }
        </section>
    );
}

ReceiptInitialPayment.propTypes = {
    payment: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    errors: PropTypes.object.isRequired,
    fieldRef: PropTypes.func.isRequired
};

export function ReceiptInitialPaymentSummary({ payment, cashSessionId }) {
    if (!payment) return <p>Tanpa pembayaran awal.</p>;

    return (
        <section className="space-y-3" aria-label="Rincian pembayaran awal">
            <h2 className="text-lg font-semibold">Pembayaran awal</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                    <dt>Nominal</dt>
                    <dd className="font-semibold">{ formatRupiah(payment.amount) }</dd>
                </div>
                <div>
                    <dt>Metode</dt>
                    <dd>{ SUPPLIER_PAYMENT_METHODS[payment.paymentMethod] || payment.paymentMethod }</dd>
                </div>
                <div>
                    <dt>Waktu pembayaran</dt>
                    <dd>{ formatDate(payment.paidAt) || '-' }</dd>
                </div>
                <div>
                    <dt>Referensi eksternal</dt>
                    <dd className="break-all">{ payment.reference || '-' }</dd>
                </div>
                { payment.paymentReference && (
                    <div>
                        <dt>Referensi pembayaran tercatat</dt>
                        <dd className="break-all">{ payment.paymentReference }</dd>
                    </div>
                ) }
                { payment.actor && <div><dt>Dicatat oleh</dt><dd>{ payment.actor }</dd></div> }
                { payment.note && <div className="sm:col-span-2"><dt>Catatan</dt><dd className="break-words">{ payment.note }</dd></div> }
            </dl>
            { payment.voided && <Alert severity="warning">Pembayaran awal ini sudah dibatalkan. Periksa riwayat pembayaran.</Alert> }
            <p className="text-sm">
                { payment.paymentMethod === 'CASH'
                    ? `Tunai memerlukan sesi kas terbuka dan mengurangi kas laci. Sesi kas #${ payment.cashSessionId || cashSessionId || '-' }.`
                    : 'Metode ini tidak memerlukan sesi kas dan tidak mengubah kas laci.' }
            </p>
        </section>
    );
}

ReceiptInitialPaymentSummary.propTypes = {
    payment: PropTypes.object,
    cashSessionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};
