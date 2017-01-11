'use strict';

module.exports = function (source) {
    if (this.cacheable) this.cacheable();

    // This is an async loader
    let loaderAsyncCallback = this.async();

    let slug = source + '\n'
        + 'var _ = require(' + JSON.stringify('underscore') + ');\n'
        + 'var ext = require(' + JSON.stringify('utils/backbone-extended') + ').default;\n'
        + 'require(' + JSON.stringify('backbone.konvaview') + ');\n'
        + 'module.exports = ext(Backbone);';

    loaderAsyncCallback(null, slug);
};
