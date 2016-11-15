const nconf = require('nconf');
const path = require('path');
const defaultConf = require('./default.conf');

nconf
    .use('memory')
    .env()
    .argv()
    .file(path.resolve(__dirname, '../local.conf.json'))
    .defaults(defaultConf);

const apiUrl = nconf.get('server:apiHost')
    + (nconf.get('server:apiPort') ? ':' + nconf.get('server:apiPort') : '' )
    + nconf.get('server:apiPrefix');

const printerUrl = nconf.get('server:printerHost')
    + (nconf.get('server:printerPort') ? ':' + nconf.get('server:printerPort') : '')
    + nconf.get('server:printerPrefix');

nconf.set('server:apiUrl', apiUrl);
nconf.set('server:printerUrl', printerUrl);

module.exports = nconf;
