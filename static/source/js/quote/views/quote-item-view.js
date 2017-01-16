var app = app || {};

(function () {
    'use strict';

    var view;
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
        if ( options.show_supplier_names && app.settings && source.filling && source.filling.name ) {
            var filling_type = app.settings.filling_types.getByName(source.filling.name);

            if ( filling_type && filling_type.get('supplier_name') ) {
                result.filling_name = filling_type.get('supplier_name');
            }
        }

        return result;
    }

    app.QuoteItemView = Marionette.View.extend({
        tagName: 'div',
        className: 'quote-item',
        template: app.templates['quote/quote-item-view'],
        initialize: function () {
            view = this;

            var relationClass = this.model.getRelation();
            this.el.classList.add(relationClass);
            this.listenTo(this.model, 'change', this.render);
        },
        getPrices: function (model) {
            model = model || this.model;
            var unit_price = model.getUnitPrice();
            var subtotal_price = model.getSubtotalPrice();
            var discount = model.get('discount');
            var unit_price_discounted = model.getUnitPriceDiscounted();
            var subtotal_price_discounted = model.getSubtotalPriceDiscounted();

            return {
                unit: f.price_usd(unit_price),
                subtotal: f.price_usd(subtotal_price),
                discount: discount ? f.percent(discount) : null,
                unit_discounted: discount ? f.price_usd(unit_price_discounted) : null,
                subtotal_discounted: discount ? f.price_usd(subtotal_price_discounted) : null
            };
        },
        // TODO break into smaller pieces
        getDescription: function (model) {
            model = model || this.model;
            var project_settings = app.settings.getProjectSettings();
            var subunits;
            var result;

            if (model.isMultiunit()) {
                if (model.subunits) {
                    subunits = model.subunits.map(function (subunit) {
                        var size = view.options.show_sizes_in_mm ?
                            f.dimensions_mm(c.inches_to_mm(subunit.get('width')), c.inches_to_mm(subunit.get('height'))) :
                            f.dimensions(subunit.get('width'), subunit.get('height'), 'fraction',
                                project_settings && project_settings.get('inches_display_mode'));

                        return {
                            position: subunit.get('position'),
                            mark: subunit.get('mark'),
                            size: size,
                            description: subunit.get('description'),
                            notes: subunit.get('notes')
                        };
                    });
                }
                result = {
                    subunits: subunits
                };

            } else {
                var sash_list_source = model.getSashList(null, null, this.options.show_outside_units_view &&
                        project_settings && project_settings.get('hinge_indicator_mode') === 'american');
                var sashes = [];

                //  This is the list of params that we want to see in the quote. We
                //  throw out attributes that don't apply to the current unit
                var raw_params_list = ['rough_opening', 'description', 'opening_direction', 'glazing_bar_width'];
                var params_list = _.filter(raw_params_list, function (param) {
                    var condition = true;

                    if ( model.isOperableOnlyAttribute(param) && !model.hasOperableSections() ) {
                        condition = false;
                    } else if ( model.isGlazingBarProperty(param) && !model.hasGlazingBars() ) {
                        condition = false;
                    }

                    return condition;
                }, this);
                var source_hash = model.getNameTitleTypeHash(params_list);

                //  Add section for each sash (Sash #N title + sash properties)
                _.each(sash_list_source, function (source_item, index) {
                    var sash_item = {};
                    var opening_size_data;
                    var egress_opening_size_data;
                    var section_info;

                    sash_item.name = 'Sash #' + (index + 1);
                    sash_item.type = source_item.type;

                    if ( source_item.opening.height && source_item.opening.width ) {
                        opening_size_data = model.getSashOpeningSize(
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

                        egress_opening_size_data = model.getSashOpeningSize(
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
                var dictionaries = _.map(app.settings.dictionaries.filter(function (dictionary) {
                    var rules_and_restrictions = dictionary.get('rules_and_restrictions');
                    var is_restricted = false;

                    _.each(rules_and_restrictions, function (rule) {
                        var restriction_applies = model.checkIfRestrictionApplies(rule);

                        if ( restriction_applies ) {
                            is_restricted = true;
                        }
                    }, this);

                    return !is_restricted;
                }, this), function (filtered_dictionary) {
                    return filtered_dictionary.get('name');
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

                var params_system = (this.options.show_supplier_system) ?
                    model.profile.get('supplier_system') :
                    model.profile.get('system');
                var params_size = (this.options.show_sizes_in_mm) ?
                    f.dimensions_mm(c.inches_to_mm(model.get('width')), c.inches_to_mm(model.get('height'))) :
                    f.dimensions(model.get('width'), model.get('height'), 'fraction',
                        project_settings && project_settings.get('inches_display_mode'));
                var params_threshold = (model.profile.isThresholdPossible()) ?
                    model.profile.getThresholdType() : false;
                var params_u_value;
                var params_rough_opening;
                var params_glazing_bar_width;
                params_u_value = model.get('uw') ? f.fixed(model.getUValue(), 3) : false;
                params_rough_opening = (this.options.show_sizes_in_mm) ?
                    f.dimensions_mm(c.inches_to_mm(model.getRoughOpeningWidth()),
                        c.inches_to_mm(model.getRoughOpeningHeight())) :
                    f.dimensions(model.getRoughOpeningWidth(), model.getRoughOpeningHeight(),
                        null, project_settings.get('inches_display_mode') || null);
                params_glazing_bar_width = (model.hasGlazingBars()) ?
                    (
                        this.options.show_sizes_in_mm ? f.dimension_mm(model.get('glazing_bar_width')) :
                            f.dimension(c.mm_to_inches(model.get('glazing_bar_width')), 'fraction', null, 'remove')
                    ) : false;
                var params_source = {
                    system: params_system,
                    size: params_size,
                    threshold: params_threshold,
                    u_value: params_u_value,
                    rough_opening: params_rough_opening,
                    glazing_bar_width: params_glazing_bar_width
                };

                params_source = _.extend({}, params_source, _.object(dictionaries, _.map(dictionaries,
                    function (dictionary_name) {
                        var dictionary_id = app.settings.dictionaries.getDictionaryIdByName(dictionary_name);
                        var current_options = dictionary_id ?
                            model.getCurrentUnitOptionsByDictionaryId(dictionary_id) : [];

                        //  We assume that we have only one option per dictionary,
                        //  although in theory it's possible to have multiple
                        var option_name = current_options.length ?
                            (
                                this.options.show_supplier_names && current_options[0].get('supplier_name') ||
                                current_options[0].get('name')
                            ) :
                            false;

                        return option_name;
                    }, this)
                ));

                var params = _.map(name_title_hash, function (item, key) {
                    return { name: key, title: item, value: params_source[key] !== undefined ?
                        params_source[key] : model.get(key) };
                }, this);

                result = {
                    sashes: sashes,
                    params: params
                };
            }

            return result;
        },
        getCustomerImage: function (model) {
            model = model || this.model;
            return model.get('customer_image');
        },
        getProductImage: function (model, options) {
            model = model || this.model;
            options = options || {};
            var project_settings = app.settings && app.settings.getProjectSettings();
            var position = this.options.show_outside_units_view ?
                ( !options.is_alternative ? 'outside' : 'inside' ) :
                ( !options.is_alternative ? 'inside' : 'outside' );
            var isSubunit = model.isSubunit();
            var preview_size = 600;
            var title = position === 'inside' ? 'View from Interior' : 'View from Exterior';

            return {
                img: model.getPreview({
                    width: preview_size,
                    height: preview_size,
                    mode: 'base64',
                    position: position,
                    drawNeighbors: isSubunit,
                    topOffset: (isSubunit) ? 50 : 0,
                    hingeIndicatorMode: (this.options.force_european_hinge_indicators) ? 'european' :
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
        templateContext: function () {
            var model = this.model;
            var modelIndex = model.collection.indexOf(model);
            var previousModel = model.collection.at(modelIndex - 1);
            var nextModel = model.collection.at(modelIndex + 1);
            var project_settings = app.settings ? app.settings.getProjectSettings() : undefined;
            var show_customer_image = this.shouldShowCustomerImage();
            var show_drawings = this.shouldShowDrawings();
            var show_price = this.options.show_price !== false;
            var multiunit = model.getParentMultiunit();
            var multiunitHead;
            var multiunitPosition;
            var isFirstSubunit;
            var isLastSubunit;
            var modelPosition;

            if (model.isSubunit()) {
                isFirstSubunit = previousModel.getParentMultiunit() !== multiunit;
                isLastSubunit = nextModel.getParentMultiunit() !== multiunit;
                modelPosition = model.get('position');
                multiunitPosition = '' + (parseInt(multiunit.get('position')) + 1);
            } else {
                modelPosition = '' + (parseInt(model.get('position')) + 1);
            }

            if (isFirstSubunit) {
                multiunitHead = {
                    position: multiunitPosition,
                    mark: multiunit.get('mark'),
                    description: this.getDescription(multiunit),
                    notes: multiunit.get('notes'),
                    quantity: multiunit.get('quantity'),
                    product_image: show_drawings ? this.getProductImage(multiunit) : '',
                    show_price: show_price,
                    price: show_price ? this.getPrices(multiunit) : null,
                    is_price_estimated: project_settings && project_settings.get('pricing_mode') === 'estimates',
                    has_dummy_profile: false
                };
            }

            return {
                position: modelPosition,
                mark: model.get('mark'),
                description: this.getDescription(),
                notes: model.get('notes'),
                exceptions: model.get('exceptions'),
                quantity: model.get('quantity'),
                customer_image: show_customer_image ? this.getCustomerImage() : '',
                product_image: show_drawings ? this.getProductImage() : '',
                show_price: show_price,
                price: show_price ? this.getPrices() : null,
                is_price_estimated: project_settings && project_settings.get('pricing_mode') === 'estimates',
                multiunit_head: multiunitHead,
                is_subunit: model.isSubunit(),
                is_last_subunit: isLastSubunit,
                has_dummy_profile: model.hasDummyProfile(),
                profile_name: model.get('profile_name') || model.get('profile_id') || ''
            };
        }
    });
})();
