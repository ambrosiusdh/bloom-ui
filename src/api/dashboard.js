import api from "@api/index.js";
import { DASHBOARD } from "@api/path/index.js";

const getDashboardOverview = async (options) => {
    return api({
        url: DASHBOARD.overview,
        method: 'GET'
    }, options);
}

export default {
    getDashboardOverview
}
