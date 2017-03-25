/* eslint-disable global-require*/

const conf = require('./config/karma.conf');

module.exports = function (config) {
    config.set(conf);
};
