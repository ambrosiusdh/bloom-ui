import { useState } from 'react';

import userEvent from '@testing-library/user-event';
import PropTypes from 'prop-types';
import { describe, expect, it, vi } from 'vitest';

import { Route, Routes, useNavigate } from 'react-router-dom';

import { Button } from '@mui/material';

import BloomConfirmationModal from '@/components/_ui/BloomConfirmationModal.jsx';
import { render, screen } from '@/test/render.jsx';

function ConfirmationFlow({ save }) {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleConfirm = async () => {
        await save();
        navigate('/complete');
    };

    return (
        <>
            <Button onClick={ () => setIsOpen(true) }>
                Review sale
            </Button>

            { isOpen && (
                <BloomConfirmationModal
                    confirmButtonText="Confirm"
                    onCancel={ () => setIsOpen(false) }
                    onConfirm={ handleConfirm }
                    title="Confirm sale"
                >
                    Save this sale?
                </BloomConfirmationModal>
            ) }
        </>
    );
}

ConfirmationFlow.propTypes = {
    save: PropTypes.func.isRequired,
};

function CompletionScreen() {
    return <p>Sale completed</p>;
}

describe('renderWithProviders', () => {
    it('handles an async confirmation dialog with keyboard navigation and routing', async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const user = userEvent.setup();

        render(
            <Routes>
                <Route path="/" element={ <ConfirmationFlow save={ save } /> } />
                <Route path="/complete" element={ <CompletionScreen /> } />
            </Routes>
        );

        await user.click(screen.getByRole('button', { name: 'Review sale' }));
        expect(await screen.findByRole('dialog', { name: 'Confirm sale' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();

        await user.keyboard('{Enter}');

        expect(save).toHaveBeenCalledTimes(1);
        expect(await screen.findByText('Sale completed')).toBeInTheDocument();
    });
});
