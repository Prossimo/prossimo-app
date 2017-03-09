var app = app || {};

(function () {
    'use strict';

    app.QuotesEditorTableItemView = Marionette.View.extend({
        tagName: 'tr',
        className: 'quotes-editor-table-item',
        template: app.templates['dialogs/quotes-editor-table-item-view'],
        events: {
            'click .js-clone-quote': 'cloneQuote',
            'click .js-remove-quote': 'removeQuote'
        },
        cloneQuote: function () {
            this.model.duplicate({
                attributes_to_omit: ['is_default']
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
                grand_total: app.utils.format.price_usd(this.model.getTotalPrices().grand_total)
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
            if ( this.model.get('is_default') !== true ) {
                this.showChildView('name', new app.BaseInputView({
                    model: this.model,
                    param: 'name'
                }));
            }

            this.showChildView('date', new app.BaseDatepickerInputView({
                model: this.model,
                param: 'date'
            }));
        }
    });
})();
