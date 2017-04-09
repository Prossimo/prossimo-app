import _ from 'underscore';
import Sortable from 'sortablejs';

import Marionette from 'backbone.marionette';
import SidebarListItemView from './sidebar-list-item-view';
import template from '../../../templates/core/base/sidebar-list-view.hbs';

export default Marionette.CompositeView.extend({
    tagName: 'div',
    className: 'sidebar-list-panel',
    template,
    childView: SidebarListItemView,
    childViewContainer: '.sidebar-list-container',
    childViewOptions() {
        return {
            parent_view: this,
            placeholder: this.options.placeholder || undefined,
        };
    },
    filter() {
        return this.filter_condition ? this.filter_condition.apply(this, arguments) : true;
    },
    ui: {
        $container: '.sidebar-list-container',
        $add_new_item: '.js-add-new-item',
    },
    events: {
        'click @ui.$add_new_item': 'addNewItem',
    },
    addNewItem(e) {
        const new_position = this.collection.length ? this.collection.getMaxPosition() + 1 : 0;

        e.stopPropagation();
        this.collection.add([{
            position: new_position,
        }]);
        this.ui.$add_new_item.blur();
        this.render();
    },
    setActiveItem(model) {
        if (model) {
            this.active_item = model;
        } else {
            this.active_item = undefined;
        }

        this.trigger('set_active_item', {
            item: this.active_item,
        });
        this.render();
    },
    getActiveItem() {
        return this.active_item;
    },
    onSort(event) {
        this.collection.setItemPosition(event.oldIndex, event.newIndex);
    },
    templateContext() {
        return {
            collection_length: this.collection.length,
            collection_title: this.options.collection_title || 'Items List',
            single_item_name: this.options.single_item_name || 'item',
            multiple_items_name: this.options.multiple_items_name || 'items',
        };
    },
    onRender() {
        const self = this;

        this.sortable = new Sortable(this.ui.$container[0], {
            draggable: '.sidebar-list-item',
            onSort(event) {
                self.onSort(event);
            },
        });
    },
    onBeforeDestroy() {
        this.sortable.destroy();
    },
    initialize() {
        this.filter_condition = this.options.filter_condition || false;
        this.active_item = this.filter_condition ?
            this.collection.filter(this.filter_condition)[0] :
            this.collection.at(0);

        //  Make next (or last) item in the collection active on remove
        this.listenTo(this.collection, 'remove', function (removed_items, collection, options) {
            const filtered_collection = this.filter_condition ?
                this.collection.filter(this.filter_condition) :
                this.collection.models;
            let new_active_model;

            //  Try to select the next item in collection after the removed item
            if (options.index || options.index === 0) {
                new_active_model = collection.rest(options.index).find(item => _.contains(filtered_collection, item));
            }

            //  Try to select the last item in the collection
            if (!new_active_model) {
                new_active_model = _.last(filtered_collection);
            }

            this.setActiveItem(new_active_model);
        });

        //  If new item was added to an empty collection, make it active
        this.listenTo(this.collection, 'add', function () {
            const filtered_collection = this.filter_condition ?
                this.collection.filter(this.filter_condition) :
                this.collection.models;

            if (filtered_collection.length === 1) {
                this.setActiveItem(_.first(filtered_collection));
            }
        });
    },
});
