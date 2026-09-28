import { useState } from 'react';
import {
    Button,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Typography
} from '@mui/material';
import {
    CheckIcon,
    MonitorIcon,
    MoonIcon,
    SunIcon
} from 'lucide-react';

import { useAppearance } from '@/themes/AppearanceProvider.jsx';

const appearanceOptions = [
    {
        value: 'light',
        label: 'Terang',
        description: 'Default Bloom untuk perangkat ini.',
        icon: SunIcon
    },
    {
        value: 'dark',
        label: 'Gelap',
        description: 'Nyaman untuk ruangan redup.',
        icon: MoonIcon
    },
    {
        value: 'system',
        label: 'Ikuti sistem',
        description: 'Mengikuti perubahan tampilan perangkat.',
        icon: MonitorIcon
    }
];

export default function AppearanceControl() {
    const [anchorElement, setAnchorElement] = useState(null);
    const {
        preference,
        resolvedAppearance,
        setPreference
    } = useAppearance();
    const isOpen = Boolean(anchorElement);
    const selectedOption = appearanceOptions.find(option => option.value === preference)
        || appearanceOptions[0];
    const ResolvedIcon = resolvedAppearance === 'dark' ? MoonIcon : SunIcon;

    const handleOpen = event => {
        setAnchorElement(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorElement(null);
    };

    const handleSelect = nextPreference => {
        setPreference(nextPreference);
        handleClose();
    };

    return (
        <div className="bloom-appearance-control">
            <Button
                id="bloom-appearance-button"
                className="bloom-appearance-control__button"
                aria-controls={ isOpen ? 'bloom-appearance-menu' : undefined }
                aria-expanded={ isOpen ? 'true' : undefined }
                aria-haspopup="menu"
                aria-label={ `Tampilan aplikasi: ${selectedOption.label}` }
                startIcon={ <ResolvedIcon aria-hidden="true" /> }
                onClick={ handleOpen }
            >
                <span className="bloom-appearance-control__label">
                    Tampilan: { selectedOption.label }
                </span>
            </Button>

            <Menu
                id="bloom-appearance-menu"
                anchorEl={ anchorElement }
                open={ isOpen }
                MenuListProps={ {
                    'aria-label': 'Pilihan tampilan aplikasi',
                    'aria-labelledby': 'bloom-appearance-button',
                    role: 'radiogroup'
                } }
                slotProps={ {
                    paper: {
                        className: 'bloom-appearance-control__menu'
                    }
                } }
                onClose={ handleClose }
            >
                { appearanceOptions.map(option => {
                    const Icon = option.icon;
                    const isSelected = option.value === preference;

                    return (
                        <MenuItem
                            key={ option.value }
                            className="bloom-appearance-control__option"
                            role="radio"
                            aria-checked={ isSelected }
                            selected={ isSelected }
                            onClick={ () => handleSelect(option.value) }
                        >
                            <ListItemIcon>
                                <Icon aria-hidden="true" />
                            </ListItemIcon>
                            <ListItemText
                                primary={ option.label }
                                secondary={ option.value === 'system'
                                    ? `${option.description} Saat ini ${resolvedAppearance === 'dark' ? 'Gelap' : 'Terang'}.`
                                    : option.description }
                            />
                            { isSelected && <CheckIcon aria-hidden="true" /> }
                        </MenuItem>
                    );
                }) }

                <Typography
                    className="bloom-appearance-control__policy"
                    component="p"
                    variant="caption"
                >
                    Pilihan disimpan hanya di browser/perangkat ini. Tidak mengubah akun, data,
                    transaksi, atau aturan backend.
                </Typography>
            </Menu>
        </div>
    );
}
