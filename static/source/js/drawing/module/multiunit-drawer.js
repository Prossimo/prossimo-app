var app = app || {};

(function () {
    'use strict';

    var module;
    var model;
    var ratio;

    app.Drawers = app.Drawers || {};
    app.Drawers.MultiunitDrawer = Backbone.KonvaView.extend({
        initialize: function (params) {
            module = params.builder;

            this.layer = params.layer;
            this.stage = params.stage;

            model = module.get('model');
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
            this.layer.add( this.createUnit() );
            // Draw layer
            this.layer.draw();

            // Detaching and attching events
            this.undelegateEvents();
            this.delegateEvents();
        },
        events: {
            'click #back': 'onBackClick',
            'tap #back': 'onBackClick'
        },
        // Utils
        // Functions search for Konva Object inside object with specified name
        // And rises up to the parents recursively
        getSectionId: function (object) {
            if ('sectionId' in object.attrs) {
                return object;
            } else if (object.parent) {
                return this.getSectionId(object.parent);
            }

            return false;
        },
        // Handlers
        onBackClick: function () {
            console.log('uhh');
        },
        // Create unit
        createUnit: function () {
            var group = this.el;

            var center = module.get('center');
            // place unit on stage center
            group.position( center );

            return group;
        },
        // Create elements
        // Create transparent background to detect click on empty space
        createBack: function () {
            var back = new Konva.Rect({
                id: 'back',
                width: this.stage.width(),
                height: this.stage.height()
            });

            return back;
        }
    });

})();
