var app = app || {};

(function () {
    'use strict';
    var self;

    var module;
    var model;
    var stage;
    var layer;

    function activateSubunitDrawer(subunit) {
        var ActiveSubdrawerClass = self.selectSubDrawer(subunit);

        subunit.drawer = new ActiveSubdrawerClass({
            layer: layer,
            stage: stage,
            builder: module,
            metricSize: module.get('metricSize'),
            data: subunit
        });
    }

    app.Drawers = app.Drawers || {};
    app.Drawers.MultiunitDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            self = this;

            module = params.builder;
            model = module.get('model');
            model.set('root_section', model.generateFullRoot());

            stage = module.get('stage');
            layer = new Konva.Layer();
            stage.add(layer);
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            model.populateSubunits();
            model.activeSubunit = model.subunits.at(0);
            activateSubunitDrawer(model.activeSubunit);
            model.activeSubunit.drawer.render();
        },
        events: {
            'click #back': 'onBackClick',
            'tap #back': 'onBackClick'
        },
        // Handlers
        onBackClick: function () {},
        // Create elements
        // Create transparent background to detect click on empty space
        createBack: function () {
            var back = new Konva.Rect({
                id: 'back',
                width: this.stage.width(),
                height: this.stage.height()
            });

            return back;
        },
        selectSubDrawer: function (subunit) {
            var DrawerClass;

            if (subunit.trapezoid) {
                DrawerClass = app.Drawers.TrapezoidUnitDrawer;
            } else if (subunit.multiunit) {
                DrawerClass = app.Drawers.MultiunitDrawer;
            } else {
                DrawerClass = app.Drawers.UnitDrawer;
            }

            return DrawerClass;
        }
    });

})();
