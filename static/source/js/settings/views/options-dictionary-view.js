var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'options-dictionary',
        template: app.templates['settings/options-dictionary-view'],
        ui: {
            $name_container: '.dictionary-name',
            $entries_container: '.entry-table-container'
        },
        serializeData: function () {
            return {
                name: this.model.get('name')
            };
        },
        initialize: function () {
            this.name_input_view = new app.BaseInputView({
                model: this.model,
                param: 'name',
                input_type: 'text'
            });

            this.entries_table_view = new app.OptionsDictionaryEntriesTableView({
                collection: this.model.entries
            });
        },
        onRender: function () {
            this.ui.$name_container.append(this.name_input_view.render().el);
            this.ui.$entries_container.append(this.entries_table_view.render().el);
        },
        onDestroy: function () {
            if ( this.name_input_view ) {
                this.name_input_view.destroy();
            }

            if ( this.entries_table_view ) {
                this.entries_table_view.destroy();
            }
        }
    });
})();
