var app = app || {};

(function () {
    'use strict';

    app.OptionsView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'options-main-container',
        template: false,
        setActiveItem: function (model) {
            if ( model ) {
                this.active_item = model;
                this.render();
            }
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
        },
        initialize: function () {
            this.active_item = this.collection.at(0) || undefined;

            this.dictionary_list_view = new app.OptionsDictionaryListView({
                collection: this.collection,
                active_item: this.active_item,
                parent_view: this
            });

            //  Make first item in the collection active on current item remove
            this.listenTo(this.collection, 'remove', function () {
                this.setActiveItem(this.collection.at(0));
            });

            //  If new item was added to an empty collection, make it active
            this.listenTo(this.collection, 'add', function () {
                if ( this.collection.length === 1 ) {
                    this.setActiveItem(this.collection.at(0));
                }
            });
        }
    });
})();
