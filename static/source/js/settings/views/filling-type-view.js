var app = app || {};

(function () {
    'use strict';

    app.FillingTypeView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'filling-type',
        //  TODO: actually use a template
        template: false,
        onRender: function () {
            this.$table = $('<table />');

            _.each(this.child_views, function (child_view) {
                var $row = $('<tr class="filling-type-attribute-container" />');

                $row.append('<td><h4 class="title">' + child_view.title + '</h4></td>');
                $('<td />').appendTo($row).append(child_view.view_instance.render().el);
                this.$table.append($row);
            }, this);

            this.$el.append(this.$table);
        },
        onDestroy: function () {
            _.each(this.child_views, function (child_view) {
                child_view.view_instance.destroy();
            }, this);
        },
        initialize: function () {
            this.attributes_to_render = this.model.getNameTitleTypeHash([
                'name', 'supplier_name', 'type', 'weight_per_area'
            ]);

            //  TODO: this should be attribute views or something like that
            this.child_views = _.map(this.attributes_to_render, function (attribute) {
                //  We use text inputs for most attributes except for "type"
                //  attribute where we want a selectbox
                //  TODO: selectbox should be capable of taking a hash array
                var view = attribute.name === 'type' ?
                    new app.BaseSelectView({
                        model: this.model,
                        param: 'type',
                        values: _.pluck(this.model.getBaseTypes(), 'name'),
                        multiple: false
                    }) :
                    //  TODO: use different html5 input types, why not
                    new app.BaseInputView({
                        model: this.model,
                        param: attribute.name,
                        input_type: 'text',
                        placeholder: attribute.name === 'name' ? 'New Filling Type' : ''
                    });

                return {
                    title: attribute.title,
                    view_instance: view
                };
            }, this);
        }
    });
})();
