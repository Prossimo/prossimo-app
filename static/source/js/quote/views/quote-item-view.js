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
        getPrices: function () {
            var f = app.utils.format;
            var unit_price = this.model.getUnitPrice();
            var subtotal_price = this.model.getSubtotalPrice();
            var discount = this.model.get('discount');
            var unit_price_discounted = this.model.getUnitPriceDiscounted();
            var subtotal_price_discounted = this.model.getSubtotalPriceDiscounted();

            return {
                unit: f.price_usd(unit_price),
                subtotal: f.price_usd(subtotal_price),
                discount: discount ? f.percent(discount) : null,
                unit_discounted: discount ? f.price_usd(unit_price_discounted) : null,
                subtotal_discounted: discount ? f.price_usd(subtotal_price_discounted) : null
            };
        },
        getDescription: function () {
            var view = this;
            var project_settings = app.settings.getProjectSettings();
            var f = app.utils.format;
            var c = app.utils.convert;
            var m = app.utils.math;

            //  TODO: this name is a bit misleading
            function getFillingPerimeter(width, height) {
                return view.options.show_sizes_in_mm ?
                    f.dimensions_mm(width, height) :
                    f.dimensions(
                        c.mm_to_inches(width),
                        c.mm_to_inches(height),
                        'fraction',
                        'inches_only'
                    );
            }

            function getFillingArea(width, height, format) {
                format = format || 'sup';

                var result = view.options.show_sizes_in_mm ?
                    f.square_meters(m.square_meters(width, height)) :
                    f.square_feet(m.square_feet(c.mm_to_inches(width),
                    c.mm_to_inches(height)), 2, format);

                return result;
            }

            function getFillingSize(width, height) {
                var filling_size = getFillingPerimeter(width, height);
                var filling_area = getFillingArea(width, height);

                return filling_size + ' (' + filling_area + ')';
            }

            function getSectionInfo(source, options) {
                options = options || {};
                var result = {};

                result.filling_is_glass = source.filling.type === 'glass';
                result.filling_name = source.filling.name;
                result.filling_size = getFillingSize( source.filling.width, source.filling.height );

                //  Show supplier name for filling if it exists
                if ( options.show_supplier_filling_name && app.settings && source.filling && source.filling.name ) {
                    var filling_type = app.settings.getFillingTypeByName(source.filling.name);

                    if ( filling_type && filling_type.get('supplier_name') ) {
                        result.filling_name = filling_type.get('supplier_name');
                    }
                }

                return result;
            }

            var sash_list_source = this.model.getSashList(null, null, this.options.show_outside_units_view &&
                project_settings && project_settings.get('hinge_indicator_mode') === 'american');
            var sashes = [];

            //  This is the list of params that we want to see in the quote. We
            //  throw out attributes that don't apply to the current unit
            var params_list = _.filter(
                ['rough_opening', 'description', 'opening_direction', 'glazing_bar_width'],
            function (param) {
                var condition = true;

                if ( this.model.isOperableOnlyAttribute(param) && !this.model.hasOperableSections() ) {
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
                var opening_size_data;
                var egress_opening_size_data;
                var section_info;

                sash_item.name = 'Sash #' + (index + 1);
                sash_item.type = source_item.type;

                if ( source_item.opening.height && source_item.opening.width ) {
                    opening_size_data = this.model.getSashOpeningSize(
                        source_item.opening,
                        undefined,
                        undefined,
                        this.options.show_sizes_in_mm ? 'mm' : 'inches'
                    );

                    if ( opening_size_data ) {
                        sash_item.opening_size = this.options.show_sizes_in_mm ?
                            f.dimensions_and_area_mm(
                                opening_size_data.width,
                                opening_size_data.height,
                                opening_size_data.area
                            ) :
                            f.dimensions_and_area(
                                opening_size_data.width,
                                opening_size_data.height,
                                undefined,
                                undefined,
                                opening_size_data.area
                            );
                    }

                    egress_opening_size_data = this.model.getSashOpeningSize(
                        source_item.opening,
                        'egress',
                        source_item.original_type,
                        this.options.show_sizes_in_mm ? 'mm' : 'inches'
                    );

                    if ( egress_opening_size_data ) {
                        sash_item.egress_opening_size = this.options.show_sizes_in_mm ?
                            f.dimensions_and_area_mm(
                                egress_opening_size_data.width,
                                egress_opening_size_data.height,
                                egress_opening_size_data.area
                            ) :
                            f.dimensions_and_area(
                                egress_opening_size_data.width,
                                egress_opening_size_data.height,
                                undefined,
                                undefined,
                                egress_opening_size_data.area
                            );
                    }
                }

                //  Child sections
                if ( source_item.sections.length ) {
                    var sum = 0;

                    sash_item.sections = [];

                    _.each(source_item.sections, function (section, s_index) {
                        var section_item = {};

                        section_item.name = 'Section #' + (index + 1) + '.' + (s_index + 1);
                        section_info = getSectionInfo(section, this.options);
                        _.extend(section_item, section_info);

                        if ( section_info.filling_is_glass ) {
                            sum += parseFloat(getFillingArea(section.filling.width,
                                section.filling.height, 'numeric'));
                        }

                        sash_item.sections.push(section_item);
                    }, this);

                    sash_item.daylight_sum = sum ? f.square_feet(sum, 2, 'sup') : false;
                } else {
                    section_info = getSectionInfo(source_item, this.options);
                    _.extend(sash_item, section_info);
                }

                sashes.push(sash_item);
            }, this);

            //  Now get list of Unit Options applicable for this unit
            var dictionaries = _.filter(app.settings.getAvailableDictionaryNames(), function (dictionary_name) {
                var dictionary_id = app.settings.getDictionaryIdByName(dictionary_name);
                var rules_and_restrictions = app.settings.dictionaries.get(dictionary_id)
                    .get('rules_and_restrictions');
                var is_restricted = false;

                _.each(rules_and_restrictions, function (rule) {
                    var restriction_applies = this.model.checkIfRestrictionApplies(rule);

                    if ( restriction_applies ) {
                        is_restricted = true;
                    }
                }, this);

                return !is_restricted;
            }, this);

            //  Here we form the final list of properties to be shown in the
            //  Product Description column in the specific order. We do it in
            //  four steps:
            //  1. Add Size, Rough Opening and System (or Supplier System)
            //  2. Add properties from the source_hash object, which contains
            //  only those unit attributes that apply to the current unit
            //  3. Add list of Unit Options that apply to the current unit
            //  4. Add Threshold and U Value.
            //  5. Override default titles for some properties but only if they
            //  were included at steps 1-4
            var name_title_hash = _.extend({
                size: 'Size <small class="size-label">WxH</small>',
                rough_opening: 'Rough Opening <small class="size-label">WxH</small>',
                system: 'System'
            }, _.object( _.pluck(source_hash, 'name'), _.pluck(source_hash, 'title') ),
            _.object( dictionaries, dictionaries ), {
                threshold: 'Threshold',
                u_value: 'U Value'
            }, _.pick({
                glazing_bar_width: 'Muntin Width'
            }, function (new_title, property_to_override) {
                return _.contains(_.pluck(source_hash, 'name'), property_to_override);
            }));

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
                rough_opening: this.options.show_sizes_in_mm ?
                    f.dimensions_mm(c.inches_to_mm(this.model.getRoughOpeningWidth()),
                        c.inches_to_mm(this.model.getRoughOpeningHeight())) :
                    f.dimensions(this.model.getRoughOpeningWidth(), this.model.getRoughOpeningHeight(),
                        null, project_settings.get('inches_display_mode') || null),
                glazing_bar_width: this.model.hasGlazingBars() ?
                    (
                        this.options.show_sizes_in_mm ? f.dimension_mm(this.model.get('glazing_bar_width')) :
                        f.dimension(c.mm_to_inches(this.model.get('glazing_bar_width')), 'fraction', null, 'remove')
                    ) : false
            };

            params_source = _.extend({}, params_source, _.object(dictionaries, _.map(dictionaries,
                function (dictionary_name) {
                    var dictionary_id = app.settings.getDictionaryIdByName(dictionary_name);
                    var current_options = dictionary_id ?
                        this.model.getCurrentUnitOptionsByDictionaryId(dictionary_id) : [];

                    return current_options.length ? current_options[0].get('name') : false;
                }, this)
            ));

            var params = _.map(name_title_hash, function (item, key) {
                return { name: key, title: item, value: params_source[key] !== undefined ?
                    params_source[key] : this.model.get(key) };
            }, this);

            return {
                sashes: sashes,
                params: params
            };
        },
        getCustomerImage: function () {
            return this.model.get('customer_image');
        },
        getProductImage: function (is_alternative) {
            var project_settings = app.settings && app.settings.getProjectSettings();
            var position = this.options.show_outside_units_view ?
                ( !is_alternative ? 'outside' : 'inside' ) :
                ( !is_alternative ? 'inside' : 'outside' );
            var preview_size = 600;
            var title = position === 'inside' ? 'View from Interior' : 'View from Exterior';

            return {
                img: app.preview(this.model, {
                    width: preview_size,
                    height: preview_size,
                    mode: 'base64',
                    position: position,
                    hingeIndicatorMode: this.options.force_european_hinge_indicators ? 'european' :
                        project_settings && project_settings.get('hinge_indicator_mode')
                }),
                title: title
            };
        },
        shouldShowCustomerImage: function () {
            return this.options.show_customer_image !== false &&
                this.model.collection && this.model.collection.hasAtLeastOneCustomerImage();
        },
        shouldShowDrawings: function () {
            var project_settings = app.settings && app.settings.getProjectSettings();
            var show_drawings = !project_settings || project_settings.get('show_drawings_in_quote');

            return show_drawings;
        },
        serializeData: function () {
            var project_settings = app.settings ? app.settings.getProjectSettings() : undefined;
            var show_customer_image = this.shouldShowCustomerImage();
            var show_drawings = this.shouldShowDrawings();
            var show_price = this.options.show_price !== false;

            return {
                position: parseFloat(this.model.get('position')) + 1,
                mark: this.model.get('mark'),
                description: this.getDescription(),
                notes: this.model.get('notes'),
                exceptions: this.model.get('exceptions'),
                quantity: this.model.get('quantity'),
                customer_image: show_customer_image ? this.getCustomerImage() : '',
                product_image: show_drawings ? this.getProductImage() : '',
                show_price: show_price,
                price: show_price ? this.getPrices() : null,
                is_price_estimated: project_settings && project_settings.get('pricing_mode') === 'estimates',
                has_dummy_profile: this.model.hasDummyProfile(),
                profile_name: this.model.get('profile_name') || this.model.get('profile_id') || ''
            };
        }
    });
})();
