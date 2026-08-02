
import { render as testingLibraryRender } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import PropTypes from 'prop-types';

import { MemoryRouter } from 'react-router-dom';

import { ThemeProvider } from '@mui/material/styles';

import theme from '@/themes/index.js';

export function TestProviders({ children, initialEntries, initialIndex, snackbarProps }) {
    return (
        <ThemeProvider theme={ theme }>
            <SnackbarProvider { ...snackbarProps }>
                <MemoryRouter
                    initialEntries={ initialEntries }
                    initialIndex={ initialIndex }
                >
                    { children }
                </MemoryRouter>
            </SnackbarProvider>
        </ThemeProvider>
    );
}

TestProviders.propTypes = {
    children: PropTypes.node.isRequired,
    initialEntries: PropTypes.arrayOf(PropTypes.string).isRequired,
    initialIndex: PropTypes.number,
    snackbarProps: PropTypes.object.isRequired,
};

export function renderWithProviders(ui, options = {}) {
    const {
        route = '/',
        initialEntries = [route],
        initialIndex,
        snackbarProps = {},
        ...renderOptions
    } = options;

    return testingLibraryRender(ui, {
        wrapper: ({ children }) => (
            <TestProviders
                initialEntries={ initialEntries }
                initialIndex={ initialIndex }
                snackbarProps={ snackbarProps }
            >
                { children }
            </TestProviders>
        ),
        ...renderOptions,
    });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
