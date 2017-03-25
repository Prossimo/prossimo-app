'use strict';

module.exports = function (source) {
    if (this.cacheable) this.cacheable();

    // This is an async loader
    let loaderAsyncCallback = this.async();

    let slug = source + '\n'
        + 'var _ = require(' + JSON.stringify('underscore') + ');\n'
        + 'require(' + JSON.stringify('utils/backbone-extended') + ');\n'
        + 'require(' + JSON.stringify('backbone.konvaview') + ');\n'
        + 'module.exports = Backbone;';

    loaderAsyncCallback(null, slug);
};
