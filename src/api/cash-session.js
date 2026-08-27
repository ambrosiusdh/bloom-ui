import api from '@api/index.js';
import { CASH_SESSION } from '@api/path/index.js';

const getSessionHistory = (payload, options) => api({
    url: CASH_SESSION.list,
    method: 'GET',
    ...payload
}, options);

const getCurrentSession = options => api({
    url: CASH_SESSION.current,
    method: 'GET'
}, options);

const openSession = (payload, options) => api({
    url: CASH_SESSION.open,
    method: 'POST',
    data: payload?.data
}, options);

const getSessionDetails = (sessionId, options) => api({
    url: CASH_SESSION.detail(sessionId),
    method: 'GET',
    ...(options?.signal ? { signal: options.signal } : {})
}, options);

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
