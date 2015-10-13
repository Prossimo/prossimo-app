var app = app || {};

(function () {
    'use strict';

    //  Window properties that could be copied from a spreadsheet or a PDF
    app.Window = Backbone.Model.extend({
        defaults: {
            dimensions: "",
            quantity: 0,
            type: "",
            description: "",
            customer_image: "",
            drawing: "",
            supplier_image: ""
        }
    });
})();
