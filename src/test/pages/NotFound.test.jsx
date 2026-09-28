import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NotFound from '@pages/NotFound.jsx';

describe('NotFound', () => {
    it('focuses an Indonesian heading and offers authenticated Dashboard recovery', () => {
        render(
            <MemoryRouter>
                <NotFound />
            </MemoryRouter>
        );

        const heading = screen.getByRole('heading', { name: 'Halaman tidak ditemukan' });

        expect(heading).toHaveFocus();
        expect(screen.getByRole('link', { name: /Kembali ke Dashboard/ }))
            .toHaveAttribute('href', '/dashboard');
    });
});
