import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle
} from "@mui/material";
import PropTypes from "prop-types";


const propTypes = {
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string,
    confirmButtonText: PropTypes.string,
    cancelButtonText: PropTypes.string,
    children: PropTypes.node,
    maxWidth: PropTypes.string,
    isPending: PropTypes.bool,
    confirmButtonColor: PropTypes.string,
    focusCancel: PropTypes.bool
}

export default function BloomConfirmationModal(props) {
    const {
        onCancel,
        onConfirm,
        title = 'Konfirmasi',
        confirmButtonText = "Submit",
        cancelButtonText = "Batal",
        children,
        maxWidth = "xs",
        isPending = false,
        confirmButtonColor = "primary",
        focusCancel = false
    } = props;

    return (
        <Dialog
            className="bloom-confirmation-modal"
            open
            onClose={ isPending ? undefined : onCancel }
            disableEscapeKeyDown={ isPending }
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
                    disabled={ isPending }
                    autoFocus={ focusCancel }
                >
                    { cancelButtonText }
                </Button>

                <Button
                    className="bloom-confirmation-modal__actions-confirm"
                    onClick={ onConfirm }
                    variant="contained"
                    color={ confirmButtonColor }
                    disabled={ isPending }
                    aria-busy={ isPending }
                    autoFocus={ !focusCancel }
                >
                    { confirmButtonText }
                </Button>
            </DialogActions>
        </Dialog>
    )
}

BloomConfirmationModal.propTypes = propTypes;
