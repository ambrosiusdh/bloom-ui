import api from "@api/index.js";
import { AUTH } from "@api/path/index.js";

const getCurrentUser = async options => {
    return api({
        url: AUTH.currentUser,
        method: 'GET'
    }, options);
}

const doLogin = async (payload, options) => {
    return api({
        url: AUTH.login,
        method: 'POST',
        ...payload
    }, options);
}

const doLogout = async options => {
    return api({
        url: AUTH.logout,
        method: 'POST'
    }, options);
}

export default {
    getCurrentUser,
    doLogin,
    doLogout
}