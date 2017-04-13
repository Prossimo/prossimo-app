import Marionette from 'backbone.marionette';

import template from '../../../templates/core/base/sidebar-list-item-view.hbs';

export default Marionette.View.extend({
    tagName: 'li',
    className: 'sidebar-list-item',
    template,
    events: {
        'click a': 'onItemClick',
    },
    initialize() {
        this.listenTo(this.model, 'change:name', this.render);
    },
    onItemClick() {
        this.options.parent_view.setActiveItem(this.model);
    },
    templateContext() {
        const active_item = this.options.parent_view.getActiveItem();
        const placeholder = this.options.placeholder || 'New Item';
        const name = this.model.get('name') || '';

        return {
            is_active: active_item && active_item === this.model,
            readable_name: name || placeholder,
            show_placeholder: !name && placeholder,
        };
    },
});
