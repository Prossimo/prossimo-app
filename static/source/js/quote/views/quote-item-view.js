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
            var project_settings = app.settings.getProjectSettings();

            var name_title_hash = {
                mark: 'Mark',
                customer_image: 'Customer Image',
                product_image: 'Shop Drawing' +
                    (this.options.show_outside_units_view ? ': <small>View from Exterior</small>' : ''),
                product_description: 'Product Description',
                quantity: 'Qty',
                price: project_settings && project_settings.get('pricing_mode') === 'estimates' ?
                    'Estimated Price' : 'Price'
            };

            if ( !this.shouldShowCustomerImage() ) {
                delete name_title_hash.customer_image;
            }

            if ( !this.shouldShowDrawings() ) {
                delete name_title_hash.product_image;
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

            return {
                unit: f.price_usd(unit_price),
                subtotal: f.price_usd(subtotal_price),
                discount: discount ? f.percent(discount) : null,
                subtotal_discounted: discount ? f.price_usd(subtotal_price_discounted) : null
            };
        },
        getDescription: function () {
            var project_settings = app.settings.getProjectSettings();
            var f = app.utils.format;
            var c = app.utils.convert;
            var m = app.utils.math;

            var sash_list_source = this.model.getSashList(null, null, this.options.show_outside_units_view &&
                project_settings && project_settings.get('hinge_indicator_mode') === 'american');
            var sashes = [];

            //  This is the list of params that we want to see in the quote. We
            //  throw out attributes that don't apply to the current unit
            var params_list = _.filter(
                ['glazing', 'internal_color', 'external_color',
                'interior_handle', 'exterior_handle', 'description', 'hardware_type',
                'lock_mechanism', 'glazing_bead', 'gasket_color', 'hinge_style',
                'opening_direction', 'internal_sill', 'external_sill', 'glazing_bar_type'],
            function (param) {
                var condition = true;

                if ( this.model.isDoorOnlyAttribute(param) && !this.model.isDoorType() ) {
                    condition = false;
                } else if ( this.model.isOperableOnlyAttribute(param) && !this.model.hasOperableSections() ) {
                    condition = false;
                } else if ( this.model.isGlazingBarProperty(param) && !this.model.hasGlazingBars() ) {
                    condition = false;
                }

                return condition;
            }, this);
            var source_hash = this.model.getNameTitleTypeHash(params_list);

            //  Add section for each sash (Sash #N title + sash properties)
            _.each(sash_list_source, function (source_item, index) {
                var sash_item = {};
                var filling_size;
                var filling_area;
                var opening_size;
                var opening_area;
                var filling_type;

                sash_item.name = 'Sash #' + (index + 1);
                sash_item.type = source_item.type;

                filling_size = this.options.show_sizes_in_mm ?
                    f.dimensions_mm(source_item.filling.width, source_item.filling.height) :
                    f.dimensions(
                        c.mm_to_inches(source_item.filling.width),
                        c.mm_to_inches(source_item.filling.height),
                        'fraction',
                        project_settings && project_settings.get('inches_display_mode')
                    );

                filling_area = this.options.show_sizes_in_mm ?
                    f.square_meters(m.square_meters(source_item.filling.width, source_item.filling.height)) :
                    f.square_feet(m.square_feet(c.mm_to_inches(source_item.filling.width),
                        c.mm_to_inches(source_item.filling.height)), 2, 'sup');

                sash_item.filling_is_glass = source_item.filling.type === 'glass';
                sash_item.filling_name = source_item.filling.name;
                sash_item.filling_size = filling_size + ' (' + filling_area + ')';

                //  Show supplier name for filling if it exists
                if ( this.options.show_supplier_filling_name && app.settings && sash_item.filling_name ) {
                    filling_type = app.settings.getFillingTypeByName(sash_item.filling_name);

                    if ( filling_type && filling_type.get('supplier_name') ) {
                        sash_item.filling_name = filling_type.get('supplier_name');
                    }
                }

                if ( source_item.opening.height && source_item.opening.width ) {
                    opening_size = this.options.show_sizes_in_mm ?
                        f.dimensions_mm(source_item.opening.width, source_item.opening.height) :
                        f.dimensions(
                            c.mm_to_inches(source_item.opening.width),
                            c.mm_to_inches(source_item.opening.height),
                            'fraction',
                            project_settings && project_settings.get('inches_display_mode')
                        );

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
                    f.dimensions(this.model.get('width'), this.model.get('height'), 'fraction',
                        project_settings && project_settings.get('inches_display_mode')),
                threshold: this.model.profile.isThresholdPossible() ?
                    this.model.profile.getThresholdType() : false,
                u_value: this.model.get('uw') ? f.fixed(this.model.getUValue(), 3) : false,
                glazing: this.options.show_supplier_filling_name && app.settings && this.model.get('glazing') ?
                    (
                        app.settings.getFillingTypeByName(this.model.get('glazing')) ?
                        app.settings.getFillingTypeByName(this.model.get('glazing')).get('supplier_name') :
                        this.model.get('glazing')
                    ) :
                    this.model.get('glazing')
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
            var project_settings = app.settings && app.settings.getProjectSettings();
            var preview_height = 400;
            var preview_width = this.model.collection &&
                this.model.collection.hasAtLeastOneCustomerImage() ? 400 : 450;

            return app.preview(this.model, {
                width: preview_width,
                height: preview_height,
                mode: 'base64',
                position: this.options.show_outside_units_view ? 'outside' : 'inside',
                hingeIndicatorMode: this.options.force_european_hinge_indicators ? 'european' :
                    project_settings && project_settings.get('hinge_indicator_mode')
            });
        },
        shouldShowCustomerImage: function () {
            return this.model.collection &&
                 this.model.collection.hasAtLeastOneCustomerImage();
        },
        shouldShowDrawings: function () {
            var project_settings = app.settings && app.settings.getProjectSettings();
            var show_drawings = !project_settings || project_settings.get('show_drawings_in_quote');

            return show_drawings;
        },
        serializeData: function () {
            var show_customer_image = this.shouldShowCustomerImage();
            var show_drawings = this.shouldShowDrawings();

            return {
                table_attributes: this.getQuoteTableAttributes(),
                mark: this.model.get('mark'),
                description: this.getDescription(),
                notes: this.model.get('notes'),
                exceptions: this.model.get('exceptions'),
                quantity: this.model.get('quantity'),
                price: this.getPrices(),
                customer_image: this.getCustomerImage(),
                product_image: show_drawings ? this.getProductImage() : '',
                show_price: this.options.show_price !== false,
                show_customer_image: show_customer_image,
                show_drawings: show_drawings
            };
        }
    });
})();
