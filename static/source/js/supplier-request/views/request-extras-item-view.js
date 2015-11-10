var app = app || {};

(function () {
    'use strict';

    app.RequestExtrasItemView = Marionette.ItemView.extend({
        tagName: 'tr',
        className: 'supplier-request-extras-item',
        template: app.templates['supplier-request/request-extras-item-view'],
        getReferenceId: function () {
            return this.model.collection.filter(function (item) {
                return item.get('extras_type') === this.options.type;
            }, this).indexOf(this.model) + 1;
        },
        serializeData: function () {
            return {
                reference_id: this.getReferenceId(),
                description: this.model.get('description'),
                quantity: this.model.get('quantity')
            };
        }
    });
})();
