import { create } from 'zustand';
import {
    createJSONStorage,
    persist
} from 'zustand/middleware';

import { API_DOMAIN_ERROR_CODE } from '@api/error-contract.js';
import api from '@api/stock-transfer.js';
import useAuthStore from '@stores/modules/auth.js';

export const STOCK_TRANSFER_STORAGE_KEY = 'bloom-stock-transfer-v1';

export const createStockTransferState = (ownerAccountId = null) => ({
    ownerAccountId,
    stockTransferAttempt: null,
    stockTransferResult: null,
    stockTransferCreateStatus: 'idle',
    stockTransferCreateError: null,
    lastCreatedTransfer: null
});

const currentAccountId = () => {
    const auth = useAuthStore.getState();
    return auth.authStatus === 'authenticated'
        ? auth.currentUser?.accountId || null
        : null;
};

export const canUseStockTransfer = state => !!currentAccountId()
    && state.ownerAccountId === currentAccountId();

export const isStockTransferLocked = state => state.stockTransferCreateStatus === 'pending'
    || !!state.stockTransferAttempt
    || !!state.stockTransferResult;

const storage = {
    getItem: key => {
        try {
            return sessionStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            sessionStorage.setItem(key, value);
        } catch {
            // Submission performs a strict durability check before posting.
        }
    },
    removeItem: key => {
        try {
            sessionStorage.removeItem(key);
        } catch {
            // Keep the in-memory recovery state when storage is unavailable.
        }
    }
};

const createRequestKey = () => {
    const identifier = globalThis.crypto?.randomUUID?.()
        || `${ Date.now() }-${ Math.random().toString(16).slice(2) }`;

    return `stock-transfer-${ identifier }`;
};

const normalizeDecimal = value => {
    const [rawInteger = '0', rawFraction = ''] = String(value ?? '')
        .trim()
        .replace(',', '.')
        .split('.');
    const integer = rawInteger.replace(/^0+(?=\d)/, '') || '0';
    const fraction = rawFraction.replace(/0+$/, '');

    return fraction ? `${ integer }.${ fraction }` : integer;
};

const normalizeDescription = value => String(value ?? '').trim();

const hasValidResult = (result, attempt) => {
    const request = attempt.request;
    const requestLine = request.lines?.[0];
    const resultLine = result?.lines?.[0];

    return result?.id != null
        && typeof result.code === 'string'
        && !!result.code.trim()
        && result.requestKey === attempt.key
        && result.sourceLocation === request.sourceLocation
        && result.destinationLocation === request.destinationLocation
        && normalizeDescription(result.description) === normalizeDescription(request.description)
        && Array.isArray(result.lines)
        && result.lines.length === 1
        && resultLine?.itemSku === requestLine?.itemSku
        && resultLine?.unitOfMeasure === requestLine?.unitOfMeasure
        && normalizeDecimal(resultLine?.quantity) === normalizeDecimal(requestLine?.quantity);
};

const persistAttemptBeforePosting = (ownerAccountId, attempt) => {
    sessionStorage.setItem(STOCK_TRANSFER_STORAGE_KEY, JSON.stringify({
        version: 0,
        state: {
            ownerAccountId,
            stockTransferAttempt: attempt,
            stockTransferResult: null,
            stockTransferCreateStatus: 'uncertain',
            stockTransferCreateError: null,
            lastCreatedTransfer: null
        }
    }));
};

const isKeyConflict = error => error?.domainCode
    === API_DOMAIN_ERROR_CODE.STOCK_TRANSFER_IDEMPOTENCY_CONFLICT
    || error?.status === 409;

const isDefinitiveRejection = error => !isKeyConflict(error)
    && ([400, 404, 422].includes(error?.status)
        || ['validation', 'not_found'].includes(error?.category));

const useStockTransferStore = create(persist((set, get) => ({
    ...createStockTransferState(),

    selectStockTransfer: () => {
        const accountId = currentAccountId();
        const state = get();

        if (accountId && !state.stockTransferAttempt && !state.stockTransferResult
            && state.stockTransferCreateStatus !== 'pending') {
            set(createStockTransferState(accountId));
        }
    },

    createStockTransfer: async (payload, options) => {
        const state = get();
        if (!canUseStockTransfer(state)
            || state.stockTransferCreateStatus === 'pending'
            || state.stockTransferResult
            || state.stockTransferCreateStatus === 'key_conflict') {
            return null;
        }

        const ownerAccountId = state.ownerAccountId;
        const attempt = state.stockTransferAttempt || {
            ownerAccountId,
            key: createRequestKey(),
            request: payload?.data
        };

        if (!attempt.request || attempt.ownerAccountId !== ownerAccountId) {
            return null;
        }

        try {
            persistAttemptBeforePosting(ownerAccountId, attempt);
        } catch (error) {
            const storageError = new Error('Stock transfer recovery storage is unavailable.');
            storageError.category = 'storage';
            storageError.cause = error;
            set({
                stockTransferAttempt: null,
                stockTransferCreateStatus: 'storage_error',
                stockTransferCreateError: storageError
            });
            throw storageError;
        }

        set({
            stockTransferAttempt: attempt,
            stockTransferCreateStatus: 'pending',
            stockTransferCreateError: null
        });

        try {
            const { data: response } = await api.createStockTransfer(
                { data: attempt.request },
                attempt.key,
                options
            );
            const result = response?.data;

            if (!hasValidResult(result, attempt)) {
                throw new Error('Incomplete stock transfer response');
            }
            if (get().ownerAccountId !== ownerAccountId) {
                throw new Error('Stock transfer recovery owner changed');
            }

            set({
                stockTransferAttempt: null,
                stockTransferResult: result,
                stockTransferCreateStatus: 'success',
                stockTransferCreateError: null,
                lastCreatedTransfer: result
            });
            return response;
        } catch (error) {
            const keyConflict = isKeyConflict(error);
            const definitiveRejection = isDefinitiveRejection(error);

            set({
                stockTransferAttempt: definitiveRejection ? null : attempt,
                stockTransferCreateStatus: keyConflict
                    ? 'key_conflict'
                    : definitiveRejection ? 'error' : 'uncertain',
                stockTransferCreateError: error
            });
            throw error;
        }
    },

    beginNewStockTransfer: () => {
        if (canUseStockTransfer(get())
            && get().stockTransferResult
            && get().stockTransferCreateStatus !== 'pending') {
            set(createStockTransferState(get().ownerAccountId));
        }
    },

    clearLastCreatedTransfer: () => {
        if (!get().stockTransferAttempt && get().stockTransferCreateStatus !== 'pending') {
            set({
                stockTransferResult: null,
                stockTransferCreateStatus: 'idle',
                stockTransferCreateError: null,
                lastCreatedTransfer: null
            });
        }
    }
}), {
    name: STOCK_TRANSFER_STORAGE_KEY,
    storage: createJSONStorage(() => storage),
    partialize: state => ({
        ownerAccountId: state.ownerAccountId,
        stockTransferAttempt: state.stockTransferAttempt,
        stockTransferResult: state.stockTransferResult,
        stockTransferCreateStatus: state.stockTransferAttempt
            ? state.stockTransferCreateStatus === 'key_conflict'
                ? 'key_conflict' : 'uncertain'
            : state.stockTransferResult ? 'success' : 'idle',
        stockTransferCreateError: null,
        lastCreatedTransfer: state.stockTransferResult
    })
}));

export default useStockTransferStore;
