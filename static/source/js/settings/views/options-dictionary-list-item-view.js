var app = app || {};

(function () {
    'use strict';

    app.OptionsDictionaryListItemView = Marionette.ItemView.extend({
        tagName: 'li',
        className: 'options-list-item',
        template: app.templates['settings/options-dictionary-list-item-view'],
        events: {
            'click a': 'onItemClick'
        },
        initialize: function () {
            this.listenTo(this.model, 'change:name', this.render);
        },
        onItemClick: function (e) {
            this.options.parent_view.setActiveItem(this.model);
        },
        serializeData: function () {
            var active_item = this.options.parent_view.getActiveItem();

            return {
                is_active: active_item && active_item === this.model,
                name: this.model.get('name')
            };
        }
    });
})();
