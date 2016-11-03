var app = app || {};

(function () {
    'use strict';

    var self;

    var module;
    var model;
    var origin;
    var previewOpacity = 1;

    function activateSubunitDrawer(subunit) {
        var ActiveSubdrawerClass = self.selectSubDrawer(subunit);

        subunit.drawer = new ActiveSubdrawerClass({
            layer: self.layer,
            stage: self.stage,
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

            this.layer = params.layer;
            this.stage = params.stage;
        },
        el: function () {
            var group = new Konva.Group();

            return group;
        },
        render: function () {
            model.populateSubunits();

            if (!model.activeSubunit) {
                var zeroPositionSubunitId = _.invert(model.get('multiunit_subunits'))['0,0'];

                model.activeSubunit = (zeroPositionSubunitId) ?
                    model.subunits.getById(zeroPositionSubunitId) :
                    model.subunits.at(0);
            }

            model.subunits.each(function (subunit) {
                var previewImage = app.preview(subunit, {
                    width: subunit.getInMetric('width', 'mm') * module.get('ratio'),
                    height: subunit.getInMetric('height', 'mm') * module.get('ratio'),
                    mode: 'image',
                    position: (module.getState('insideView')) ? 'inside' : 'outside',
                    metricSize: 0,
                    preview: true
                });
                self.addPreview(previewImage, {
                    x: model.getSubunitAttributesById(subunit.getId()).x,
                    y: model.getSubunitAttributesById(subunit.getId()).y,
                    opacity: previewOpacity
                });
            });
        },
        events: {
            'click #back': 'onBackClick',
            'tap #back': 'onBackClick'
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
        },
        addPreview: function (image, options) {
            var adjustedX;
            var adjustedY;
            var stageCenterX = this.stage.width() / 2;
            var stageCenterY = this.stage.height() / 2;
            var width = image.width;
            var height = image.height;

            // FIXME implement
        }
    });
})();
