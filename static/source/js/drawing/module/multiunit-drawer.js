var app = app || {};

(function () {
    'use strict';

    var self;

    var module;
    var model;
    var previewOpacity = 1;

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
            var subunitIds = model.get('multiunit_subunits');

            subunitIds.forEach(function (id, index) {
                var subunit = model.subunits.getById(id);

                var previewImage = app.preview(subunit, {
                    width: subunit.getInMetric('width', 'mm') * module.get('ratio'),
                    height: subunit.getInMetric('height', 'mm') * module.get('ratio'),
                    mode: 'image',
                    position: (module.getState('insideView')) ? 'inside' : 'outside',
                    metricSize: 0,
                    preview: true
                });
                model.getSubunitParentConnector(id);
                self.addPreview(previewImage, {
                    isOrigin: (index === 0),
                    // parent: ,
                    opacity: previewOpacity
                });
            });


            // FIXME implement
        },
        events: {
            'click #back': 'onBackClick',
            'tap #back': 'onBackClick'
        },
        addPreview: function (image, options) {
            var adjustedX;
            var adjustedY;
            var stageCenterX = this.stage.width() / 2;
            var stageCenterY = this.stage.height() / 2;
            var width = image.width;
            var height = image.height;

            adjustedX = stageCenterX - width / 2;
            adjustedY = stageCenterY - height / 2;

            var konvaImage = new Konva.Image({
                image: image,
                x: adjustedX,
                y: adjustedY,
                opacity: options.opacity
            });
            this.layer.add(konvaImage);
            this.layer.draw();

            // FIXME implement
        }
    });
})();
