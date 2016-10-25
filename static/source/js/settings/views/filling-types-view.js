var app = app || {};

(function () {
    'use strict';

    app.FillingTypesView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'filling-types-main-container',
        template: false,
        setActiveItem: function (model) {
            if ( model ) {
                this.active_item = model;
            } else {
                this.active_item = undefined;
            }

            this.render();
        },
        getActiveItem: function () {
            return this.active_item;
        },
        onRender: function () {
            if ( this.fillings_list_view ) {
                this.$el.append(this.fillings_list_view.render().el);
            }

            if ( this.filling_type_view ) {
                this.filling_type_view.destroy();
            }

            if ( this.active_item ) {
                this.filling_type_view = new app.FillingTypeView({
                    model: this.active_item
                });

                this.$el.append(this.filling_type_view.render().el);
            }
        },
        onDestroy: function () {
            if ( this.fillings_list_view ) {
                this.fillings_list_view.destroy();
            }

            if ( this.filling_type_view ) {
                this.filling_type_view.destroy();
            }
        },
        initialize: function () {
            this.active_item = this.collection.at(0) || undefined;

            this.fillings_list_view = new app.SidebarListView({
                collection: this.collection,
                active_item: this.active_item,
                parent_view: this,
                placeholder: 'New Filling Type',
                collection_title: 'Filling Types',
                single_item_name: 'filling type',
                multiple_items_name: 'filling types'
            });

            //  Make next (or last) item in the collection active on remove
            this.listenTo(this.collection, 'remove', function (removed_items, collection, options) {
                var new_active_model = options.index && this.collection.at(options.index) || this.collection.last();

                this.setActiveItem(new_active_model);
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
