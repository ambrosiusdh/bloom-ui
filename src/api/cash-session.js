import api from '@api/index.js';
import { CASH_SESSION } from '@api/path/index.js';

const getSessionHistory = (payload, options) => api({
    url: CASH_SESSION.list,
    method: 'GET',
    ...payload
}, options);

const getCurrentSession = options => api({
    url: CASH_SESSION.current,
    method: 'GET',
    ...(options?.timeout ? { timeout: options.timeout } : {})
}, options);

const openSession = (payload, options) => api({
    url: CASH_SESSION.open,
    method: 'POST',
    data: payload?.data
}, options);

const getSessionDetails = (sessionId, configOrOptions, options) => {
    const { useLoader, timeout, signal } = configOrOptions || {};

    return api({
        url: CASH_SESSION.detail(sessionId),
        method: 'GET',
        ...(timeout ? { timeout } : {}),
        ...(signal ? { signal } : {})
    }, options ?? (useLoader === undefined ? undefined : { useLoader }));
};

const getExpectedCash = (sessionId, options) => api({
    url: CASH_SESSION.expectedCash(sessionId),
    method: 'GET'
}, options);

const closeSession = (sessionId, payload, options) => api({
    url: CASH_SESSION.close(sessionId),
    method: 'POST',
    data: payload?.data
}, options);

export default {
    getSessionHistory,
    getCurrentSession,
    openSession,
    getSessionDetails,
    getExpectedCash,
    closeSession
};
