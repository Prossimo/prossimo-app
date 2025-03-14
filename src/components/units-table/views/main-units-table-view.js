import Marionette from 'backbone.marionette';

import App from '../../../main';
import UnitsTableView from '../../../core/views/units-table-view';
import template from '../templates/main-units-table-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen units-table-screen',
    template,
    ui: {
        $wrapper: '.units-table-wrapper',
    },
    onRender() {
        this.units_table_view = new UnitsTableView({
            collection: App.current_quote.units,
            extras: App.current_quote.extras,
            multiunits: App.current_quote.multiunits,
            parent_view: this,
        });

        this.ui.$wrapper.append(this.units_table_view.render().el);
    },
    onBeforeDestroy() {
        this.units_table_view.destroy();
    },
});
