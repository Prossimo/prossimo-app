var app = app || {};

(function () {
    'use strict';

    app.QuoteExtrasTableView = Marionette.CompositeView.extend({
        template: app.templates['quote/quote-extras-table-view'],
        childView: app.QuoteExtrasItemView,
        childViewContainer: '.quote-extras-table-body',
        childViewOptions: function () {
            return {
                type: this.options.type,
                show_price: this.options.show_price
            };
        },
        filter: function (child) {
            return this.options.type === 'Optional' ?
                child.isOptionalType() :
                child.get('extras_type') === this.options.type;
        },
        initialize: function () {
            this.listenTo(this.collection, 'all', this.render);
        },
        getExtrasTableAttributes: function () {
            var name_title_hash = {
                ref: 'Ref.',
                extras_product_description: 'Product Description',
                quantity: 'Qty'
            };

            if ( this.options.show_price !== false ) {
                name_title_hash.price = 'Price';
            }

            var table_attributes = _.map(name_title_hash, function (item, key) {
                return { name: key, title: item };
            }, this);

            return table_attributes;
        },
        getTotalPrices: function () {
            var f = app.utils.format;
            var total_price = this.options.type === 'Regular' ?
                this.collection.getRegularItemsPrice() :
                this.collection.getOptionalItemsPrice();

            return {
                total: f.price_usd(total_price)
            };
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
                price_colspan: this.getExtrasTableAttributes().length - 1,
                total_prices: this.getTotalPrices(),
                heading: this.options.type === 'Regular' ? 'Extras' : 'Optional Extras',
                is_optional: this.options.type === 'Optional',
                show_price: this.options.show_price !== false
            };
        }
    });
})();
