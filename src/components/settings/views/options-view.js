import Marionette from 'backbone.marionette';

import SidebarListView from '../../../core/views/base/sidebar-list-view';
import OptionsDictionaryView from './options-dictionary-view';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'options-main-container',
    template: false,
    onRender() {
        if (this.dictionary_list_view) {
            this.$el.append(this.dictionary_list_view.render().el);
            this.renderActiveItemView(this.dictionary_list_view.getActiveItem());
        }
    },
    renderActiveItemView(active_item) {
        if (this.dictionary_view) {
            this.dictionary_view.destroy();
        }

        if (active_item) {
            this.dictionary_view = new OptionsDictionaryView({
                model: active_item,
            });

            this.$el.append(this.dictionary_view.render().el);
        }
    },
    onBeforeDestroy() {
        if (this.dictionary_list_view) {
            this.dictionary_list_view.destroy();
        }

        if (this.dictionary_view) {
            this.dictionary_view.destroy();
        }
    },
    initialize() {
        this.dictionary_list_view = new SidebarListView({
            collection: this.collection,
            placeholder: 'New Dictionary',
            collection_title: 'Options Dictionaries',
            single_item_name: 'dictionary',
            multiple_items_name: 'dictionaries',
        });

        this.listenTo(this.dictionary_list_view, 'set_active_item', function (options) {
            this.renderActiveItemView(options.item);
        });
    },
});
