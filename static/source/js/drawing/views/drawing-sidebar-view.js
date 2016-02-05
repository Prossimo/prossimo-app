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
            $sidebar_toggle: '.js-sidebar-toggle'
        },
        events: {
            'change @ui.$select': 'onChange',
            'click @ui.$prev': 'onPrevBtn',
            'click @ui.$next': 'onNextBtn',
            'click @ui.$sidebar_toggle': 'onSidebarToggle'
        },
        initialize: function () {
            this.listenTo(this.options.parent_view.active_unit, 'all', this.render);
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

            if ( e.keyCode === 37 ) {
                this.onPrevBtn();
            }

            if ( e.keyCode === 39 ) {
                this.onNextBtn();
            }
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
            var active_unit_properties = [];
            var active_unit;

            var relevant_properties = [
                'mark', 'width', 'height', 'type', 'description', 'notes',
                'internal_color', 'external_color', 'gasket_color', 'uw',
                'glazing', 'hinge_style', 'opening_direction', 'internal_sill',
                'external_sill', 'glazing_bar_width'
            ];

            if ( this.options.parent_view.active_unit ) {
                active_unit = this.options.parent_view.active_unit;
                _.each(relevant_properties, function (item) {
                    active_unit_properties.push({
                        title: active_unit.getTitles([item]),
                        value: active_unit.get(item)
                    });
                });
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
            var f = app.utils.format;
            var c = app.utils.convert;
            var m = app.utils.math;
            var sash_list_source;
            var sashes = [];

            if ( this.options.parent_view.active_unit ) {
                sash_list_source = this.options.parent_view.active_unit.getSashList();

                _.each(sash_list_source, function (source_item, index) {
                    var sash_item = {};
                    var filling_size;
                    var filling_area;
                    var opening_size;
                    var opening_area;

                    sash_item.name = 'Sash #' + (index + 1);
                    sash_item.type = source_item.type;

                    filling_size = f.dimensions_in(c.mm_to_inches(source_item.filling.width),
                        c.mm_to_inches(source_item.filling.height), 'fraction');

                    filling_area = f.square_feet(m.square_feet(c.mm_to_inches(source_item.filling.width),
                        c.mm_to_inches(source_item.filling.height)), 2, 'sup');

                    sash_item.filling_is_glass = source_item.filling.type === 'glass';
                    sash_item.filling_name = source_item.filling.name;
                    sash_item.filling_size = filling_size + ' (' + filling_area + ')';

                    if ( source_item.opening.height && source_item.opening.width ) {
                        opening_size = f.dimensions_in(c.mm_to_inches(source_item.opening.width),
                            c.mm_to_inches(source_item.opening.height), 'fraction');

                        opening_area = f.square_feet(m.square_feet(c.mm_to_inches(source_item.opening.width),
                            c.mm_to_inches(source_item.opening.height)), 2, 'sup');

                        sash_item.opening_size = opening_size + ' (' + opening_area + ')';
                    }

                    sashes.push(sash_item);
                }, this);
            }

            return sashes;
        },
        getActiveUnitEstimatedSectionPrices: function () {
            var f = app.utils.format;
            var m = app.utils.math;
            var section_list_source;
            var sections = [];

            if ( this.options.parent_view.active_unit && app.settings.get('pricing_mode') === 'estimates' ) {
                section_list_source = this.options.parent_view.active_unit.getSecionsListWithEstimatedPrices();

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
                active_unit_properties: this.getActiveUnitProperties(),
                active_unit_profile_properties: this.getActiveUnitProfileProperties(),
                active_unit_sashes: this.getActiveUnitSashList(),
                active_unit_image: this.getActiveUnitImage(),
                active_unit_estimated_section_prices: this.getActiveUnitEstimatedSectionPrices()
            };
        },
        onRender: function () {
            var self = this;

            this.ui.$select.selectpicker({
                showSubtext: true
            });

            $(document).off('keydown').on('keydown', function (e) {
                self.onKeyDown(e);
            });
        },
        onDestroy: function () {
            $(document).off('keydown');
        }
    });
})();
