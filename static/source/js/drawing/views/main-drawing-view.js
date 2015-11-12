var app = app || {};

(function () {
    'use strict';

    app.MainDrawingView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen drawing-screen',
        template: app.templates['drawing/main-drawing-view'],
        ui: {
            '$drawing_container': '.drawing-container',
            '$sidebar_container': '.drawing-sidebar-container'
        },
        events: {
            'unit-selected': 'onUnitSelected'
        },
        onUnitSelected: function (e) {
            this.active_unit = e.model;
            this.updateDrawingView(true);
        },
        initialize: function () {
            //  Select first unit by default
            this.active_unit = app.current_project.units.length ?
                app.current_project.units.first() : null;
        },
        updateDrawingView: function (update_size_flag) {
            if ( this.active_unit ) {
                this.drawing_view = new app.DrawingView({
                    parent_view: this,
                    model: this.active_unit
                });

                this.ui.$drawing_container.empty().append(this.drawing_view.render().el);

                if ( this._isShown && update_size_flag ) {
                    this.drawing_view.updateSize();
                    this.drawing_view.updateCanvas();
                }
            }
        },
        onRender: function () {
            this.updateDrawingView();

            this.sidebar_view = new app.DrawingSidebarView({
                collection: app.current_project.units,
                parent_view: this
            });

            this.ui.$sidebar_container.append(this.sidebar_view.render().el);
        }
    });
})();
