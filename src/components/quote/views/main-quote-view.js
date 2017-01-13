import Marionette from 'backbone.marionette';
import App from '../../../main';
import UnitsTableView from '../../../core/views/units-table-view';
import QuoteHeaderView from './quote-header-view';
import QuoteTableView from './quote-table-view';
import template from '../templates/main-quote-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen quote-screen',
    template: template,
    ui: {
        $header_container: '.quote-header-container',
        $table_container: '.quote-table-container'
    },
    templateContext: function () {
        return {
            urlToDownloadPdf: App.settings.getPdfDownloadUrl('quote')
        };
    },
    onRender: function () {
        this.units_table_view = new UnitsTableView({
            collection: App.current_project.units,
            extras: App.current_project.extras,
            parent_view: this
        });

        this.quote_header_view = new QuoteHeaderView({
            model: App.current_project
        });

        this.quote_table_view = new QuoteTableView({
            project: App.current_project,
            collection: App.current_project.units,
            extras: App.current_project.extras,
            show_outside_units_view: true
        });

        this.$el.append(this.units_table_view.render().el);
        this.ui.$header_container.append(this.quote_header_view.render().el);
        this.ui.$table_container.append(this.quote_table_view.render().el);
    },
    onBeforeDestroy: function () {
        this.units_table_view.destroy();
        this.quote_header_view.destroy();
        this.quote_table_view.destroy();
    }
});
