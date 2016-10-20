var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryListItemView = Marionette.View.extend({
        tagName: 'li',
        className: 'options-list-item',
        template: app.templates['settings/options-dictionary-list-item-view'],
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
            var placeholder = this.options.placeholder || 'New Dictionary';
            var name = this.model.get('name') || '';

            return {
                is_active: active_item && active_item === this.model,
                readable_name: name || placeholder,
                show_placeholder: !name && placeholder
            };
        }
    });
})();
