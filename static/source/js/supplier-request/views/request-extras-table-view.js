var app = app || {};

(function () {
    'use strict';

    app.RequestExtrasTableView = Marionette.CompositeView.extend({
        template: app.templates['supplier-request/request-extras-table-view'],
        childView: app.RequestExtrasItemView,
        childViewContainer: '.supplier-request-extras-table-body',
        childViewOptions: function () {
            return {
                type: this.options.type
            };
        },
        filter: function (child) {
            return child.get('extras_type') === this.options.type;
        },
        initialize: function () {
            this.listenTo(this.collection, 'all', this.render);
        },
        getExtrasTableAttributes: function () {
            var name_title_hash = {
                ref: 'Ref.',
                product_description: 'Product Description',
                quantity: 'Quantity'
            };

            var table_attributes = _.map(name_title_hash, function (item, key) {
                return { name: key, title: item };
            }, this);

            return table_attributes;
        },
        getItemsCount: function () {
            return this.options.type === 'Regular' ?
                this.collection.getRegularItems().length :
                this.collection.getOptionalItems().length;
        },
        serializeData: function () {
            return {
                items_count: this.getItemsCount(),
                table_attributes: this.getExtrasTableAttributes(),
                heading: this.options.type === 'Regular' ? 'Extras' : 'Optional Extras',
                is_optional: this.options.type === 'Optional'
            };
        }
    });
})();
