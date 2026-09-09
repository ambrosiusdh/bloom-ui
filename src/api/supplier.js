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

const getSupplierOutstandingBalance = (code, configOrOptions, options) => {
    const request = getReadRequestArguments(configOrOptions, options);

    return api({
        url: SUPPLIER.outstandingBalance(code),
        method: 'GET',
        ...request.config
    }, request.options);
};

const createSupplier = (payload, options) => api({
    url: SUPPLIER.create,
    method: 'POST',
    ...payload
}, options);

const updateSupplier = (code, payload, options) => api({
    url: SUPPLIER.update(code),
    method: 'PUT',
    ...payload
}, options);

const setSupplierActive = (code, active, options) => api({
    url: SUPPLIER.activation(code),
    method: 'PATCH',
    data: { active }
}, options);

export default {
    getSupplierList,
    getSupplierDetails,
    getSupplierOutstandingBalance,
    createSupplier,
    updateSupplier,
    setSupplierActive
};
