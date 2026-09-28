import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';

import {
    APPEARANCE_STORAGE_KEY,
    SYSTEM_DARK_QUERY,
    applyAppearanceToDocument,
    getBloomTheme,
    normalizeAppearancePreference,
    persistAppearancePreference,
    readAppearancePreference,
    resolveAppearance
} from '@/themes/index.js';

const AppearanceContext = createContext({
    preference: 'light',
    resolvedAppearance: 'light',
    setPreference: () => {}
});

const getMediaQuery = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return null;
    }

    return window.matchMedia(SYSTEM_DARK_QUERY);
};

const getStorage = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

const getInitialPreference = () => {
    return readAppearancePreference(getStorage());
};

const getInitialSystemPreference = () => getMediaQuery()?.matches === true;

export function AppearanceProvider({ children }) {
    const [preference, setPreferenceState] = useState(getInitialPreference);
    const [systemPrefersDark, setSystemPrefersDark] = useState(getInitialSystemPreference);
    const resolvedAppearance = resolveAppearance(preference, systemPrefersDark);
    const theme = useMemo(
        () => getBloomTheme(resolvedAppearance),
        [resolvedAppearance]
    );

    const setPreference = nextPreference => {
        const normalizedPreference = normalizeAppearancePreference(nextPreference);

        persistAppearancePreference(getStorage(), normalizedPreference);
        applyAppearanceToDocument(
            document.documentElement,
            normalizedPreference,
            getMediaQuery()?.matches === true
        );
        setPreferenceState(normalizedPreference);
    };

    useEffect(() => {
        const mediaQuery = getMediaQuery();

        if (!mediaQuery) {
            return undefined;
        }

        const handleSystemAppearanceChange = event => {
            setSystemPrefersDark(event.matches);
        };

        mediaQuery.addEventListener?.('change', handleSystemAppearanceChange);

        return () => {
            mediaQuery.removeEventListener?.('change', handleSystemAppearanceChange);
        };
    }, []);

    useEffect(() => {
        applyAppearanceToDocument(
            document.documentElement,
            preference,
            systemPrefersDark
        );
    }, [preference, systemPrefersDark]);

    useEffect(() => {
        const handleStorageChange = event => {
            if (event.key !== APPEARANCE_STORAGE_KEY) {
                return;
            }

            setPreferenceState(normalizeAppearancePreference(event.newValue));
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const contextValue = useMemo(() => ({
        preference,
        resolvedAppearance,
        setPreference
    }), [preference, resolvedAppearance]);

    return (
        <AppearanceContext.Provider value={ contextValue }>
            <ThemeProvider theme={ theme }>
                { children }
            </ThemeProvider>
        </AppearanceContext.Provider>
    );
}

AppearanceProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export const useAppearance = () => useContext(AppearanceContext);
