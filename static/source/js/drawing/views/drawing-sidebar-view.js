var app = app || {};

(function () {
    'use strict';

    app.DrawingSidebarView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'drawing-sidebar',
        template: app.templates['drawing/drawing-sidebar-view'],
        ui: {
            '$select': '.selectpicker',
            '$prev': '.js-prev-unit',
            '$next': '.js-next-unit'
        },
        events: {
            'change @ui.$select': 'onChange',
            'click @ui.$prev': 'onPrevBtn',
            'click @ui.$next': 'onNextBtn'
        },
        initialize: function () {
            this.listenTo(this.options.parent_view, 'before:destroy', function () {
                this.onBeforeDestroy();
            });

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
                'external_sill'
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
                'name', 'unitType', 'system', 'frameWidth', 'mullionWidth',
                'sashFrameWidth', 'sashFrameOverlap', 'sashMullionOverlap',
                'lowThreshold', 'thresholdWidth'
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
                active_unit_image: this.getActiveUnitImage()
            };
        },
        onRender: function () {
            var self = this;

            this.ui.$select.selectpicker({
                showSubtext: true
            });

            $(document).off('keydown');
            $(document).on('keydown', function (e) {
                self.onKeyDown(e);
            });
        },
        onBeforeDestroy: function () {
            $(document).off('keydown');
        }
    });
})();
