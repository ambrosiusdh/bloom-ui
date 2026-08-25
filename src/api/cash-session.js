import api from '@api/index.js';
import { CASH_SESSION } from '@api/path/index.js';

const getCurrentSession = options => api({
    url: CASH_SESSION.current,
    method: 'GET'
}, options);

const openSession = (payload, options) => api({
    url: CASH_SESSION.open,
    method: 'POST',
    data: payload?.data
}, options);

export default {
    getCurrentSession,
    openSession
};
