const path = require('path');
const packageInfo = require('../../package.json');

module.exports = {
    version: packageInfo.version,
    title: packageInfo.title,
    release: false,
    verbose: false,
    app: {
        assetsPath: path.resolve(__dirname, '../../assets'),
        srcPath: path.resolve(__dirname, '../../src'),
        webLoaders: path.resolve(__dirname, '../web_loaders'),
        devtool: 'cheap-module-eval-source-map',
        apiPrefix: '/api',
        printerPrefix: '/print',
        invoiceUrl: '/invoice/',
    },
    dist: {
        path: path.resolve(__dirname, '../../dist'),
        devtool: '',
    },
    log: {
        dev: {
            replaceConsole: true,
            level: 'info',
            usefiles: false,
            files: [{
                type: 'file',
                filename: 'log/app-dev.log',
                maxLogSize: 10485760,
                numBackups: 3,
            }, {
                type: 'file',
                filename: 'log/api-dev.log',
                maxLogSize: 10485760,
                numBackups: 3,
                category: 'api',
            }],
            console: true,
        },
        prod: {
            replaceConsole: true,
            level: 'info',
            usefiles: false,
            files: [{
                type: 'file',
                filename: 'log/app-prod.log',
                maxLogSize: 10485760,
                numBackups: 3,
            }, {
                type: 'file',
                filename: 'log/api-prod.log',
                maxLogSize: 10485760,
                numBackups: 3,
                category: 'api',
            }],
            console: false,
        },
    },
    server: {
        port: '9987',
        host: '127.0.0.1',
        apiProtocol: 'http',
        apiHost: 'prossimo.local',
        apiPort: '8000',
        apiPrefix: '',
        printerProtocol: 'http',
        printerHost: '127.0.0.1',
        printerPort: '8080',
        printerPrefix: '/print',
        invoiceProtocol: 'http',
        invoiceHost: '127.0.0.1',
        invoicePort: '8088',
        invoicePrefix: '',
    },
};
