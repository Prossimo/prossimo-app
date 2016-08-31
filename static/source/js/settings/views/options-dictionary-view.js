var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'options-dictionary',
        template: app.templates['settings/options-dictionary-view'],
        ui: {
            $name_container: '.dictionary-name',
            $rules_and_restrictions_container: '.dictionary-restrictions',
            $entries_container: '.entry-table-container',
            $remove: '.js-remove-dictionary',
            $clone: '.js-clone-dictionary'
        },
        events: {
            'click @ui.$remove': 'onRemove',
            'click @ui.$clone': 'onClone'
        },
        onRemove: function () {
            this.model.destroy();
        },
        initialize: function () {
            this.name_input_view = new app.BaseInputView({
                model: this.model,
                param: 'name',
                input_type: 'text'
            });

            this.rules_and_restrictions_view = new app.BaseSelectView({
                model: this.model,
                param: 'rules_and_restrictions',
                values: this.model.getPossibleRulesAndRestrictions(),
                multiple: true
            });

            this.entries_table_view = new app.OptionsDictionaryEntriesTableView({
                collection: this.model.entries
            });
        },
        onRender: function () {
            this.ui.$name_container.append(this.name_input_view.render().el);
            this.ui.$rules_and_restrictions_container.append(this.rules_and_restrictions_view.render().el);
            this.ui.$entries_container.append(this.entries_table_view.render().el);
        },
        onDestroy: function () {
            if ( this.name_input_view ) {
                this.name_input_view.destroy();
            }

            if ( this.rules_and_restrictions_view ) {
                this.rules_and_restrictions_view.destroy();
            }

            if ( this.entries_table_view ) {
                this.entries_table_view.destroy();
            }
        }
    });
})();
