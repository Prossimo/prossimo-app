var app = app || {};

(function () {
    'use strict';

    app.MainDrawingWindowsView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'screen drawing-screen',
        template: app.templates['drawing-windows/main-drawing-windows-view'],
        ui: {
            '$drawing_container': '.drawing-container',
            '$sidebar_container': '.drawing-sidebar-container'
        },
        events: {
            'window-selected': 'onWindowSelected'
        },
        onWindowSelected: function (e) {
            this.stopListening(this.active_window);
            this.active_window = e.model;
            this.updateDrawingView(true);
        },
        listenWindow: function() {
            if (!this.active_window) {
                return;
            }
            this.listenTo(this.active_window, 'all', function() {
                this.sidebar_view.render();
            });
        },
        initialize: function () {
            //  Select first window by default
            this.active_window = app.current_project.windows.length ?
                app.current_project.windows.first() : null;
            this.listenWindow();
        },
        updateDrawingView: function (update_size_flag) {
            if ( this.active_window ) {
                this.drawing_view = new app.DrawingView({
                    parent_view: this,
                    model: this.active_window
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
                collection: app.current_project.windows,
                parent_view: this
            });

            this.ui.$sidebar_container.append(this.sidebar_view.render().el);
        }
    });
})();
