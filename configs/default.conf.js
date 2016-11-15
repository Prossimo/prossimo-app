const path = require('path');
const packageInfo = require('../package.json');

module.exports = {
    version: packageInfo.version,
    release: false,
    verbose: false,
    app: {
        srcPath: path.resolve(__dirname, '../src'),
        publicPath: path.resolve(__dirname, '../static/public'),
        devtool: 'source-map',
        apiPrefix: '/api',
        printerPrefix: '/print'
    },
    dist: {
        patch: path.resolve(__dirname, '../dist'),
        devtool: ''
    },
    server: {
        port: '9987',
        apiHost: '127.0.0.1',
        apiPort: '8000',
        apiPrefix: '/api',
        printerHost: '127.0.0.1',
        printerPort: '8080',
        printerPrefix: '/print'
    }
};
