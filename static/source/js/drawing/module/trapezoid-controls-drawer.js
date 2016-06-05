var app = app || {};

(function () {
    'use strict';

    var module;
    var model;
    var metricSize;
    var controlSize;
    var ratio;

    app.Drawers = app.Drawers || {};
    app.Drawers.TrapezoidControlsDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            module = params.builder;

            this.layer = params.layer;
            this.stage = params.stage;

            model = module.get('model');
            metricSize = params.metricSize;
            controlSize = metricSize / 4;
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            ratio = module.get('ratio');

            // Clear all previous objects
            this.layer.destroyChildren();
            // Creating unit and adding it to layer
            this.layer.add( this.createControls() );
            // Draw layer
            this.layer.draw();

            // Detaching and attaching events
            this.undelegateEvents();
            this.delegateEvents();
        },
        events: {

        },

        createControls: function () {
            var group = this.el;

            if (model.isTrapezoidPossible()) {
                console.log('Trapezoid!', model.generateFullRoot(), module);
            }

            return group;
        }
    });

})();
