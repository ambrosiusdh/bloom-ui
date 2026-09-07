export const RECEIPT_PRINT_STATUS = Object.freeze({
    IDLE: 'idle',
    PENDING: 'pending',
    SUCCESS: 'success',
    ERROR: 'error'
});

export const EMPTY_RECEIPT_PRINT_STATE = Object.freeze({
    status: RECEIPT_PRINT_STATUS.IDLE,
    error: null
});
