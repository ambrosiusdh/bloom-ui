import PropTypes from "prop-types";

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle
} from "@mui/material";

const propTypes = {
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string,
    confirmButtonText: PropTypes.string,
    cancelButtonText: PropTypes.string,
    children: PropTypes.element,
    maxWidth: PropTypes.string
}

export function BloomConfirmationModal(props) {
    const {
        onCancel,
        onConfirm,
        title = 'Konfirmasi',
        confirmButtonText = "Submit",
        cancelButtonText = "Batal",
        children,
        maxWidth = "xs"
    } = props;

    return (
        <Dialog
            className="bloom-confirmation-modal"
            open
            onClose={ onCancel }
            maxWidth={ maxWidth }
            fullWidth
        >
            <DialogTitle className="bloom-confirmation-modal__title font-bold">
                { title }
            </DialogTitle>

            <DialogContent className="bloom-confirmation-modal__content">
                { children || 'Apa kamu yakin?' }
            </DialogContent>

            <DialogActions className="bloom-confirmation-modal__actions">
                <Button
                    className="bloom-confirmation-modal__actions-cancel"
                    onClick={ onCancel }
                    variant="text"
                >
                    { cancelButtonText }
                </Button>

                <Button
                    className="bloom-confirmation-modal__actions-confirm"
                    onClick={ onConfirm }
                    variant="contained"
                    autoFocus
                >
                    { confirmButtonText }
                </Button>
            </DialogActions>
        </Dialog>
    )
}

BloomConfirmationModal.propTypes = propTypes;