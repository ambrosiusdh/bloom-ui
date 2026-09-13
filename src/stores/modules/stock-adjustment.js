import { create } from 'zustand';
import {
    createJSONStorage,
    persist
} from 'zustand/middleware';

import api from '@api/stock-adjustment.js';

const STORAGE_KEY = 'bloom-stock-adjustment-v1';
const DEFINITIVE_REJECTION_CATEGORIES = new Set([
    'validation',
    'authentication',
    'authorization',
    'not_found',
    'conflict'
]);

let latestListRequestId = 0;
let latestDetailRequestId = 0;

const initialState = {
    stockAdjustmentList: [],
    stockAdjustmentPaging: {},
    stockAdjustmentDetails: null,
    stockAdjustmentListStatus: 'idle',
    stockAdjustmentListError: null,
    stockAdjustmentDetailStatus: 'idle',
    stockAdjustmentDetailError: null,
    stockAdjustmentCreateStatus: 'idle',
    stockAdjustmentCreateError: null,
    lastCreatedStockAdjustment: null,
    stockAdjustmentAttempt: null
};

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
        } catch { /* Posting checks durability before making the request. */
        }
    },
    removeItem: key => {
        try {
            sessionStorage.removeItem(key);
        } catch { /* Retain the in-memory quarantine. */
        }
    }
};

const isDefinitiveRejection = error => {
    const status = Number(error?.status);

    return (status >= 400 && status < 500)
        || DEFINITIVE_REJECTION_CATEGORIES.has(error?.category);
};

const hasValidCreateResult = (result, payload) => {
    const adjustment = result?.adjustment;
    const movements = result?.movements;

    if (typeof adjustment?.stockAdjustmentCode !== 'string'
        || !adjustment.stockAdjustmentCode.trim()
        || !Array.isArray(adjustment.items)
        || !Array.isArray(movements)
        || adjustment.items.length !== payload.items.length
        || movements.length !== payload.items.length) {
        return false;
    }

    const requestedLines = new Map(payload.items.map(item => [item.itemSku, item]));
    const returnedLinesAreComplete = adjustment.items.every(item => {
        const requestLine = requestedLines.get(item?.item?.sku);

        return requestLine
            && item.actionType === requestLine.actionType
            && item.stockLocation === requestLine.stockLocation
            && item.changeQuantity != null
            && item.previousStock != null
            && item.newStock != null;
    });
    const returnedMovementsAreComplete = movements.every(movement =>
        movement?.id != null
        && movement?.item?.sku
        && movement.referenceNo === adjustment.stockAdjustmentCode
        && movement.location
        && movement.quantity != null
        && movement.qtyBefore != null
        && movement.qtyAfter != null);

    return returnedLinesAreComplete && returnedMovementsAreComplete;
};

const persistAttemptBeforePosting = attempt => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 0,
        state: {
            stockAdjustmentCreateStatus: 'ambiguous',
            stockAdjustmentAttempt: attempt
        }
    }));
};

