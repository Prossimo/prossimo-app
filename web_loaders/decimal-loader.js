module.exports = function (source) {
    if (this.cacheable) this.cacheable();

    // This is an async loader
    let loaderAsyncCallback = this.async();

    let slug = source + '\n'
        + 'var toFormat = require(' + JSON.stringify('toformat') + ');\n'
        + 'toFormat(Decimal);';

    loaderAsyncCallback(null, slug);
};
