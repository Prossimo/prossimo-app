var app = app || {};

(function () {
    'use strict';

    app.MultiunitCollection = app.BaseunitCollection.extend({
        model: app.Multiunit,
        reorder_property_name: 'multiunits',
        url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/multiunits';
        },
        reorder_url: function () {
            return app.settings.get('api_base_path') +
                '/projects/' + this.options.project.get('id') + '/reorder_multiunits';
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_unit = new app.Multiunit(null, { proxy: true });
            this.subunits = options.subunits;

            if (this.options.profile) {
                this.profile = this.options.profile;
            }

            if (this.subunits) {
                this.subunits.multiunits = this;
            }

            //  When parent project is fully loaded, we validate multiunit positions
            this.listenTo(this.options.project, 'fully_loaded', this.validatePositions);
        }
    });
})();
