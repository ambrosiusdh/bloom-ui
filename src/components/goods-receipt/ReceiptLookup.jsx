import { useEffect, useState } from 'react';
import { Alert, Autocomplete, Button, TextField } from '@mui/material';
import PropTypes from 'prop-types';

import itemApi from '@api/item.js';
import supplierApi from '@api/supplier.js';

export default function ReceiptLookup({ kind, value, onChange, disabled, error, inputRef }) {
    const [query, setQuery] = useState('');
    const [inputText, setInputText] = useState('');
    const [revision, setRevision] = useState(0);
    const [state, setState] = useState({ options: [], status: 'loading' });
    const supplier = kind === 'supplier';
    const label = supplier ? 'Pemasok' : 'Tambah barang (SKU / nama)';
    const identity = option => supplier ? option.code : option.sku;
    useEffect(() => {
        if (disabled) return;
        const controller = new AbortController();
        setState({ options: [], status: 'loading' });
        const timer = setTimeout(async () => {
            try {
                const config = { signal: controller.signal, params: { page: 1, size: 20,
                    ...(supplier ? { query: query.trim(), active: true } : { skuOrName: query.trim() }) } };
                const response = await (supplier ? supplierApi.getSupplierList(config) : itemApi.getItemList(config));
                if (!controller.signal.aborted) setState({ status: 'ready', options:
                    (response.data.data.content || []).filter(option => option.active && (supplier
                        ? option.code : option.sku && option.baseUnitOfMeasure && typeof option.fractionalQuantityAllowed === 'boolean')) });
            } catch {
                if (!controller.signal.aborted) setState({ options: [], status: 'error' });
            }
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [supplier, query, revision, disabled]);
    return (
        <div className="min-w-0 space-y-2">
            <Autocomplete options={ state.options }
                value={ value }
                disabled={ disabled }
                inputValue={ inputText }
                loading={ state.status === 'loading' }
                filterOptions={ options => options }
                getOptionLabel={ option => `[${ identity(option) }] ${ option.name }` }
                isOptionEqualToValue={ (option, selected) => identity(option) === identity(selected) }
                onInputChange={ (_, text, reason) => {
                    setInputText(text);
                    setQuery(reason === 'input' ? text : '');
                    if (reason === 'input') setState({ options: [], status: 'loading' });
                } }
                onChange={ (_, option) => {
                    onChange(option);
                    if (!supplier) { setQuery(''); setInputText(''); }
                } }
                loadingText="Memuat pilihan..."
                noOptionsText="Tidak ada hasil aktif. Ubah pencarian."
                renderInput={ params => <TextField { ...params }
                    label={ label }
                    inputRef={ inputRef }
                    error={ !!error }
                    helperText={ error || 'Maksimal 20 hasil; ketik kode atau nama untuk mempersempit.' } /> } />
            { state.status === 'loading' && !disabled && <p role="status" className="text-sm">Memuat { supplier ? 'pemasok' : 'barang' }...</p> }
            { state.status === 'error' && <Alert severity="error" action={ <Button disabled={ disabled } onClick={ () => setRevision(n => n + 1) }>Coba lagi</Button> }>Pilihan { supplier ? 'pemasok' : 'barang' } gagal dimuat.</Alert> }
        </div>
    );
}

ReceiptLookup.propTypes = {
    kind: PropTypes.oneOf(['supplier', 'item']).isRequired, value: PropTypes.object,
    onChange: PropTypes.func.isRequired, disabled: PropTypes.bool,
    error: PropTypes.string, inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
};
