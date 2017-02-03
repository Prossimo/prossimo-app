const express = require('express');
const router = express.Router();
const httpProxy = require('http-proxy');
const url = require('url');

function getPath(protocol, hostname, port, pathname) {
    return url.format({protocol, hostname, port, pathname});
}

function createBackendProxy(pach) {
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

        console.log('Error in proxy pass: ', err);
        console.log(`${pach}${req.url}: ${JSON.stringify(req.body, true, 2)}`);

        res.end('Something went wrong. Check availability server api.');
    });

    proxy.on('proxyReq', function (proxyReq, req, res) {
        // This is necessary for correct delivery body
        if (req.method === 'POST' && req.body) {
            proxyReq.write(JSON.stringify(req.body));
        }

        console.log(`${proxyReq.path}: ${JSON.stringify(proxyReq._headers, true, 2)}`);
    });

    proxy.on('proxyRes', function (proxyRes, req, res) {
        console.log(`RAW Response from the target ${pach}${req.path} `, JSON.stringify(proxyRes.headers, true, 2));
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
