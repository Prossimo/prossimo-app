import Marionette from 'backbone.marionette';
import template from '../../../templates/core/base/sidebar-list-item-view.hbs';

export default Marionette.View.extend({
    tagName: 'li',
    className: 'sidebar-list-item',
    template: template,
    events: {
        'click a': 'onItemClick'
    },
    initialize: function () {
        this.listenTo(this.model, 'change:name', this.render);
    },
    onItemClick: function () {
        this.options.parent_view.setActiveItem(this.model);
    },
    templateContext: function () {
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
