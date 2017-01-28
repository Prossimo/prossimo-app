/* eslint-disable global-require*/

const conf = require('./configs/karma.conf');

module.exports = function (config) {
    config.set(conf);
};
