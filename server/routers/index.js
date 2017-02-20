const express = require('express');
const router = express.Router();
const httpProxy = require('http-proxy');
const url = require('url');
const util = require('util');

function inspect(object) {
    return util.inspect(object, {showHidden: false, depth: 5, colors: false});
}

function getPath(protocol, hostname, port, pathname) {
    return url.format({protocol, hostname, port, pathname});
}

function createBackendProxy(pach, log) {
    let proxy = httpProxy.createProxyServer({
        target: pach,
        xfwd: false,
        changeOrigin: true,
        cookieDomainRewrite: {
            '*': ''
        }
    });

    proxy.on('error', function (err, req, res) {
        res.writeHead(500, {
            'Content-Type': 'text/plain'
        });

        log.error('Error in proxy pass: ', err);
        log.error(`${pach}${req.url}: ${inspect(req.body)}`);

        res.end('Something went wrong. Check availability server api.');
    });

    proxy.on('proxyReq', function (proxyReq, req) {
        let origin = getPath(req.protocol, req.client.address().address, req.client.address().port, req.originalUrl);
        // This is necessary for correct delivery body
        if (/PUT|POST|DELETE|PATCH|OPTIONS/.test(req.method) && req.body) {
            proxyReq.write(JSON.stringify(req.body));
        }

        log.info(`Proxy request:\n ${inspect({
            method: req.method,
            origin,
            referer: `${pach}${req.path}`,
            body: req.body
        })}`);
    });

    proxy.on('proxyRes', function (proxyRes, req) {
        log.debug(`Proxy ${pach}${req.path} response:\n ${inspect(proxyRes.headers)}`);
    });

    return proxy;
}

const apiRouter = function (config, log) {
    let apiPath = getPath(config.get('server:apiProtocol'), config.get('server:apiHost'),
        config.get('server:apiPort'), config.get('server:apiPrefix'));

    log.info(`Api request path: ${apiPath}`);

    let apiProxyBackend = createBackendProxy(apiPath, log);

    return (req, res) => {
        apiProxyBackend.web(req, res);
    };
};

const printRouter = function (config, log) {
    let apiPath = getPath(config.get('server:printerProtocol'), config.get('server:printerHost'),
        config.get('server:printerPort'), config.get('server:printerPrefix'));

    log.info(`Api print path: ${apiPath}`);

    let apiProxyBackend = createBackendProxy(apiPath, log);

    return (req, res) => {
        apiProxyBackend.web(req, res);
    };
};

module.exports = function (config, log) {
    router.all('/api/*', apiRouter(config, log));
    router.all('/printer/*', printRouter(config, log));

    return router;
};
