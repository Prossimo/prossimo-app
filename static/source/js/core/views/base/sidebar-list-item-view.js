var app = app || {};

(function () {
    'use strict';

    app.SidebarListItemView = Marionette.ItemView.extend({
        tagName: 'li',
        className: 'sidebar-list-item',
        template: app.templates['core/base/sidebar-list-item-view'],
        events: {
            'click a': 'onItemClick'
        },
        initialize: function () {
            this.listenTo(this.model, 'change:name', this.render);
        },
        onItemClick: function () {
            this.options.parent_view.setActiveItem(this.model);
        },
        serializeData: function () {
            var active_item = this.options.parent_view.getActiveItem();
            var placeholder = this.options.placeholder || 'New Item';
            var name = this.model.get('name') || '';

            return {
                is_active: active_item && active_item === this.model,
                readable_name: name || placeholder,
                show_placeholder: !name && placeholder
            };
        }
    });
})();
