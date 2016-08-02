var app = app || {};

(function () {
    'use strict';

    app.OptionsView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'options-main-container',
        template: false,
        initialize: function () {
            this.active_item = undefined;

            this.dictionary_list_view = new app.OptionsDictionaryListView({
                collection: this.collection,
                active_item: this.active_item,
                parent_view: this
            });
        },
        setActiveItem: function (model) {
            this.active_item = model;
            this.render();
        },
        getActiveItem: function () {
            return this.active_item;
        },
        onRender: function () {
            if ( this.dictionary_list_view ) {
                this.$el.append(this.dictionary_list_view.render().el);
            }

            if ( this.active_item ) {
                if ( this.dictionary_view ) {
                    this.dictionary_view.destroy();
                }

                this.dictionary_view = new app.OptionsDictionaryView({
                    model: this.active_item
                });

                this.$el.append(this.dictionary_view.render().el);
            }
        },
        onDestroy: function () {
            if ( this.dictionary_list_view ) {
                this.dictionary_list_view.destroy();
            }

            if ( this.dictionary_view ) {
                this.dictionary_view.destroy();
            }
        }
    });
})();
