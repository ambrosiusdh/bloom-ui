import { readFileSync } from 'node:fs';

import { act } from 'react';
import { useTheme } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import AppearanceControl from '@/components/app/AppearanceControl.jsx';
import { AppearanceProvider } from '@/themes/AppearanceProvider.jsx';
import {
    APPEARANCE_STORAGE_KEY,
    appearanceTokens,
    createBloomTheme,
    readAppearancePreference,
    resolveAppearance
} from '@/themes/index.js';

const semanticStateNames = [
    'normal',
    'selected',
    'focus',
    'success',
    'warning',
    'error',
    'rejected',
    'pending',
    'disabled'
];

function ThemeProbe() {
    const theme = useTheme();

    return <output aria-label="Mode tema">{ theme.palette.mode }</output>;
}

describe('Bloom appearance foundation', () => {
    let mediaQuery;
    let systemListeners;
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.classList.remove('dark');
        document.documentElement.dataset.appearance = 'light';
        document.documentElement.dataset.appearancePreference = 'light';
        document.documentElement.style.colorScheme = 'light';

        systemListeners = new Set();
        mediaQuery = {
            matches: true,
            media: '(prefers-color-scheme: dark)',
            onchange: null,
            addEventListener: vi.fn((eventName, listener) => {
                if (eventName === 'change') {
                    systemListeners.add(listener);
                }
            }),
            removeEventListener: vi.fn((eventName, listener) => {
                if (eventName === 'change') {
                    systemListeners.delete(listener);
                }
            }),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn()
        };
        window.matchMedia = vi.fn().mockReturnValue(mediaQuery);
    });

    afterEach(() => {
        window.localStorage.clear();
        document.documentElement.classList.remove('dark');
        document.documentElement.dataset.appearance = 'light';
        document.documentElement.dataset.appearancePreference = 'light';
        document.documentElement.style.colorScheme = 'light';
        window.matchMedia = originalMatchMedia;
        vi.clearAllMocks();
    });

    it('uses light on first use even when the device currently prefers dark', () => {
        render(
            <AppearanceProvider>
                <AppearanceControl />
                <ThemeProbe />
            </AppearanceProvider>
        );

        expect(screen.getByRole('button', { name: 'Tampilan aplikasi: Terang' })).toBeInTheDocument();
        expect(screen.getByRole('status', { name: 'Mode tema' })).toHaveTextContent('light');
        expect(document.documentElement).toHaveAttribute('data-appearance', 'light');
        expect(document.documentElement).not.toHaveClass('dark');
        expect(window.localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBeNull();
    });

    it('persists all three explicit choices and follows later system changes', async () => {
        const user = userEvent.setup();

        render(
            <AppearanceProvider>
                <AppearanceControl />
                <ThemeProbe />
            </AppearanceProvider>
        );

        await user.click(screen.getByRole('button', { name: 'Tampilan aplikasi: Terang' }));
        await user.click(screen.getByRole('radio', { name: /^Gelap/ }));

        expect(window.localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('dark');
        expect(document.documentElement).toHaveClass('dark');
        expect(screen.getByRole('status', { name: 'Mode tema' })).toHaveTextContent('dark');

        await user.click(screen.getByRole('button', { name: 'Tampilan aplikasi: Gelap' }));
        await user.click(screen.getByRole('radio', { name: /^Ikuti sistem/ }));

        expect(window.localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('system');
        expect(document.documentElement).toHaveAttribute('data-appearance-preference', 'system');
        expect(document.documentElement).toHaveClass('dark');

        act(() => {
            mediaQuery.matches = false;
            systemListeners.forEach(listener => listener({ matches: false }));
        });

        await waitFor(() => {
            expect(document.documentElement).not.toHaveClass('dark');
        });
        expect(document.documentElement).toHaveAttribute('data-appearance', 'light');
        expect(screen.getByRole('status', { name: 'Mode tema' })).toHaveTextContent('light');
        expect(screen.getByRole('button', { name: 'Tampilan aplikasi: Ikuti sistem' })).toBeInTheDocument();
    });

    it('normalizes invalid storage and resolves system preference without changing the default', () => {
        window.localStorage.setItem(APPEARANCE_STORAGE_KEY, 'sepia');

        expect(readAppearancePreference(window.localStorage)).toBe('light');
        expect(resolveAppearance(undefined, true)).toBe('light');
        expect(resolveAppearance('system', true)).toBe('dark');
        expect(resolveAppearance('system', false)).toBe('light');
    });

    it('keeps semantic state tokens complete in both appearances', () => {
        const lightTheme = createBloomTheme('light');
        const darkTheme = createBloomTheme('dark');

        expect(lightTheme.palette.primary.main).toBe(appearanceTokens.light.primary);
        expect(darkTheme.palette.primary.main).toBe(appearanceTokens.dark.primary);
        expect(Object.keys(lightTheme.bloom.states)).toEqual(semanticStateNames);
        expect(Object.keys(darkTheme.bloom.states)).toEqual(semanticStateNames);

        semanticStateNames.forEach(stateName => {
            expect(lightTheme.bloom.states[stateName]).toMatchObject({
                foreground: expect.any(String),
                background: expect.any(String),
                border: expect.any(String)
            });
            expect(darkTheme.bloom.states[stateName]).toMatchObject({
                foreground: expect.any(String),
                background: expect.any(String),
                border: expect.any(String)
            });
        });
    });

    it('resolves the saved or system preference before the application module', () => {
        const documentSource = readFileSync('index.html', 'utf8');
        const resolverPosition = documentSource.indexOf("const storageKey = 'bloom.appearance'");
        const applicationPosition = documentSource.indexOf('/src/main.jsx');

        expect(resolverPosition).toBeGreaterThan(-1);
        expect(resolverPosition).toBeLessThan(applicationPosition);
        expect(documentSource).toContain("window.matchMedia?.('(prefers-color-scheme: dark)')");
        expect(documentSource).toContain("let preference = 'light'");
    });
});
