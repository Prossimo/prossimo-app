var app = app || {};

(function () {
    'use strict';

    app.AppRouter = Backbone.Router.extend({
        routes: {},
        initialize: function () {
            this.listenToOnce(app.vent, 'project_selector:fetch_current:stop', function () {
                this.route('supplier(/)', 'supplier', this.openQuoteModuleInSupplierMode);

                if (/^supplier(\/+)?$/.test(Backbone.history.getFragment())) {
                    this.openQuoteModuleInSupplierMode();
                }
            });
        },
        openQuoteModuleInSupplierMode: function () {
            app.current_project.set('quote_mode_type', 'supplier_mode', {silent: true});
            Backbone.history.loadUrl('quote/');
        },
        addRoute: function (route, callback) {
            this.route(route, route, callback);
        }
    });
})();
