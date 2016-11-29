const express = require('express');
const router = express.Router();
const httpProxy = require('http-proxy');
const url = require('url');

function getPath(protocol, hostname, port, pathname) {
    return url.format({protocol, hostname, port, pathname});
}

function createBackendProxy(pach) {
    let proxy = httpProxy.createProxyServer({
        target: pach
    });

    return proxy;
}

const apiRouter = function (config) {
    let apiPath = getPath(config.get('server:apiProtocol'), config.get('server:apiHost'),
        config.get('server:apiPort'), config.get('server:apiPrefix'));

    console.log(`Api path: ${apiPath}`);

    let apiProxyBackend = createBackendProxy(apiPath);

    return (req, res) => {
        apiProxyBackend.web(req, res);
    };
};

const printRouter = function (config) {
    let apiPath = getPath(config.get('server:printerProtocol'), config.get('server:printerHost'),
        config.get('server:printerPort'), config.get('server:printerPrefix'));

    console.log(`Print path: ${apiPath}`);

    let apiProxyBackend = createBackendProxy(apiPath);

    return (req, res) => {
        apiProxyBackend.web(req, res);
    };
};

module.exports = function (config) {
    router.all('/api/*', apiRouter(config));
    router.all('/printer/*', printRouter(config));

    return router;
};
