var app = app || {};

(function () {
    'use strict';

    app.MainQuoteView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen quote-screen',
        template: app.templates['quote/main-quote-view'],
        ui: {
            '$table_container': '.quote-table-container'
        },
        initialize: function () {
            this.model = app.current_project;
            this.listenTo(this.model, 'all', this.render);
        },
        serializeData: function () {
            return _.extend(this.serializeModel(this.model), {
                quote_id: this.model.cid,
                quote_date: '5 September, 2015',
                quote_revision_id: '1'
            });
        },
        onRender: function () {
            this.units_table_view = new app.UnitsTableView({
                collection: app.current_project.units,
                extras: app.current_project.extras,
                parent_view: this
            });

            this.quote_table_view = new app.QuoteTableView({
                project: app.current_project,
                collection: app.current_project.units,
                extras: app.current_project.extras,
                show_outside_units_view: true
            });

            this.$el.append(this.units_table_view.render().el);
            this.ui.$table_container.append(this.quote_table_view.render().el);
        },
        onDestroy: function () {
            this.units_table_view.destroy();
            this.quote_table_view.destroy();
        }
    });
})();
