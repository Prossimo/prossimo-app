var app = app || {};

(function () {
    'use strict';

    var module;
    var model;
    var stage;
    var layer;
    var subModels;
    var activeSubModel;
    var ActiveSubDrawer;

    app.Drawers = app.Drawers || {};
    app.Drawers.MultiunitDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            module = params.builder;
            model = module.get('model');
            model.set('root_section', model.generateFullRoot());
            subModels = model.get('root_section').subModels;
            activeSubModel = subModels[0];
            ActiveSubDrawer = this.selectSubDrawer(activeSubModel);

            stage = module.get('stage');
            layer = new Konva.Layer();
            stage.add(layer);

            activeSubModel.drawer = new ActiveSubDrawer({
                layer: layer,
                stage: stage,
                builder: module,
                metricSize: module.get('metricSize'),
                data: activeSubModel
            });
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            activeSubModel.drawer.render();
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
        selectSubDrawer: function (subModel) {
            var DrawerClass;

            if (subModel.trapezoid) {
                DrawerClass = app.Drawers.TrapezoidUnitDrawer;
            } else if (subModel.multiunit) {
                DrawerClass = app.Drawers.MultiunitDrawer;
            } else {
                DrawerClass = app.Drawers.UnitDrawer;
            }

            return DrawerClass;
        }
    });

})();
