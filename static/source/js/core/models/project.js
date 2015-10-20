var app = app || {};

(function () {
    'use strict';

    app.Project = Backbone.Model.extend({
        defaults: {
            pipedrive_id: null,
            client_name: '',
            client_company_name: '',
            client_phone: '',
            client_email: '',
            client_address: '',
            project_name: '',
            project_address: ''
        },
        initialize: function () {
            this.windows = new app.WindowCollection();
            this.project_files = [];
        }
    });
})();
