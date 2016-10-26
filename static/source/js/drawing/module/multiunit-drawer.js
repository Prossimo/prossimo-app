var app = app || {};

(function () {
    'use strict';

    var self;

    var module;
    var model;
    var previewUIGap = 64;
    var previewOpacity = 0.4;

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

            activateSubunitDrawer(model.activeSubunit);
            model.activeSubunit.drawer.render();

            var explodedCoords = this.explode(model.subunits, {center: model.activeSubunit});

            model.subunits.each(function (subunit) {
                if (subunit === model.activeSubunit) { return; }

                var previewImage = app.preview(subunit, {
                    width: subunit.getInMetric('width', 'mm') * module.get('ratio'),
                    height: subunit.getInMetric('height', 'mm') * module.get('ratio'),
                    mode: 'image',
                    position: (module.getState('insideView')) ? 'inside' : 'outside',
                    metricSize: module.get('metricSize') / 2,
                    preview: true
                });
                self.addPreview(previewImage, {
                    x: model.get('multiunit_subunits')[subunit.getId()][0],
                    y: model.get('multiunit_subunits')[subunit.getId()][1]
                });
            });
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
        },
        explode: function (units, options) {
            if (!options.center instanceof app.Baseunit) { throw new Error('Central unit required'); }

            // FIXME implement
        },
        addPreview: function (image, options) {
            var activeBorders = model.activeSubunit.getDrawingBorders();

            // Add gap if preview is not
            var gapifiedX = activeBorders.left

            var konvaImage = new Konva.Image({
                image: image,
                x: centerX + options.x,
                y: centerY + options.y,
                opacity: previewOpacity
            });
            this.layer.add(konvaImage);
            this.layer.draw();
        }
    });

})();
