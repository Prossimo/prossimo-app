var app = app || {};

(function () {
    'use strict';

    app.DrawingSidebarView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'drawing-sidebar',
        template: app.templates['drawing-windows/drawing-sidebar-view'],
        ui: {
            '$select': '.selectpicker'
        },
        events: {
            'change @ui.$select': 'onChange'
        },
        onChange: function () {
            this.$el.trigger({
                type: 'window-selected',
                model: this.collection.get(this.ui.$select.val())
            });

            this.render();
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
        //  TODO: improve this function
        getActiveWindowProperties: function () {
            var active_window_properties = {};

            if ( this.options.parent_view.active_window ) {
                active_window_properties = this.options.parent_view.active_window.toJSON();
                delete active_window_properties.customer_image;
            }

            return active_window_properties;
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
                active_window_image: this.getActiveWindowImage()
            };
        },
        onRender: function () {
            this.ui.$select.selectpicker({
                showSubtext: true
            });
        }
    });
})();
