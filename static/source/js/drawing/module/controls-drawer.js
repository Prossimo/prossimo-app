var app = app || {};

(function () {
    'use strict';

    app.Drawers = app.Drawers || {};
    app.Drawers.ControlsDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            this.layer = params.layer;
        },
        el: function () {
            var group = new Konva.Group();

            // var rect = new Konva.Rect({
            //     width: 300, height: 300,
            //     x: 100, y: 100,
            //     fill: 'red'
            // });

            // group.add(rect);

            return group;
        },
        render: function () {
            this.layer.add(this.el);
            this.layer.draw();
        }
    });

})();
