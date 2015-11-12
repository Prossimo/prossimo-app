var app = app || {};

(function () {
    'use strict';

    app.MainSupplierRequestView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen supplier-request-screen',
        template: app.templates['supplier-request/main-supplier-request-view'],
        ui: {
            '$table_container': '.supplier-request-table-container'
        },
        initialize: function () {
            this.model = app.current_project;
            this.listenTo(this.model, 'all', this.render);
        },
        onRender: function () {
            var request_table_view = new app.RequestTableView({
                project: app.current_project,
                collection: app.current_project.units,
                extras: app.current_project.extras
            });

            this.ui.$table_container.append(request_table_view.render().el);
        }
    });
})();
