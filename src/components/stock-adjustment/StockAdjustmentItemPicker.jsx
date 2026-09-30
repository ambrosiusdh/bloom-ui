import { Autocomplete, Button, TextField } from '@mui/material';
import { SearchIcon } from 'lucide-react';
import PropTypes from 'prop-types';

import { formatUnitOfMeasure } from '@utils/quantity-utils.js';

const getCategoryName = item => item?.category?.name || 'Kategori tidak tersedia';
const getQuantityPolicy = item => item?.fractionalQuantityAllowed
    ? 'Pecahan sampai 4 desimal'
    : 'Jumlah utuh';

export default function StockAdjustmentItemPicker({
    items,
    value,
    selecting,
    disabled,
    error,
    inputRef,
    onChange,
    onStartSelecting
}) {
    if (value && !selecting) {
        return (
            <div>
                <span className="mb-2 block text-sm font-medium">Barang *</span>
                <div className="flex min-w-0 flex-col gap-3 rounded-lg border bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <strong className="block break-words">{ value.name || '-' }</strong>
                        <span className="mt-1 block break-words text-sm text-slate-600">
                            { value.sku } · { getCategoryName(value) } ·{ ' ' }
                            { formatUnitOfMeasure(value.baseUnitOfMeasure) } ·{ ' ' }
                            { getQuantityPolicy(value) }
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="outlined"
                        startIcon={ <SearchIcon size={ 18 } aria-hidden="true" /> }
                        disabled={ disabled }
                        ref={ inputRef }
                        onClick={ onStartSelecting }
                    >
                        Ganti barang
                    </Button>
                </div>
                { error && <p className="mt-1 text-sm text-red-700">{ error }</p> }
            </div>
        );
    }

    return (
        <Autocomplete
            autoHighlight
            clearOnEscape
            openOnFocus
            options={ items }
            value={ value }
            disabled={ disabled }
            filterOptions={ (options, state) => {
                const query = state.inputValue.trim().toLocaleLowerCase('id-ID');
                const matches = query
                    ? options.filter(item => `${ item.sku } ${ item.name }`
                        .toLocaleLowerCase('id-ID')
                        .includes(query))
                    : options;

                return matches.slice(0, 50);
            } }
            getOptionLabel={ option => `${ option.sku } · ${ option.name }` }
            isOptionEqualToValue={ (option, selected) => option.sku === selected.sku }
            noOptionsText="Tidak ada barang aktif yang cocok. Ubah nama atau SKU pencarian."
            onChange={ (_, item) => onChange(item) }
            renderOption={ (props, option) => {
                // MUI supplies the option key as part of its internal list-item props.
                // eslint-disable-next-line react/prop-types
                const { key, ...optionProps } = props;

                return (
                    <li key={ key } { ...optionProps }>
                        <div className="min-w-0 py-1">
                            <strong className="block break-words">{ option.name }</strong>
                            <span className="block break-words text-sm text-slate-600">
                                { option.sku } · { getCategoryName(option) } ·{ ' ' }
                                { formatUnitOfMeasure(option.baseUnitOfMeasure) } ·{ ' ' }
                                { getQuantityPolicy(option) }
                            </span>
                        </div>
                    </li>
                );
            } }
            renderInput={ params => (
                <TextField
                    { ...params }
                    required
                    label="Cari barang dengan nama atau SKU"
                    placeholder="Ketik nama atau SKU barang"
                    inputRef={ inputRef }
                    error={ !!error }
                    helperText={ error || 'Ketik nama atau SKU. Gunakan tombol panah untuk memilih, Enter untuk menetapkan, dan Escape untuk menutup.' }
                />
            ) }
        />
    );
}

StockAdjustmentItemPicker.propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    value: PropTypes.object,
    selecting: PropTypes.bool.isRequired,
    disabled: PropTypes.bool,
    error: PropTypes.string,
    inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    onChange: PropTypes.func.isRequired,
    onStartSelecting: PropTypes.func.isRequired
};
