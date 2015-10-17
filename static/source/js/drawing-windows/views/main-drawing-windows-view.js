var app = app || {};

(function () {
    'use strict';

    app.MainDrawingWindowsView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['drawing-windows/main-drawing-windows-view'],
        initialize: function () {
            //  README: This is for development purposes. In real app we would
            //  probably use a top-level instance of `WindowCollection`
            //  containing collection of `Window` models, and each instance of
            //  `Window` would probably have a `WindowDrawing` stored inside
            this.active_drawing = new app.WindowDrawing();
        }
    });
})();
