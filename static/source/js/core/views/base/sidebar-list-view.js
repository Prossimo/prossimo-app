var app = app || {};

(function () {
    'use strict';

    app.SidebarListView = Marionette.CompositeView.extend({
        tagName: 'div',
        className: 'sidebar-list-panel',
        template: app.templates['core/base/sidebar-list-view'],
        childView: app.SidebarListItemView,
        childViewContainer: '.sidebar-list-container',
        childViewOptions: function () {
            return {
                parent_view: this,
                placeholder: this.options.placeholder || undefined
            };
        },
        filter: function () {
            return this.filter_condition ? this.filter_condition.apply(this, arguments) : true;
        },
        ui: {
            $container: '.sidebar-list-container',
            $add_new_item: '.js-add-new-item'
        },
        events: {
            'click @ui.$add_new_item': 'addNewItem'
        },
        addNewItem: function (e) {
            var new_position = this.collection.length ? this.collection.getMaxPosition() + 1 : 0;

            e.stopPropagation();
            this.collection.add([{
                position: new_position
            }]);
            this.ui.$add_new_item.blur();
            this.render();
        },
        setActiveItem: function (model) {
            if ( model ) {
                this.active_item = model;
            } else {
                this.active_item = undefined;
            }

            this.trigger('set_active_item', {
                item: this.active_item
            });
            this.render();
        },
        getActiveItem: function () {
            return this.active_item;
        },
        onSort: function (event) {
            this.collection.setItemPosition(event.oldIndex, event.newIndex);
        },
        serializeData: function () {
            return {
                collection_length: this.collection.length,
                collection_title: this.options.collection_title || 'Items List',
                single_item_name: this.options.single_item_name || 'item',
                multiple_items_name: this.options.multiple_items_name || 'items'
            };
        },
        onRender: function () {
            var self = this;

            this.ui.$container.sortable({
                draggable: '.sidebar-list-item',
                onSort: function (event) {
                    self.onSort(event);
                }
            });
        },
        onDestroy: function () {
            this.ui.$container.sortable('destroy');
        },
        initialize: function () {
            this.active_item = this.collection.at(0) || undefined;
            this.filter_condition = this.options.filter_condition || false;

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
