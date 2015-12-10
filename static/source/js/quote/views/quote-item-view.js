var app = app || {};

(function () {
    'use strict';

    app.QuoteItemView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'quote-item',
        template: app.templates['quote/quote-item-view'],
        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },
        getQuoteTableAttributes: function () {
            var name_title_hash = {
                mark: 'Mark',
                customer_image: 'Customer Image',
                product_image: 'Shop Drawing' +
                    (this.options.show_outside_units_view ? ': <small>View from Exterior</small>' : ''),
                product_description: 'Product Description',
                quantity: 'Qty',
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
            var m = app.utils.math;

            var sash_list_source = this.model.getSashList();
            var sashes = [];

            var params_list = ['type', 'glazing', 'internal_color', 'external_color',
                'interior_handle', 'exterior_handle', 'description', 'hardware_type',
                'lock_mechanism', 'glazing_bead', 'gasket_color', 'hinge_style',
                'opening_direction', 'internal_sill', 'external_sill'];
            var source_hash = this.model.getNameTitleTypeHash(params_list);

            _.each(sash_list_source, function (source_item, index) {
                var sash_item = {};
                var glass_size;
                var glass_area;
                var opening_size;
                var opening_area;

                sash_item.name = 'Sash #' + (index + 1);
                sash_item.type = source_item.type;

                glass_size = this.options.show_sizes_in_mm ?
                    f.dimensions_mm(source_item.glass.width, source_item.glass.height) :
                    f.dimensions_in(c.mm_to_inches(source_item.glass.width), c.mm_to_inches(source_item.glass.height), 'fraction');

                glass_area = this.options.show_sizes_in_mm ?
                    f.square_meters(m.square_meters(source_item.glass.width, source_item.glass.height)) :
                    f.square_feet(m.square_feet(c.mm_to_inches(source_item.glass.width),
                        c.mm_to_inches(source_item.glass.height)), 2, 'sup');

                sash_item.glazing_type = source_item.glass.type;
                sash_item.glazing_size = glass_size + ' (' + glass_area + ')';

                if ( source_item.opening.height && source_item.opening.width ) {
                    opening_size = this.options.show_sizes_in_mm ?
                        f.dimensions_mm(source_item.opening.width, source_item.opening.height) :
                        f.dimensions_in(c.mm_to_inches(source_item.opening.width), c.mm_to_inches(source_item.opening.height), 'fraction');

                    opening_area = this.options.show_sizes_in_mm ?
                        f.square_meters(m.square_meters(source_item.opening.width, source_item.opening.height)) :
                        f.square_feet(m.square_feet(c.mm_to_inches(source_item.opening.width),
                            c.mm_to_inches(source_item.opening.height)), 2, 'sup');

                    sash_item.opening_size = opening_size + ' (' + opening_area + ')';
                }

                sashes.push(sash_item);
            }, this);

            var name_title_hash = _.extend({
                size: 'Size',
                system: 'System'
            }, _.object( _.pluck(source_hash, 'name'), _.pluck(source_hash, 'title') ), {
                glazing: this.model.profile.isSolidPanelPossible() ||
                    this.model.profile.isFlushPanelPossible() ? 'Glass Packet/Panel Type' : 'Glass Packet',
                threshold: 'Threshold',
                u_value: 'U Value'
            });

            var params_source = {
                system: this.options.show_supplier_system ?
                    this.model.profile.get('supplier_system') :
                    this.model.profile.get('system'),
                size: this.options.show_sizes_in_mm ?
                    f.dimensions_mm(c.inches_to_mm(this.model.get('width')), c.inches_to_mm(this.model.get('height'))) :
                    f.dimensions(this.model.get('width'), this.model.get('height'), 'fraction'),
                threshold: this.model.profile.isThresholdPossible() ?
                    this.model.profile.getThresholdType() : false,
                u_value: this.model.get('uw') ? f.fixed(this.model.getUValue(), 3) : false
            };

            var params = _.map(name_title_hash, function (item, key) {
                return { name: key, title: item, value: params_source[key] || this.model.get(key) };
            }, this);

            return {
                sashes: sashes,
                params: params
            };
        },
        getCustomerImage: function () {
            return this.model.get('customer_image');
        },
        getProductImage: function () {
            var preview_height = 400;
            var preview_width = this.model.collection &&
                this.model.collection.hasAtLeastOneCustomerImage() ? 400 : 450;

            return app.preview(this.model, {
                width: preview_width,
                height: preview_height,
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
