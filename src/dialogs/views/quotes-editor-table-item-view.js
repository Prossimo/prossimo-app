import Marionette from 'backbone.marionette';

import { format } from '../../utils';
import BaseDatepickerInputView from '../../core/views/base/base-datepicker-input-view';
import BaseInputView from '../../core/views/base/base-input-view';
import template from '../../templates/dialogs/quotes-editor-table-item-view.hbs';

export default Marionette.View.extend({
    tagName: 'tr',
    className: 'quotes-editor-table-item',
    template,
    events: {
        'click .js-clone-quote': 'cloneQuote',
        'click .js-remove-quote': 'removeQuote',
    },
    cloneQuote() {
        this.model.duplicate({
            model_name: 'Quote',
            fetch_after_saving: true,
            extra_attributes: {
                units: this.model.units.toJSON(),
                accessories: this.model.extras.toJSON(),
            },
        });
    },
    removeQuote() {
        this.model.destroy();
    },
    templateContext() {
        return {
            id: this.model.id,
            name: this.model.getName(),
            date: this.model.get('date'),
            is_removable: !this.model.isDefault(),
            units: `${this.model.units.getTotalUnitTypes()} / ${
                this.model.units.getTotalUnitQuantity()}`,
            grand_total: format.price_usd(this.model.getTotalPrices().grand_total),
        };
    },
    regions: {
        name: {
            el: 'td.name',
        },
        date: {
            el: 'td.date',
        },
    },
    onRender() {
        this.showChildView('name', new BaseInputView({
            model: this.model,
            param: 'name',
            placeholder: this.model.getName(),
        }));

        this.showChildView('date', new BaseDatepickerInputView({
            model: this.model,
            param: 'date',
        }));
    },
    initialize() {
        this.listenTo(this.model, 'fully_loaded', this.render);
    },
});
