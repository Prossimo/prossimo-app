import Marionette from 'backbone.marionette';
import SidebarListView from '../../../core/views/base/sidebar-list-view';
import FillingTypeView from './filling-type-view';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'filling-types-main-container',
    template: false,
    onRender: function () {
        if (this.fillings_list_view) {
            this.$el.append(this.fillings_list_view.render().el);
            this.renderActiveItemView(this.fillings_list_view.getActiveItem());
        }
    },
    renderActiveItemView: function (active_item) {
        if (this.filling_type_view) {
            this.filling_type_view.destroy();
        }

        if (active_item) {
            this.filling_type_view = new FillingTypeView({
                model: active_item
            });

            this.$el.append(this.filling_type_view.render().el);
        }
    },
    onBeforeDestroy: function () {
        if (this.fillings_list_view) {
            this.fillings_list_view.destroy();
        }

        if (this.filling_type_view) {
            this.filling_type_view.destroy();
        }
    },
    initialize: function () {
        this.fillings_list_view = new SidebarListView({
            collection: this.collection,
            placeholder: 'New Filling Type',
            collection_title: 'Filling Types',
            single_item_name: 'filling type',
            multiple_items_name: 'filling types',
            filter_condition: function (child) {
                return child.get('is_base_type') !== true;
            }
        });

        this.listenTo(this.fillings_list_view, 'set_active_item', function (options) {
            this.renderActiveItemView(options.item);
        });
    }
});
