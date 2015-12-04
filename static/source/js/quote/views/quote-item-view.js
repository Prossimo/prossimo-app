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
                tech_specs: 'Tech Specs',
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
        getTechSpecs: function () {
            var f = app.utils.format;
            var c = app.utils.convert;
            var m = app.utils.math;

            var sizes = this.model.getSizes();
            var glasses_openings = {
                glasses: [],
                openings: []
            };

            _.each(sizes.openings, function (opening, index) {
                if ( opening.width > 0 && opening.height > 0 ) {
                    glasses_openings.openings.push({
                        name: 'Opening #' + (index + 1),
                        size: this.options.show_sizes_in_mm ?
                            f.dimensions_mm(opening.width, opening.height) :
                            f.dimensions(c.mm_to_inches(opening.width), c.mm_to_inches(opening.height), 'fraction'),
                        area: this.options.show_sizes_in_mm ?
                            f.square_meters(m.square_meters(opening.width, opening.height)) :
                            f.square_feet(m.square_feet(c.mm_to_inches(opening.width), c.mm_to_inches(opening.height)), 2, 'sup')
                    });
                }
            }, this);

            _.each(sizes.glasses, function (glass, index) {
                if ( glass.width > 0 && glass.height > 0 ) {
                    glasses_openings.glasses.push({
                        name: 'Glass #' + (index + 1),
                        size: this.options.show_sizes_in_mm ?
                            f.dimensions_mm(glass.width, glass.height) :
                            f.dimensions(c.mm_to_inches(glass.width), c.mm_to_inches(glass.height), 'fraction'),
                        area: this.options.show_sizes_in_mm ?
                            f.square_meters(m.square_meters(glass.width, glass.height)) :
                            f.square_feet(m.square_feet(c.mm_to_inches(glass.width), c.mm_to_inches(glass.height)), 2, 'sup')
                    });
                }
            }, this);

            var params_list = ['threshold_width', 'frame_u_value',
                'spacer_thermal_bridge_value'];

            var source_hash = this.model.profile.getNameTitleTypeHash(params_list);

            var name_title_hash = _.extend({
                visible_frame_width_fixed: 'Visible Frame Width Fixed',
                visible_frame_width_operational: 'Visible Frame Width Operational'
            }, _.object( _.pluck(source_hash, 'name'), _.pluck(source_hash, 'title') ), {
                threshold_width: 'Threshold Height'
            });

            var params_source = {
                threshold_width: this.model.profile.isThresholdPossible() ?
                    f.dimension_mm(this.model.profile.get('threshold_width')) : false,
                frame_u_value: this.model.profile.get('frame_u_value') ?
                    f.fixed_minimal(this.model.profile.get('frame_u_value'), 3) : false,
                spacer_thermal_bridge_value: this.model.profile.get('spacer_thermal_bridge_value') ?
                    f.fixed_minimal(this.model.profile.get('spacer_thermal_bridge_value'), 3) : false,
                visible_frame_width_fixed: f.dimension_mm(this.model.profile.getVisibleFrameWidthFixed()),
                visible_frame_width_operational: f.dimension_mm(this.model.profile.getVisibleFrameWidthOperable())
            };

            var params = _.map(name_title_hash, function (item, key) {
                return { name: key, title: item, value: params_source[key] };
            }, this);

            return {
                system: this.model.profile.get('system'),
                glasses_openings: glasses_openings,
                params: params
            };
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
                tech_specs: this.getTechSpecs(),
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
