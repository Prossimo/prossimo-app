var app = app || {};

(function () {
    'use strict';

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
        initialize: function () {
            this.tabs = {
                active_unit_properties: {
                    title: 'Unit'
                },
                active_unit_profile_properties: {
                    title: 'Profile'
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
        onKeyDown: function (e) {
            if ( $(e.target).is('input') !== false ) {
                return;
            }

            //  Left
            if ( e.keyCode === 37 ) {
                this.onPrevBtn();
            //  Right
            } else if ( e.keyCode === 39 ) {
                this.onNextBtn();
            //  Page Up
            } else if ( e.keyCode === 33 ) {
                this.goToPrevTab();
            //  Page Down
            } else if ( e.keyCode === 34 ) {
                this.goToNextTab();
            } else {
                return;
            }

            e.preventDefault();
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
                'mark', 'width', 'height', 'description', 'notes',
                'internal_color', 'external_color', 'gasket_color', 'uw',
                'glazing', 'hinge_style', 'opening_direction', 'internal_sill',
                'external_sill', 'glazing_bar_type', 'glazing_bar_width'
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
                    var opening_size;
                    var opening_area;
                    var section_info;

                    sash_item.name = 'Sash #' + (index + 1);
                    sash_item.type = source_item.type;

                    if ( source_item.opening.height && source_item.opening.width ) {
                        opening_size = f.dimensions(c.mm_to_inches(source_item.opening.width),
                            c.mm_to_inches(source_item.opening.height), 'fraction', 'inches_only');

                        opening_area = f.square_feet(m.square_feet(c.mm_to_inches(source_item.opening.width),
                            c.mm_to_inches(source_item.opening.height)), 2, 'sup');

                        sash_item.opening_size = opening_size + ' (' + opening_area + ')';
                    }

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
                active_unit_profile_properties: tab_contents.active_unit_profile_properties,
                active_unit_estimated_section_prices: tab_contents.active_unit_estimated_section_prices,
                tabs: _.each(this.tabs, function (item, key) {
                    item.is_active = key === this.active_tab;
                    item.is_visible = tab_contents[key] && tab_contents[key].length;
                    return item;
                }, this)
            };
        },
        onRender: function () {
            var self = this;

            this.ui.$select.selectpicker({
                showSubtext: true
            });

            //  TODO: move this to global shortcut manager
            $(document).off('keydown').on('keydown', function (e) {
                self.onKeyDown(e);
            });
        },
        onDestroy: function () {
            $(document).off('keydown');
        }
    });
})();
