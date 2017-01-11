var app = app || {};

(function () {
    'use strict';

    var UNSET_VALUE = '--';

    app.DrawingSidebarUnitDetailsView = Marionette.View.extend({
        tagName: 'div',
        className: 'drawing-sidebar-unit-details',
        template: app.templates['drawing/drawing-sidebar-unit-details-view'],
        ui: {
            $tab_container: '.tab-container'
        },
        events: {
            'click .nav-tabs a': 'onTabClick'
        },
        keyShortcuts: {
            pageup: 'goToPrevTab',
            pagedown: 'goToNextTab'
        },
        initialize: function () {
            this.tabs = {
                unit_properties: {
                    title: 'Unit'
                },
                profile_properties: {
                    title: 'Profile'
                },
                unit_stats: {
                    title: 'Unit Stats'
                },
                unit_estimated_cost: {
                    title: 'Est. Cost'
                }
            };
            this.active_tab = 'unit_properties';
        },
        setActiveTab: function (tab_name) {
            if ( _.contains(_.keys(this.tabs), tab_name) ) {
                this.active_tab = tab_name;
            }
        },
        onTabClick: function (e) {
            var target = $(e.target).attr('href').replace('#', '');

            e.preventDefault();
            this.setActiveTab(target);
            this.render();
        },
        goToNextTab: function () {
            var tabs = _.keys(this.tabs);
            var next_tab = tabs[_.indexOf(tabs, this.active_tab) + 1] || tabs[0];

            this.setActiveTab(next_tab);
            this.render();
        },
        goToPrevTab: function () {
            var tabs = _.keys(this.tabs);
            var prev_tab = tabs[_.indexOf(tabs, this.active_tab) - 1] || _.last(tabs);

            this.setActiveTab(prev_tab);
            this.render();
        },
        getUnitImage: function () {
            return this.model.get('customer_image') || null;
        },
        getUnitProperties: function () {
            var f = app.utils.format;
            var unit_properties = [];
            var params_source = {};
            var project_settings = app.settings.getProjectSettings();

            var relevant_properties = [
                'mark', 'width', 'height', 'description', 'notes', 'exceptions',
                'uw', 'glazing', 'opening_direction', 'glazing_bar_width'
            ];

            params_source = {
                width: f.dimension(this.model.get('width'), null,
                    project_settings && project_settings.get('inches_display_mode')),
                height: f.dimension(this.model.get('height'), null,
                    project_settings && project_settings.get('inches_display_mode'))
            };

            unit_properties = _.map(relevant_properties, function (prop_name) {
                var title = this.model.getTitles([prop_name])[0] || '';
                var value = params_source[prop_name] || this.model.get(prop_name);

                if (
                    this.model.isOperableOnlyAttribute(prop_name) && !this.model.hasOperableSections()
                ) {
                    value = '(Operable Only)';
                } else if (
                    this.model.isGlazingBarProperty(prop_name) && !this.model.hasGlazingBars()
                ) {
                    value = '(Has no Bars)';
                }

                return {
                    title: title,
                    value: value
                };
            }, this).filter(function (property) {
                return !_.isUndefined(property.value);
            });

            return unit_properties;
        },
        getUnitOptions: function () {
            var unit_options = [];
            var options_list = app.settings.dictionaries.getAvailableDictionaryNames();

            unit_options = _.map(options_list, function (dictionary_name) {
                var dictionary_id = app.settings.dictionaries.getDictionaryIdByName(dictionary_name);
                var rules_and_restrictions;
                var value = '(None)';
                var is_restricted = false;
                var current_options = [];

                if ( dictionary_id ) {
                    rules_and_restrictions = app.settings.dictionaries.get(dictionary_id)
                        .get('rules_and_restrictions');
                }

                _.each(rules_and_restrictions, function (rule) {
                    var restriction_applies = this.model.checkIfRestrictionApplies(rule);

                    if ( restriction_applies && rule === 'DOOR_ONLY' ) {
                        is_restricted = true;
                        value = '(Doors Only)';
                    } else if ( restriction_applies && rule === 'OPERABLE_ONLY' ) {
                        is_restricted = true;
                        value = '(Operable Only)';
                    } else if ( restriction_applies && rule === 'GLAZING_BARS_ONLY' ) {
                        is_restricted = true;
                        value = '(Has no Bars)';
                    }
                }, this);

                if ( !is_restricted ) {
                    current_options = dictionary_id ?
                        this.model.getCurrentUnitOptionsByDictionaryId(dictionary_id) : [];
                    value = current_options.length ? current_options[0].get('name') : UNSET_VALUE;
                }

                return {
                    title: dictionary_name,
                    value: value
                };
            }, this);

            return unit_options;
        },
        getProfileProperties: function () {
            var profile_properties = [];
            var profile = this.model.profile;

            var relevant_properties = [
                'name', 'unit_type', 'system', 'frame_width', 'mullion_width',
                'sash_frame_width', 'sash_frame_overlap', 'sash_mullion_overlap',
                'low_threshold', 'threshold_width'
            ];

            if ( profile ) {
                _.each(relevant_properties, function (item) {
                    profile_properties.push({
                        title: profile.getTitles([item]),
                        value: profile.get(item)
                    });
                }, this);
            }

            return profile_properties;
        },
        getUnitSashList: function () {
            var project_settings = app.settings.getProjectSettings();
            var f = app.utils.format;
            var c = app.utils.convert;
            var m = app.utils.math;
            var sash_list_source;
            var sashes = [];

            function getFillingPerimeter(width, height) {
                return f.dimensions(c.mm_to_inches(width),
                        c.mm_to_inches(height), 'fraction', 'inches_only');
            }

            function getFillingArea(width, height, format) {
                format = format || 'sup';

                var result = f.square_feet(m.square_feet(c.mm_to_inches(width),
                             c.mm_to_inches(height)), 2, format);

                return result;
            }

            function getFillingSize(width, height) {
                var filling_size = getFillingPerimeter(width, height);
                var filling_area = getFillingArea(width, height);

                return filling_size + ' (' + filling_area + ')';
            }

            function getSectionInfo(source) {
                var result = {};

                result.filling_is_glass = source.filling.type === 'glass';
                result.filling_name = source.filling.name;
                result.filling_size = getFillingSize( source.filling.width, source.filling.height );

                return result;
            }

            sash_list_source = this.model.getSashList(null, null,
                project_settings && project_settings.get('hinge_indicator_mode') === 'american');

            _.each(sash_list_source, function (source_item, index) {
                var sash_item = {};
                var section_info;
                var opening_size_data;
                var egress_opening_size_data;

                sash_item.name = 'Sash #' + (index + 1);
                sash_item.type = source_item.type;

                opening_size_data = this.model.getSashOpeningSize(source_item.opening);
                sash_item.opening_size = opening_size_data && f.dimensions_and_area(
                    opening_size_data.width,
                    opening_size_data.height,
                    undefined,
                    undefined,
                    opening_size_data.area
                );
                egress_opening_size_data = this.model.getSashOpeningSize(
                    source_item.opening,
                    'egress',
                    source_item.original_type
                );
                sash_item.egress_opening_size = egress_opening_size_data && f.dimensions_and_area(
                    egress_opening_size_data.width,
                    egress_opening_size_data.height,
                    undefined,
                    undefined,
                    egress_opening_size_data.area
                );

                //  Child sections
                if ( source_item.sections.length ) {
                    var sum = 0;

                    sash_item.sections = [];

                    _.each(source_item.sections, function (section, s_index) {
                        var section_item = {};

                        section_item.name = 'Section #' + (index + 1) + '.' + (s_index + 1);
                        section_info = getSectionInfo(section);
                        _.extend(section_item, section_info);

                        if ( section_info.filling_is_glass ) {
                            sum += parseFloat(getFillingArea(section.filling.width,
                                section.filling.height, 'numeric'));
                        }

                        sash_item.sections.push(section_item);
                    });

                    sash_item.daylight_sum = sum ? f.square_feet(sum, 2, 'sup') : false;
                } else {
                    section_info = getSectionInfo(source_item);
                    _.extend(sash_item, section_info);
                }

                sashes.push(sash_item);
            }, this);

            return sashes;
        },
        getUnitStats: function () {
            var unit_stats;
            var f = app.utils.format;
            var stats_data = [];

            var titles = {
                frame: 'Frame',
                sashes: 'Sash Frames',
                mullions: 'Mullions',
                profile_total: 'Profile Total',
                glasses: 'Fillings',
                openings: 'Openings',
                glazing_bars: 'Glazing Bars',
                unit_total: 'Unit Total'
            };

            var group_titles = {
                linear: 'Total Linear',
                linear_without_intersections: 'Total Linear (Without Intersections)',
                area: 'Total Area',
                area_both_sides: 'Total Area (Both Sides)',
                weight: 'Total Weight'
            };
            var data_groups = _.keys(group_titles);
            var group_data = {};
            var hasBaseFilling = this.model.hasBaseFilling();

            unit_stats = this.model.getLinearAndAreaStats();

            _.each(unit_stats, function (item, key) {
                _.each(data_groups, function (group_name) {
                    if ( item[group_name] ) {
                        var value;

                        group_data[group_name] = group_data[group_name] || [];

                        if (group_name.indexOf('linear') !== -1) {
                            value = f.dimension_mm(item[group_name]);
                        } else if (group_name === 'weight') {
                            value = f.weight(item[group_name]);
                        } else {
                            value = f.square_meters(item[group_name]);
                        }

                        group_data[group_name].push({
                            key: key,
                            title: titles[key],
                            value: value,
                            is_total: key === 'profile_total' && group_name !== 'weight' || key === 'unit_total'
                        });
                    }
                }, this);
            }, this);

            _.each(group_titles, function (title, key) {
                group_data[key] = _.sortBy(group_data[key], function (param) {
                    return _.indexOf(['frame', 'sashes', 'mullions', 'profile_total', 'glasses',
                        'openings', 'glazing_bars', 'unit_total'], param.key);
                });

                stats_data.push({
                    title: title,
                    data: group_data[key],
                    hasBaseFilling: title.toLowerCase().indexOf('weight') !== -1 && hasBaseFilling
                });
            }, this);

            return stats_data;
        },
        getUnitEstimatedCost: function () {
            var f = app.utils.format;
            var m = app.utils.math;
            var result = {
                sections: [],
                per_item_priced_options: []
            };

            var unit_cost = this.model.getEstimatedUnitCost();

            result.profile_name = this.model.profile ? this.model.profile.get('name') : UNSET_VALUE;
            result.base_cost = f.fixed(unit_cost.base);
            result.fillings_cost = f.fixed(unit_cost.fillings);
            result.options_cost = f.fixed(unit_cost.options);
            result.total_cost = f.fixed(unit_cost.total);
            result.original_currency = this.model.get('original_currency');
            result.conversion_rate = f.fixed(this.model.get('conversion_rate'), 3);

            //  This is not super nice because we duplicate code from unit.js
            result.converted_cost = f.price_usd(unit_cost.total / parseFloat(result.conversion_rate));

            //  Collect detailed pricing data for sections
            _.each(unit_cost.sections_list, function (source_item, index) {
                var section_item = {};

                section_item.name = 'Section #' + (index + 1);
                section_item.type = source_item.type === 'fixed' ? 'Fixed' : 'Operable';

                section_item.height = f.dimension_mm(source_item.height);
                section_item.width = f.dimension_mm(source_item.width);
                section_item.area = f.square_meters(
                    m.square_meters(source_item.width, source_item.height),
                    2, 'sup');

                section_item.price_per_square_meter = f.fixed(source_item.price_per_square_meter);
                section_item.base_cost = f.fixed(source_item.base_cost);

                //  Add cost for Filling
                section_item.filling_name = source_item.filling_name;
                section_item.filling_price_increase = f.percent(source_item.filling_price_increase);
                section_item.filling_cost = f.fixed(source_item.filling_cost);

                //  Add cost for Options
                section_item.options = _.map(source_item.options, function (item, item_index) {
                    return {
                        index: 'Option #' + (item_index + 1),
                        dictionary_name: item.dictionary_name,
                        option_name: item.option_name,
                        price_increase: f.percent(item.price_increase),
                        cost: f.fixed(item.cost)
                    };
                }, this);

                section_item.total_cost = f.fixed(source_item.total_cost);

                result.sections.push(section_item);
            }, this);

            var per_item_priced_options_total_cost = 0;

            //  Collect detailed pricing data for per-item-priced options
            _.each(unit_cost.options_list.PER_ITEM, function (source_item, index) {
                var option_item = {};

                option_item.option_index = 'Option #' + (index + 1);
                option_item.option_name = source_item.option_name;
                option_item.dictionary_name = source_item.dictionary_name;
                option_item.cost = f.fixed(source_item.pricing_data.cost_per_item);

                per_item_priced_options_total_cost += source_item.pricing_data.cost_per_item;

                result.per_item_priced_options.push(option_item);
            }, this);

            result.per_item_priced_options_total_cost = f.fixed(per_item_priced_options_total_cost);

            return result;
        },
        templateContext: function () {
            var tab_contents = {
                unit_properties: this.getUnitProperties(),
                profile_properties: this.getProfileProperties(),
                unit_stats: this.getUnitStats(),
                unit_estimated_cost: this.getUnitEstimatedCost()
            };

            return {
                unit_image: this.getUnitImage(),
                unit_sashes: this.getUnitSashList(),
                unit_properties: tab_contents.unit_properties,
                unit_options: this.getUnitOptions(),
                profile_properties: tab_contents.profile_properties,
                unit_stats: tab_contents.unit_stats,
                unit_estimated_cost: tab_contents.unit_estimated_cost,
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;
                    return item;
                }, this)
            };
        }
    });
})();
