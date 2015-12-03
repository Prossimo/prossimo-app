var app = app || {};

(function () {
    'use strict';

    app.QuoteItemView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'quote-item',
        template: app.templates['quote/quote-item-view'],
        getQuoteTableAttributes: function () {
            var name_title_hash = {
                mark: 'Mark',
                customer_image: 'Customer Image',
                product_image: 'Shop Drawing' +
                    (this.options.show_outside_units_view ? ': <small>View from Exterior</small>' : ''),
                product_description: 'Product Description',
                quantity: 'Quantity',
                price: 'Price'
            };

            if ( this.model.collection &&
                 this.model.collection.hasAtLeastOneCustomerImage() === false
            ) {
                delete name_title_hash.customer_image;
            }

            if ( this.options.show_price === false ) {
                delete name_title_hash.price;
            }

            var table_attributes = _.map(name_title_hash, function (item, key) {
                return { name: key, title: item };
            }, this);

            return table_attributes;
        },
        getPrices: function () {
            var f = app.utils.format;
            var unit_price = this.model.getUnitPrice();
            var subtotal_price = this.model.getSubtotalPrice();
            var discount = this.model.get('discount');
            var subtotal_price_discounted = this.model.getSubtotalPriceDiscounted();

            //  We split "hidden" extras equally between all units
            var hidden_multiplier = this.options.project ? this.options.project.getHiddenMultiplier() : 1;

            return {
                unit: f.price_usd(unit_price * hidden_multiplier),
                subtotal: f.price_usd(subtotal_price * hidden_multiplier),
                discount: discount ? f.percent(discount) : null,
                subtotal_discounted: discount ? f.price_usd(subtotal_price_discounted * hidden_multiplier) : null
            };
        },
        getDescription: function () {
            var f = app.utils.format;
            var c = app.utils.convert;

            var params_list = ['type', 'glazing', 'internal_color', 'external_color',
                'interior_handle', 'exterior_handle', 'description', 'hardware_type',
                'lock_mechanism', 'glazing_bead', 'gasket_color', 'hinge_style',
                'opening_direction', 'internal_sill', 'external_sill'];
            var source_hash = this.model.getNameTitleTypeHash(params_list);

            var name_title_hash = _.extend({
                size: 'Size'
            }, _.object( _.pluck(source_hash, 'name'), _.pluck(source_hash, 'title') ), {
                glazing: this.model.profile.isSolidPanelPossible() ||
                    this.model.profile.isFlushPanelPossible() ? 'Glass Packet/Panel Type' : 'Glass Packet',
                threshold: 'Threshold',
                u_value: 'U Value'
            });

            var params_source = {
                size: this.options.show_sizes_in_mm ?
                    f.dimensions_mm(c.inches_to_mm(this.model.get('width')), c.inches_to_mm(this.model.get('height'))) :
                    f.dimensions(this.model.get('width'), this.model.get('height'), 'fraction'),
                threshold: this.model.profile.isThresholdPossible() ?
                    this.model.profile.getThresholdType() : false,
                u_value: this.model.get('uw') ? f.fixed(this.model.getUValue(), 3) : false
            };

            return _.map(name_title_hash, function (item, key) {
                return { name: key, title: item, value: params_source[key] || this.model.get(key) };
            }, this);
        },
        getCustomerImage: function () {
            return this.model.get('customer_image');
        },
        getProductImage: function () {
            var preview_size = this.model.collection &&
                this.model.collection.hasAtLeastOneCustomerImage() ? 400 : 500;

            return app.preview(this.model, {
                width: preview_size,
                height: preview_size,
                mode: 'base64',
                position: this.options.show_outside_units_view ? 'outside' : 'inside'
            });
        },
        serializeData: function () {
            return {
                table_attributes: this.getQuoteTableAttributes(),
                mark: this.model.get('mark'),
                description: this.getDescription(),
                notes: this.model.get('notes'),
                quantity: this.model.get('quantity'),
                price: this.getPrices(),
                customer_image: this.getCustomerImage(),
                product_image: this.getProductImage(),
                show_price: this.options.show_price !== false,
                show_customer_image: this.model.collection &&
                    this.model.collection.hasAtLeastOneCustomerImage()
            };
        }
    });
})();
