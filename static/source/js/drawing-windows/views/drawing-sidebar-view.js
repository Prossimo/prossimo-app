var app = app || {};

(function () {
    'use strict';

    app.DrawingSidebarView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'drawing-sidebar',
        template: app.templates['drawing-windows/drawing-sidebar-view'],
        ui: {
            '$select': '.selectpicker',
            '$prev': '.js-prev-window',
            '$next': '.js-next-window'
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

            this.listenTo(this.options.parent_view.active_window, 'all', this.render);
        },
        selectWindow: function (model) {
            this.$el.trigger({
                type: 'window-selected',
                model: model
            });

            this.render();
        },
        onChange: function () {
            this.selectWindow(this.collection.get(this.ui.$select.val()));
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
            var collection_size = this.serializeData().window_list.length;
            var next_index;

            if ( collection_size > 1 && this.options.parent_view.active_window ) {
                next_index = this.collection.indexOf(this.options.parent_view.active_window) + 1;

                if ( next_index >= collection_size ) {
                    next_index = 0;
                }

                this.selectWindow(this.collection.at(next_index));
            }
        },
        onPrevBtn: function () {
            var collection_size = this.serializeData().window_list.length;
            var prev_index;

            if ( collection_size > 1 && this.options.parent_view.active_window ) {
                prev_index = this.collection.indexOf(this.options.parent_view.active_window) - 1;

                if ( prev_index < 0 ) {
                    prev_index = collection_size - 1;
                }

                this.selectWindow(this.collection.at(prev_index));
            }
        },
        getActiveWindowImage: function () {
            var active_window_image = null;

            if ( this.options.parent_view.active_window &&
                 this.options.parent_view.active_window.get('customer_image')
            ) {
                active_window_image = this.options.parent_view.active_window.get('customer_image');
            }

            return active_window_image;
        },
        getActiveWindowProperties: function () {
            var active_window_properties = [];
            var active_window;

            var relevant_properties = [
                'mark', 'width', 'height', 'type', 'description', 'notes',
                'internal_color', 'external_color', 'gasket_color', 'uw',
                'glazing', 'hinge_style', 'opening_direction', 'internal_sill',
                'external_sill'
            ];

            if ( this.options.parent_view.active_window ) {
                active_window = this.options.parent_view.active_window;
                _.each(relevant_properties, function (item) {
                    active_window_properties.push({
                        title: active_window.getTitles([item]),
                        value: active_window.get(item)
                    });
                });
            }

            return active_window_properties;
        },
        getActiveWindowProfileProperties: function () {
            var active_window_profile_properties = [];
            var active_window_profile;

            var relevant_properties = [
                'name', 'unitType', 'system', 'frameWidth', 'mullionWidth',
                'sashFrameWidth', 'sashFrameOverlap', 'sashMullionOverlap',
                'lowThreshold'
            ];

            if ( this.options.parent_view.active_window &&
                 this.options.parent_view.active_window.profile
            ) {
                active_window_profile = this.options.parent_view.active_window.profile;
                _.each(relevant_properties, function (item) {
                    active_window_profile_properties.push({
                        title: active_window_profile.getTitles([item]),
                        value: active_window_profile.get(item)
                    });
                });
            }

            return active_window_profile_properties;
        },
        serializeData: function () {
            return {
                window_list: this.collection.map(function (item) {
                    return {
                        is_selected: this.options.parent_view.active_window &&
                            item.cid === this.options.parent_view.active_window.cid,
                        reference_id: item.getRefNum(),
                        cid: item.cid,
                        mark: item.get('mark'),
                        dimensions: app.utils.format.dimensions(item.get('width'), item.get('height'), 'fraction')
                    };
                }, this),
                active_window_properties: this.getActiveWindowProperties(),
                active_window_profile_properties: this.getActiveWindowProfileProperties(),
                active_window_image: this.getActiveWindowImage()
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
