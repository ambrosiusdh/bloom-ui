import api from "@api/index.js";
import { AUTH } from "@api/path/index.js";

const getCurrentUser = async () => {
    return api({
        url: AUTH.currentUser,
        method: 'GET'
    });
}

const doLogin = async payload => {
    return api({
        url: AUTH.login,
        method: 'POST',
        ...payload
    });
}

const doLogout = async () => {
    return api({
        url: AUTH.logout,
        method: 'POST'
    });
}

export default {
    getCurrentUser,
    doLogin,
    doLogout
}