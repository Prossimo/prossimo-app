var app = app || {};

(function () {
    'use strict';

    app.MainQuoteView = Marionette.View.extend({
        tagName: 'div',
        className: 'screen quote-screen',
        template: app.templates['quote/main-quote-view'],
        ui: {
            $controls_container: '.controls-container',
            $header_container: '.quote-header-container',
            $table_container: '.quote-table-container'
        },
        templateContext: function () {
            return {
                lead_time: app.current_project.get('lead_time')
            };
        },
        onRender: function () {
            this.controls_view = new app.QuoteControlsView({
                project: app.current_project,
                quote: app.current_quote,
                quote_mode: 'quote',
                increase_revision_enabled: true,
                set_current_date_enabled: true
            });

            this.units_table_view = new app.UnitsTableView({
                collection: app.current_quote.units,
                extras: app.current_quote.extras,
                parent_view: this
            });

            this.quote_header_view = new app.QuoteHeaderView({
                model: app.current_project,
                quote: app.current_quote
            });

            this.quote_table_view = new app.QuoteTableView({
                project: app.current_project,
                quote: app.current_quote,
                collection: app.current_quote.units,
                extras: app.current_quote.extras,
                show_outside_units_view: true
            });

            this.$el.append(this.units_table_view.render().el);
            this.ui.$controls_container.append(this.controls_view.render().el);
            this.ui.$header_container.append(this.quote_header_view.render().el);
            this.ui.$table_container.append(this.quote_table_view.render().el);
        },
        onBeforeDestroy: function () {
            this.controls_view.destroy();
            this.units_table_view.destroy();
            this.quote_header_view.destroy();
            this.quote_table_view.destroy();
        }
    });
})();
