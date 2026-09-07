import api from '@api/index.js';
import { SUPPLIER } from '@api/path/index.js';

const getReadRequestArguments = (configOrOptions = {}, options) => {
    const { useLoader, ...config } = configOrOptions || {};

    return {
        config,
        options: options ?? (useLoader === undefined ? undefined : { useLoader })
    };
};

const getSupplierList = (config, options) => api({
    url: SUPPLIER.list,
    method: 'GET',
    ...config
}, options);

const getSupplierDetails = (code, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);

    return api({
        url: SUPPLIER.detail(code),
        method: 'GET',
        ...request.config
    }, request.options);
};

export default {
    getSupplierList,
    getSupplierDetails
};
