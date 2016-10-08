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
            $remove: '.js-remove-dictionary'
        },
        events: {
            'click @ui.$remove': 'onRemove'
        },
        onRemove: function () {
            this.model.destroy();
        },
        initialize: function () {
            this.should_make_everything_editable = this.shouldMakeEverythingEditable();

            this.name_input_view = new app.BaseInputView({
                model: this.model,
                param: 'name',
                input_type: 'text',
                placeholder: 'New Dictionary'
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

            this.listenTo(this.model, 'change:name', this.onChangeName);
        },
        onChangeName: function () {
            if ( this.should_make_everything_editable !== this.shouldMakeEverythingEditable() ) {
                this.should_make_everything_editable = this.shouldMakeEverythingEditable();
                this.renderElements();
            }
        },
        shouldMakeEverythingEditable: function () {
            return !this.model.hasOnlyDefaultAttributes();
        },
        renderElements: function () {
            if ( this.should_make_everything_editable ) {
                this.ui.$entries_container.empty().append(this.entries_table_view.render().el);
                this.rules_and_restrictions_view.enable();
            } else {
                this.ui.$entries_container.empty().append(
                    '<p>Please set dictionary name before adding option variants.</p>'
                );
                this.rules_and_restrictions_view.disable();
            }
        },
        onRender: function () {
            this.ui.$name_container.append(this.name_input_view.render().el);
            this.ui.$rules_and_restrictions_container.append(this.rules_and_restrictions_view.render().el);

            this.renderElements();
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
