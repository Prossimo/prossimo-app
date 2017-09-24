import Marionette from 'backbone.marionette';

import UnitsTableView from '../../../core/views/units-table-view';
import template from '../templates/main-units-table-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen units-table-screen',
    template,
    ui: {
        $wrapper: '.units-table-wrapper',
    },
    initialize() {
        this.data_store = this.getOption('data_store');
    },
    onRender() {
        this.units_table_view = new UnitsTableView({
            collection: this.data_store.current_quote.units,
            extras: this.data_store.current_quote.extras,
            multiunits: this.data_store.current_quote.multiunits,
            parent_view: this,
            data_store: this.data_store,
        });

        this.ui.$wrapper.append(this.units_table_view.render().el);
    },
    onBeforeDestroy() {
        this.units_table_view.destroy();
    },
});
