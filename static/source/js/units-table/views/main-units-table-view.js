var app = app || {};

(function () {
    'use strict';

    app.MainUnitsTableView = Marionette.View.extend({
        tagName: 'div',
        className: 'screen units-table-screen',
        template: app.templates['units-table/main-units-table-view'],
        ui: {
            $wrapper: '.units-table-wrapper'
        },
        onRender: function () {
            this.units_table_view = new app.UnitsTableView({
                collection: app.current_quote.units,
                extras: app.current_quote.extras,
                parent_view: this,
                is_always_visible: true
            });

            this.ui.$wrapper.append(this.units_table_view.render().el);
        },
        onBeforeDestroy: function () {
            this.units_table_view.destroy();
        }
    });
})();
