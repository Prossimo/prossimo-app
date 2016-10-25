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
            this.options.parent_view.setActiveItem(model);
        },
        getActiveItem: function () {
            return this.options.parent_view.getActiveItem();
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
        }
    });
})();
