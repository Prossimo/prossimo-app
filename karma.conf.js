/* eslint-disable global-require*/

const conf = require('./tools/config/karma.conf');

module.exports = (config) => {
    config.set(conf);
};
