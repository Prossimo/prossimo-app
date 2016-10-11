var app = app || {};

(function () {
    'use strict';

    var UNSET_VALUE = '--';

    app.DrawingSidebarView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'drawing-sidebar',
        template: app.templates['drawing/drawing-sidebar-view'],
        ui: {
            $select: '.selectpicker',
            $prev: '.js-prev-unit',
            $next: '.js-next-unit',
            $sidebar_toggle: '.js-sidebar-toggle',
            $tab_container: '.tab-container'
        },
        events: {
            'change @ui.$select': 'onChange',
            'click @ui.$prev': 'onPrevBtn',
            'click @ui.$next': 'onNextBtn',
            'click .nav-tabs a': 'onTabClick',
            'click @ui.$sidebar_toggle': 'onSidebarToggle'
        },
        keyShortcuts: {
            left: 'onPrevBtn',
            right: 'onNextBtn',
            pageup: 'goToPrevTab',
            pagedown: 'goToNextTab'
        },
        initialize: function () {
            this.tabs = {
                active_unit_properties: {
                    title: 'Unit'
                },
                active_unit_profile_properties: {
                    title: 'Profile'
                },
                active_unit_stats: {
                    title: 'Unit Stats'
                },
                active_unit_estimated_section_prices: {
                    title: 'Est. Prices'
                }
            };
            this.active_tab = 'active_unit_properties';

            this.listenTo(this.options.parent_view.active_unit, 'all', this.render);
            this.listenTo(this.options.parent_view, 'drawing_view:onSetState', this.render);
            this.listenTo(app.current_project.settings, 'change', this.render);
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
        selectUnit: function (model) {
            this.$el.trigger({
                type: 'unit-selected',
                model: model
            });

            this.render();
        },
        onChange: function () {
            this.selectUnit(this.collection.get(this.ui.$select.val()));
        },
        onNextBtn: function () {
            var collection_size = this.serializeData().unit_list.length;
            var next_index;

            if ( collection_size > 1 && this.options.parent_view.active_unit ) {
                next_index = this.collection.indexOf(this.options.parent_view.active_unit) + 1;

                if ( next_index >= collection_size ) {
                    next_index = 0;
                }

                this.selectUnit(this.collection.at(next_index));
            }
        },
        onPrevBtn: function () {
            var collection_size = this.serializeData().unit_list.length;
            var prev_index;

            if ( collection_size > 1 && this.options.parent_view.active_unit ) {
                prev_index = this.collection.indexOf(this.options.parent_view.active_unit) - 1;

                if ( prev_index < 0 ) {
                    prev_index = collection_size - 1;
                }

                this.selectUnit(this.collection.at(prev_index));
            }
        },
        //  This is not very cool because it breaks "don't store state in html"
        //  rule, but it's better than rewriting everything
        goToNextTab: function () {
            var $active_tab = this.ui.$tab_container.find('.active');
            var $next_tab = $active_tab.next().length ? $active_tab.next() : $active_tab.siblings().first();

            $next_tab.find('a').trigger('click');
        },
        goToPrevTab: function () {
            var $active_tab = this.ui.$tab_container.find('.active');
            var $prev_tab = $active_tab.prev().length ? $active_tab.prev() : $active_tab.siblings().last();

            $prev_tab.find('a').trigger('click');
        },
        onSidebarToggle: function () {
            this.$el.trigger({ type: 'sidebar-toggle' });
        },
        getActiveUnitImage: function () {
            var active_unit_image = null;

            if ( this.options.parent_view.active_unit &&
                 this.options.parent_view.active_unit.get('customer_image')
            ) {
                active_unit_image = this.options.parent_view.active_unit.get('customer_image');
            }

            return active_unit_image;
        },
        getActiveUnitProperties: function () {
            var f = app.utils.format;
            var active_unit_properties = [];
            var params_source = {};
            var project_settings = app.settings.getProjectSettings();
            var active_unit;

            var relevant_properties = [
                'mark', 'width', 'height', 'description', 'notes', 'exceptions',
                'uw', 'glazing', 'opening_direction', 'glazing_bar_width'
            ];

            if ( this.options.parent_view.active_unit ) {
                active_unit = this.options.parent_view.active_unit;

                params_source = {
                    width: f.dimension(active_unit.get('width'), null,
                        project_settings && project_settings.get('inches_display_mode')),
                    height: f.dimension(active_unit.get('height'), null,
                        project_settings && project_settings.get('inches_display_mode'))
                };

                active_unit_properties = _.map(relevant_properties, function (prop_name) {
                    return {
                        title: active_unit.getTitles([prop_name]),
                        value: params_source[prop_name] || active_unit.get(prop_name)
                    };
                }, this);
            }

            return active_unit_properties;
        },
        getActiveUnitOptions: function () {
            var active_unit_options = [];
            var options_list = app.settings.getAvailableDictionaryNames();
            var active_unit;

            if ( this.options.parent_view.active_unit ) {
                active_unit = this.options.parent_view.active_unit;

                active_unit_options = _.map(options_list, function (dictionary_name) {
                    var dictionary_id = app.settings.getDictionaryIdByName(dictionary_name);
                    var rules_and_restrictions;
                    var value = '(None)';
                    var is_restricted = false;
                    var current_options = [];

                    if ( dictionary_id ) {
                        rules_and_restrictions = app.settings.dictionaries.get(dictionary_id)
                            .get('rules_and_restrictions');
                    }

                    _.each(rules_and_restrictions, function (rule) {
                        var restriction_applies = active_unit.checkIfRestrictionApplies(rule);

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
                            active_unit.getCurrentUnitOptionsByDictionaryId(dictionary_id) : [];
                        value = current_options.length ? current_options[0].get('name') : UNSET_VALUE;
                    }

                    return {
                        title: dictionary_name,
                        value: value
                    };
                }, this);
            }

            return active_unit_options;
        },
        getActiveUnitProfileProperties: function () {
            var active_unit_profile_properties = [];
            var active_unit_profile;

            var relevant_properties = [
                'name', 'unit_type', 'system', 'frame_width', 'mullion_width',
                'sash_frame_width', 'sash_frame_overlap', 'sash_mullion_overlap',
                'low_threshold', 'threshold_width'
            ];

            if ( this.options.parent_view.active_unit &&
                 this.options.parent_view.active_unit.profile
            ) {
                active_unit_profile = this.options.parent_view.active_unit.profile;
                _.each(relevant_properties, function (item) {
                    active_unit_profile_properties.push({
                        title: active_unit_profile.getTitles([item]),
                        value: active_unit_profile.get(item)
                    });
                });
            }

            return active_unit_profile_properties;
        },
        getActiveUnitSashList: function () {
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

            if ( this.options.parent_view.active_unit ) {
                sash_list_source = this.options.parent_view.active_unit.getSashList(null, null,
                    project_settings && project_settings.get('hinge_indicator_mode') === 'american');

                _.each(sash_list_source, function (source_item, index) {
                    var sash_item = {};
                    var section_info;
                    var opening_size_data;
                    var egress_opening_size_data;

                    sash_item.name = 'Sash #' + (index + 1);
                    sash_item.type = source_item.type;

                    opening_size_data = this.options.parent_view.active_unit.getSashOpeningSize(
                        source_item.opening
                    );
                    sash_item.opening_size = opening_size_data && f.dimensions_and_area(
                        opening_size_data.width,
                        opening_size_data.height,
                        undefined,
                        undefined,
                        opening_size_data.area
                    );
                    egress_opening_size_data = this.options.parent_view.active_unit.getSashOpeningSize(
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
            }

            return sashes;
        },
        getActiveUnitStats: function () {
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

            if ( this.options.parent_view.active_unit ) {
                var group_titles = {
                    linear: 'Total Linear',
                    linear_without_intersections: 'Total Linear (Without Intersections)',
                    area: 'Total Area',
                    area_both_sides: 'Total Area (Both Sides)',
                    weight: 'Total Weight'
                };
                var data_groups = _.keys(group_titles);
                var group_data = {};
                var hasBaseFilling = this.options.parent_view.active_unit.hasBaseFilling();

                unit_stats = this.options.parent_view.active_unit.getLinearAndAreaStats();

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
            }

            return stats_data;
        },
        getActiveUnitEstimatedSectionPrices: function () {
            var project_settings = app.settings.getProjectSettings();
            var f = app.utils.format;
            var m = app.utils.math;
            var section_list_source;
            var sections = [];

            if ( this.options.parent_view.active_unit && project_settings.get('pricing_mode') === 'estimates' ) {
                section_list_source = this.options.parent_view.active_unit.getSectionsListWithEstimatedPrices();

                _.each(section_list_source, function (source_item, index) {
                    var section_item = {};

                    section_item.name = 'Section #' + (index + 1);
                    section_item.type = source_item.type === 'fixed' ? 'Fixed' : 'Operable';

                    section_item.height = f.dimension_mm(source_item.height);
                    section_item.width = f.dimension_mm(source_item.width);
                    section_item.area = f.square_meters(
                        m.square_meters(source_item.width, source_item.height),
                        2, 'sup');

                    section_item.price_per_square_meter = f.price_usd(source_item.price_per_square_meter);
                    section_item.price = f.price_usd(source_item.estimated_price);

                    sections.push(section_item);
                }, this);
            }

            return sections;
        },
        serializeData: function () {
            var tab_contents = {
                active_unit_properties: this.getActiveUnitProperties(),
                active_unit_profile_properties: this.getActiveUnitProfileProperties(),
                active_unit_stats: this.getActiveUnitStats(),
                active_unit_estimated_section_prices: this.getActiveUnitEstimatedSectionPrices()
            };

            return {
                unit_list: this.collection.map(function (item) {
                    return {
                        is_selected: this.options.parent_view.active_unit &&
                            item.cid === this.options.parent_view.active_unit.cid,
                        reference_id: item.getRefNum(),
                        cid: item.cid,
                        mark: item.get('mark'),
                        dimensions: app.utils.format.dimensions(item.get('width'), item.get('height'), 'fraction')
                    };
                }, this),
                active_unit_image: this.getActiveUnitImage(),
                active_unit_sashes: this.getActiveUnitSashList(),
                active_unit_properties: tab_contents.active_unit_properties,
                active_unit_options: this.getActiveUnitOptions(),
                active_unit_profile_properties: tab_contents.active_unit_profile_properties,
                active_unit_stats: tab_contents.active_unit_stats,
                active_unit_estimated_section_prices: tab_contents.active_unit_estimated_section_prices,
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;
                    item.is_visible = tab_contents[key] && tab_contents[key].length;
                    return item;
                }, this)
            };
        },
        onRender: function () {
            this.ui.$select.selectpicker({
                showSubtext: true
            });
        }
    });
})();
