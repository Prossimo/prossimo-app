var app = app || {};

(function () {
    'use strict';

    app.RequestTableView = Marionette.CompositeView.extend({
        template: app.templates['supplier-request/request-table-view'],
        childView: app.RequestItemView,
        childViewContainer: '.supplier-request-table-body',
        ui: {
            '$extras_table_container': '.supplier-request-extras-table-container',
            '$optional_extras_table_container': '.supplier-request-optional-extras-table-container'
        },
        childViewOptions: function () {
            return {
                extras: this.options.extras,
                project: this.options.project
            };
        },
        initialize: function () {
            this.listenTo(this.collection, 'all', this.render);
            this.listenTo(this.options.extras, 'all', this.render);
        },
        getRequestTableAttributes: function () {
            var name_title_hash = {
                ref: 'Ref.',
                product_image: 'Product Image',
                product_description: 'Product Description',
                quantity: 'Quantity'
            };

            var table_attributes = _.map(name_title_hash, function (item, key) {
                return { name: key, title: item };
            }, this);

            return table_attributes;
        },
        serializeData: function () {
            return {
                table_attributes: this.getRequestTableAttributes(),
                has_extras: this.options.extras &&
                    this.options.extras.getRegularItems().length ||
                    this.options.extras.getOptionalItems().length
            };
        },
        onRender: function () {
            if ( this.serializeData().has_extras ) {
                var request_extras_table_view = new app.RequestExtrasTableView({
                    collection: this.options.extras,
                    type: 'Regular'
                });

                var request_optional_extras_table_view = new app.RequestExtrasTableView({
                    collection: this.options.extras,
                    type: 'Optional'
                });

                this.ui.$extras_table_container.append(request_extras_table_view.render().el);
                this.ui.$optional_extras_table_container.append(request_optional_extras_table_view.render().el);
            }
        }
    });
})();
