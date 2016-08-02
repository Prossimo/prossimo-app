var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'options-dictionary',
        template: app.templates['settings/options-dictionary-view'],
        ui: {
            $name_container: '.dictionary-name'
        },
        serializeData: function () {
            return {
                name: this.model.get('name'),
                // entries: this.model.entries ? this.model.entries.map(function (entry) {
                //     return {
                //         id: entry.id,
                //         name: entry.get('name'),
                //         price: entry.get('price'),
                //         data: entry.get('data'),
                //         position: entry.get('position')
                //     };
                // }) : []
                //  TODO: this should be actual entries collection thing (like above), not an array
                entries: this.model.get('entries') ? this.model.get('entries').map(function (entry) {
                    return {
                        id: entry.id,
                        name: entry.name,
                        price: entry.price,
                        data: entry.data,
                        position: entry.position
                    };
                }) : []
            };
        },
        initialize: function () {
            this.name_input_view = new app.BaseInputView({
                model: this.model,
                param: 'name',
                input_type: 'text'
            });
        },
        onRender: function () {
            this.ui.$name_container.append(this.name_input_view.render().el);
        },
        onDestroy: function () {
            if ( this.name_input_view ) {
                this.name_input_view.destroy();
            }
        }
    });
})();
