import Marionette from 'backbone.marionette';

import utils from '../../utils';
import BaseDatepickerInputView from '../../core/views/base/base-datepicker-input-view';
import BaseInputView from '../../core/views/base/base-input-view';
import template from '../../templates/dialogs/quotes-editor-table-item-view.hbs';

export default Marionette.View.extend({
    tagName: 'tr',
    className: 'quotes-editor-table-item',
    template: template,
    events: {
        'click .js-clone-quote': 'cloneQuote',
        'click .js-remove-quote': 'removeQuote'
    },
    cloneQuote: function () {
        this.model.duplicate({
            model_name: 'Quote',
            attributes_to_omit: ['is_default'],
            extra_attributes: {
                units: this.model.units.toJSON(),
                accessories: this.model.extras.toJSON()
            }
        });
    },
    removeQuote: function () {
        this.model.destroy();
    },
    templateContext: function () {
        return {
            name: this.model.getName(),
            date: this.model.get('date'),
            is_removable: this.model.get('is_default') !== true,
            units: this.model.units.getTotalUnitTypes() + ' / ' +
            this.model.units.getTotalUnitQuantity(),
            grand_total: utils.format.price_usd(this.model.getTotalPrices().grand_total)
        };
    },
    regions: {
        name: {
            el: 'td.name'
        },
        date: {
            el: 'td.date'
        }
    },
    onRender: function () {
        if (this.model.get('is_default') !== true) {
            this.showChildView('name', new BaseInputView({
                model: this.model,
                param: 'name'
            }));
        }

        this.showChildView('date', new BaseDatepickerInputView({
            model: this.model,
            param: 'date'
        }));
    },
    initialize: function () {
        this.listenTo(this.model, 'fully_loaded', this.render);
    }
});
