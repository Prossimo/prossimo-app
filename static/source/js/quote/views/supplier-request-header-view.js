var app = app || {};

(function () {
    'use strict';

    app.SupplierRequestHeaderView = Marionette.ItemView.extend({
        template: app.templates['quote/supplier-request-header-view'],
        modelEvents: {
            change: 'render' // todo: I think it is unnecessary
        }
    });
})();
