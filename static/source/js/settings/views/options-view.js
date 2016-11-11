var app = app || {};

(function () {
    'use strict';

    app.OptionsView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'options-main-container',
        template: false,
        onRender: function () {
            if ( this.dictionary_list_view ) {
                this.$el.append(this.dictionary_list_view.render().el);
                this.renderActiveItemView(this.dictionary_list_view.getActiveItem());
            }
        },
        renderActiveItemView: function (active_item) {
            if ( this.dictionary_view ) {
                this.dictionary_view.destroy();
            }

            if ( active_item ) {
                this.dictionary_view = new app.OptionsDictionaryView({
                    model: active_item
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
        },
        initialize: function () {
            this.dictionary_list_view = new app.SidebarListView({
                collection: this.collection,
                placeholder: 'New Dictionary',
                collection_title: 'Options Dictionaries',
                single_item_name: 'dictionary',
                multiple_items_name: 'dictionaries'
            });

            this.listenTo(this.dictionary_list_view, 'set_active_item', function (options) {
                this.renderActiveItemView(options.item);
            });
        }
    });
})();
