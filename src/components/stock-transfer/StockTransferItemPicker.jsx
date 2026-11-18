import { Autocomplete, TextField } from '@mui/material';
import PropTypes from 'prop-types';

import {
    formatQuantity,
    formatUnitOfMeasure
} from '@utils/quantity-utils.js';

const getCategoryName = item => item?.category?.name || 'Kategori tidak tersedia';
const getQuantityPolicy = item => item?.fractionalQuantityAllowed
    ? 'Pecahan sampai 4 desimal'
    : 'Jumlah utuh';

export default function StockTransferItemPicker({
    items,
    value,
    disabled,
    error,
    inputRef,
    onChange,
    onBlur
}) {
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
            onBlur={ onBlur }
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
                            <span className="mt-1 block break-words text-sm text-slate-600">
                                Toko { formatQuantity(
                                    option.stockStore,
                                    option.baseUnitOfMeasure
                                ) } · Gudang { formatQuantity(
                                    option.stockWarehouse,
                                    option.baseUnitOfMeasure
                                ) }
                            </span>
                        </div>
                    </li>
                );
            } }
            renderInput={ params => (
                <TextField
                    { ...params }
                    required
                    label="Barang"
                    placeholder="Ketik nama atau SKU barang"
                    inputRef={ inputRef }
                    error={ !!error }
                    helperText={ error || 'Gunakan tombol panah untuk memilih, Enter untuk menetapkan, dan Escape untuk menutup.' }
                />
            ) }
        />
    );
}

StockTransferItemPicker.propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    value: PropTypes.object,
    disabled: PropTypes.bool,
    error: PropTypes.string,
    inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired
};
