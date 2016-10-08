var app = app || {};

(function () {
    'use strict';

    app.SupplierRequestHeaderView = Marionette.ItemView.extend({
        template: app.templates['supplier-request/supplier-request-header-view'],
        initialize: function () {
            this.listenTo(this.model, 'all', this.render);
        }
    });
})();
