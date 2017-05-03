/* eslint-disable prefer-template */

module.exports = function (source) {
    if (this.cacheable) this.cacheable();

    // This is an async loader
    const loaderAsyncCallback = this.async();

    const slug = source + '\n'
        + 'var toFormat = require(' + JSON.stringify('toformat') + ');\n'
        + 'toFormat(Decimal);';

    loaderAsyncCallback(null, slug);
};
