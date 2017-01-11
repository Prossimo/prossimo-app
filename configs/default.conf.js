const path = require('path');
const packageInfo = require('../package.json');

module.exports = {
    version: packageInfo.version,
    release: false,
    verbose: false,
    app: {
        srcPath: path.resolve(__dirname, '../src'),
        sourcePath: path.resolve(__dirname, '../static/source'),
        devtool: 'source-map',
        apiPrefix: '/api',
        printerPrefix: '/print'
    },
    dist: {
        path: path.resolve(__dirname, '../dist'),
        devtool: ''
    },
    server: {
        port: '9987',
        apiProtocol: 'http',
        apiHost: '127.0.0.1',
        apiPort: '8000',
        apiPrefix: '/api',
        printerProtocol: 'http',
        printerHost: '127.0.0.1',
        printerPort: '8080',
        printerPrefix: '/print'
    }
};
