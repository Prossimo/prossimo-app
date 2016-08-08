var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryEntriesItemView = Marionette.ItemView.extend({
        tagName: 'tr',
        className: 'options-dictionary-entries-item',
        template: app.templates['settings/options-dictionary-entries-item-view'],
        ui: {
            $name_container: '.entry-name'
        },
        events: {
            'click .js-edit-entry-profiles': 'editProfiles',
            'click .js-remove-entry': 'removeEntry'
        },
        editProfiles: function () {
            app.dialogs.showDialog('options-profiles-table', {
                active_entry: this.model
            });
        },
        removeEntry: function () {
            this.model.destroy();
        },
        serializeData: function () {
            return {
                name: this.model.get('name'),
                //  TODO: we need a function to get a nice list of
                //  profile names
                profiles: this.model.get('profiles') ? this.model.get('profiles').sort().join(', ') : '--'
            };
        },
        initialize: function () {
            this.name_input_view = new app.BaseInputView({
                model: this.model,
                param: 'name',
                input_type: 'text'
            });

            //  TODO: render on profiles change, but probably have some nicer way to do this
            // this.listenTo(this.model, 'change', this.render);
        },
        onRender: function () {
            this.ui.$name_container.empty().append(this.name_input_view.render().el);
        },
        onDestroy: function () {
            if ( this.name_input_view ) {
                this.name_input_view.destroy();
            }
        }
    });
})();
