import Marionette from 'backbone.marionette';

import SidebarListView from '../../../core/views/base/sidebar-list-view';
import ProfileView from './profile-view';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'profiles-main-container',
    template: false,
    onRender() {
        if (this.profile_list_view) {
            this.$el.append(this.profile_list_view.render().el);
            this.renderActiveItemView(this.profile_list_view.getActiveItem());
        }
    },
    renderActiveItemView(active_item) {
        if (this.profile_view) {
            this.profile_view.destroy();
        }

        if (active_item) {
            this.profile_view = new ProfileView({
                model: active_item,
            });

            this.$el.append(this.profile_view.render().el);
        }
    },
    onBeforeDestroy() {
        if (this.profile_list_view) {
            this.profile_list_view.destroy();
        }

        if (this.profile_view) {
            this.profile_view.destroy();
        }
    },
    initialize() {
        this.profile_list_view = new SidebarListView({
            collection: this.collection,
            placeholder: 'New Profile',
            collection_title: 'Profiles',
            single_item_name: 'profile',
            multiple_items_name: 'profiles',
        });

        this.listenTo(this.profile_list_view, 'set_active_item', function (options) {
            this.renderActiveItemView(options.item);
        });
    },
});