const useStockAdjustmentStore = create(persist((set, get) => ({
    ...initialState,

    getStockAdjustmentList: async (params, config, options) => {
        const requestId = ++latestListRequestId;
        set({
            stockAdjustmentList: [],
            stockAdjustmentPaging: {},
            stockAdjustmentListStatus: 'loading',
            stockAdjustmentListError: null
        });

        try {
            const { data: response } = await api.getStockAdjustmentList(
                params,
                config,
                options
            );
            if (requestId === latestListRequestId && !config?.signal?.aborted) {
                const {
                    content,
                    ...paging
                } = response.data || {};
                set({
                    stockAdjustmentList: Array.isArray(content) ? content : [],
                    stockAdjustmentPaging: paging,
                    stockAdjustmentListStatus: 'ready',
                    stockAdjustmentListError: null
                });
            }
            return response;
        } catch (error) {
            if (requestId === latestListRequestId && !config?.signal?.aborted) {
                set({
                    stockAdjustmentList: [],
                    stockAdjustmentPaging: {},
                    stockAdjustmentListStatus: 'error',
                    stockAdjustmentListError: error
                });
            }
            throw error;
        }
    },

    getStockAdjustmentDetails: async (code, config, options) => {
        const requestId = ++latestDetailRequestId;
        set({
            stockAdjustmentDetails: null,
            stockAdjustmentDetailStatus: 'loading',
            stockAdjustmentDetailError: null
        });

        try {
            const { data: response } = await api.getStockAdjustmentDetails(
                code,
                config,
                options
            );
            if (requestId === latestDetailRequestId && !config?.signal?.aborted) {
                set({
                    stockAdjustmentDetails: response.data,
                    stockAdjustmentDetailStatus: 'ready',
                    stockAdjustmentDetailError: null
                });
            }
            return response;
        } catch (error) {
            if (requestId === latestDetailRequestId && !config?.signal?.aborted) {
                set({
                    stockAdjustmentDetails: null,
                    stockAdjustmentDetailStatus: 'error',
                    stockAdjustmentDetailError: error
                });
            }
            throw error;
        }
    },

    createStockAdjustment: async (payload, options) => {
        if (get().stockAdjustmentCreateStatus === 'pending'
            || get().stockAdjustmentCreateStatus === 'ambiguous'
            || get().stockAdjustmentAttempt) {
            return null;
        }

        const attempt = {
            payload
        };

        try {
            persistAttemptBeforePosting(attempt);
        } catch (error) {
            const storageError = new Error('Stock adjustment recovery storage is unavailable.');
            storageError.category = 'storage';
            storageError.cause = error;
            set({
                stockAdjustmentCreateStatus: 'storage_error',
                stockAdjustmentCreateError: storageError,
                stockAdjustmentAttempt: null
            });
            throw storageError;
        }

        set({
            stockAdjustmentCreateStatus: 'pending',
            stockAdjustmentCreateError: null,
            stockAdjustmentAttempt: attempt
        });

        try {
            const { data: response } = await api.createStockAdjustment(payload, options);
            const result = response?.data;

            if (!hasValidCreateResult(result, payload)) {
                throw new Error('Incomplete stock adjustment response');
            }

            set({
                stockAdjustmentCreateStatus: 'success',
                stockAdjustmentCreateError: null,
                lastCreatedStockAdjustment: result,
                stockAdjustmentAttempt: null
            });
            return response;
        } catch (error) {
            const definitiveRejection = isDefinitiveRejection(error);

            set({
                stockAdjustmentCreateStatus: definitiveRejection ? 'error' : 'ambiguous',
                stockAdjustmentCreateError: error,
                stockAdjustmentAttempt: definitiveRejection ? null : attempt
            });
            throw error;
        }
    },

    clearStockAdjustmentDetails: () => {
        latestDetailRequestId += 1;
        set({
            stockAdjustmentDetails: null,
            stockAdjustmentDetailStatus: 'idle',
            stockAdjustmentDetailError: null
        });
    },

    clearCreatedStockAdjustment: () => {
        if (get().stockAdjustmentAttempt) {
            return;
        }

        set({
            stockAdjustmentCreateStatus: 'idle',
            stockAdjustmentCreateError: null,
            lastCreatedStockAdjustment: null
        });
    },

    acknowledgeAmbiguousStockAdjustment: () => {
        if (get().stockAdjustmentCreateStatus !== 'ambiguous'
            || !get().stockAdjustmentAttempt) {
            return;
        }

        set({
            stockAdjustmentCreateStatus: 'idle',
            stockAdjustmentCreateError: null,
            lastCreatedStockAdjustment: null,
            stockAdjustmentAttempt: null
        });
    }
}), {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => storage),
    partialize: state => ({
        stockAdjustmentCreateStatus: state.stockAdjustmentAttempt ? 'ambiguous' : 'idle',
        stockAdjustmentAttempt: state.stockAdjustmentAttempt
    })
}));

export default useStockAdjustmentStore;
