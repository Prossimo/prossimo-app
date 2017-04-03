import Marionette from 'backbone.marionette';

import {format} from '../../../utils';
import template from '../templates/quote-extras-item-view.hbs';

export default Marionette.View.extend({
    tagName: 'tr',
    className: 'quote-extras-item',
    template: template,
    getPrices: function () {
        var unit_price = this.model.getUnitPrice();
        var subtotal_price = this.model.getSubtotalPrice();

        return {
            unit: unit_price ? format.price_usd(unit_price) : null,
            subtotal: subtotal_price ? format.price_usd(subtotal_price) : null
        };
    },
    getReferenceId: function () {
        return this.model.collection.filter(function (item) {
            return this.options.type === 'Optional' ?
                item.isOptionalType() :
                item.get('extras_type') === this.options.type;
        }, this).indexOf(this.model) + 1;
    },
    getDescription: function () {
        var description = this.model.get('description');

        if (this.isOptionalPercentBased()) {
            description += ' (' + format.percent(this.model.getMarkupPercent()) + ' of Subtotal for units)';
        }

        return description;
    },
    isOptionalPercentBased: function () {
        return this.model.isOptionalType() && this.model.isPercentBasedType();
    },
    getQuantity: function () {
        var quantity = this.model.get('quantity');

        if (this.model.isOptionalType() && this.model.isPercentBasedType()) {
            quantity = '--';
        }

        return quantity;
    },
    templateContext: function () {
        return {
            reference_id: this.getReferenceId(),
            description: this.getDescription(),
            quantity: this.getQuantity(),
            price: this.getPrices(),
            show_price: this.options.show_price !== false
        };
    }
});
