import { createTheme } from '@mui/material/styles';

export const APPEARANCE_PREFERENCES = ['light', 'dark', 'system'];
export const APPEARANCE_STORAGE_KEY = 'bloom.appearance';
export const DEFAULT_APPEARANCE_PREFERENCE = 'light';
export const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

const sharedTokens = {
    sidebar: '#0d244f',
    sidebarHover: '#17386f',
    sidebarText: '#f7faff',
    sidebarMuted: '#c9d6ea'
};

export const appearanceTokens = {
    light: {
        background: '#f3f6fb',
        surface: '#ffffff',
        surfaceSoft: '#f7f9fc',
        text: '#15233a',
        muted: '#53637a',
        border: '#d6deea',
        borderStrong: '#b9c5d6',
        primary: '#2563eb',
        primaryStrong: '#1d4ed8',
        primarySoft: '#e6efff',
        primarySoftText: '#153d91',
        onPrimary: '#ffffff',
        success: '#18794e',
        successSoft: '#e8f7ef',
        warning: '#935b00',
        warningSoft: '#fff5d8',
        danger: '#b42318',
        dangerSoft: '#fff0ee',
        focus: '#9a4d00',
        ...sharedTokens
    },
    dark: {
        background: '#0a1220',
        surface: '#111c2f',
        surfaceSoft: '#17243a',
        text: '#f5f8ff',
        muted: '#b5c1d3',
        border: '#2d3b52',
        borderStrong: '#4a5b73',
        primary: '#6f9cff',
        primaryStrong: '#8bb0ff',
        primarySoft: '#173463',
        primarySoftText: '#f2f6ff',
        onPrimary: '#08152f',
        success: '#6ee7b7',
        successSoft: '#123b32',
        warning: '#ffd166',
        warningSoft: '#463516',
        danger: '#ff9b92',
        dangerSoft: '#48221f',
        focus: '#fbbf24',
        sidebar: '#07152e',
        sidebarHover: '#12305f',
        sidebarText: '#f7faff',
        sidebarMuted: '#bdcbe0'
    }
};

export const normalizeAppearancePreference = preference =>
    APPEARANCE_PREFERENCES.includes(preference)
        ? preference
        : DEFAULT_APPEARANCE_PREFERENCE;

export const resolveAppearance = (preference, systemPrefersDark = false) => {
    const normalizedPreference = normalizeAppearancePreference(preference);

    if (normalizedPreference === 'system') {
        return systemPrefersDark ? 'dark' : 'light';
    }

    return normalizedPreference;
};

export const readAppearancePreference = storage => {
    if (!storage) {
        return DEFAULT_APPEARANCE_PREFERENCE;
    }

    try {
        return normalizeAppearancePreference(storage.getItem(APPEARANCE_STORAGE_KEY));
    } catch {
        return DEFAULT_APPEARANCE_PREFERENCE;
    }
};

export const persistAppearancePreference = (storage, preference) => {
    if (!storage) {
        return;
    }

    try {
        storage.setItem(
            APPEARANCE_STORAGE_KEY,
            normalizeAppearancePreference(preference)
        );
    } catch {
        // Appearance remains available for this page when storage is unavailable.
    }
};

export const applyAppearanceToDocument = (documentElement, preference, systemPrefersDark) => {
    if (!documentElement) {
        return resolveAppearance(preference, systemPrefersDark);
    }

    const normalizedPreference = normalizeAppearancePreference(preference);
    const resolvedAppearance = resolveAppearance(normalizedPreference, systemPrefersDark);

    documentElement.classList.toggle('dark', resolvedAppearance === 'dark');
    documentElement.dataset.appearancePreference = normalizedPreference;
    documentElement.dataset.appearance = resolvedAppearance;
    documentElement.style.colorScheme = resolvedAppearance;

    return resolvedAppearance;
};

const createSemanticStates = tokens => ({
    normal: {
        foreground: tokens.text,
        background: tokens.surface,
        border: tokens.border
    },
    selected: {
        foreground: tokens.primarySoftText,
        background: tokens.primarySoft,
        border: tokens.primary
    },
    focus: {
        foreground: tokens.text,
        background: tokens.surface,
        border: tokens.focus
    },
    success: {
        foreground: tokens.success,
        background: tokens.successSoft,
        border: tokens.success
    },
    warning: {
        foreground: tokens.warning,
        background: tokens.warningSoft,
        border: tokens.warning
    },
    error: {
        foreground: tokens.danger,
        background: tokens.dangerSoft,
        border: tokens.danger
    },
    rejected: {
        foreground: tokens.danger,
        background: tokens.dangerSoft,
        border: tokens.danger
    },
    pending: {
        foreground: tokens.primarySoftText,
        background: tokens.primarySoft,
        border: tokens.primary
    },
    disabled: {
        foreground: tokens.muted,
        background: tokens.surfaceSoft,
        border: tokens.border,
        opacity: 0.56
    }
});

export const createBloomTheme = mode => {
    const resolvedMode = mode === 'dark' ? 'dark' : 'light';
    const tokens = appearanceTokens[resolvedMode];
    const semanticStates = createSemanticStates(tokens);

    return createTheme({
        palette: {
            mode: resolvedMode,
            primary: {
                main: tokens.primary,
                dark: tokens.primaryStrong,
                light: tokens.primarySoft,
                contrastText: tokens.onPrimary
            },
            success: {
                main: tokens.success,
                light: tokens.successSoft
            },
            warning: {
                main: tokens.warning,
                light: tokens.warningSoft
            },
            error: {
                main: tokens.danger,
                light: tokens.dangerSoft
            },
            info: {
                main: tokens.primary,
                light: tokens.primarySoft
            },
            background: {
                default: tokens.background,
                paper: tokens.surface
            },
            text: {
                primary: tokens.text,
                secondary: tokens.muted
            },
            divider: tokens.border,
            action: {
                active: tokens.text,
                hover: tokens.surfaceSoft,
                selected: tokens.primarySoft,
                disabled: tokens.muted,
                disabledBackground: tokens.surfaceSoft,
                disabledOpacity: semanticStates.disabled.opacity
            }
        },
        typography: {
            fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 16
        },
        bloom: {
            tokens,
            states: semanticStates
        },
        components: {
            MuiAlert: {
                styleOverrides: {
                    root: {
                        border: '1px solid currentColor'
                    }
                }
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        minHeight: 44,
                        textTransform: 'none',
                        '&:focus-visible': {
                            outline: `3px solid ${ tokens.focus }`,
                            outlineOffset: 2
                        }
                    }
                }
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        minWidth: 44,
                        minHeight: 44,
                        '&:focus-visible': {
                            outline: `3px solid ${ tokens.focus }`,
                            outlineOffset: 2
                        }
                    }
                }
            },
            MuiMenuItem: {
                styleOverrides: {
                    root: {
                        minHeight: 44,
                        '&.Mui-selected': {
                            color: tokens.primarySoftText,
                            backgroundColor: tokens.primarySoft,
                            borderColor: tokens.primary
                        },
                        '&:focus-visible': {
                            outline: `3px solid ${ tokens.focus }`,
                            outlineOffset: -3
                        }
                    }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none'
                    }
                }
            }
        }
    });
};

export const bloomThemes = {
    light: createBloomTheme('light'),
    dark: createBloomTheme('dark')
};

export const getBloomTheme = mode =>
    bloomThemes[mode === 'dark' ? 'dark' : 'light'];

const theme = getBloomTheme(DEFAULT_APPEARANCE_PREFERENCE);

export default theme;
