var app = app || {};

(function () {
    'use strict';

    app.DocumentSelectorView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'document-selector',
        template: app.templates['docs-import/document-selector-view'],
        ui: {
            '$select': '.selectpicker'
        },
        events: {
            'change @ui.$select': 'onChange'
        },
        onChange: function () {
            this.$el.trigger({
                type: 'document-selected',
                url: this.ui.$select.val()
            });
        },
        onRender: function () {
            this.ui.$select.selectpicker();
        },
        serializeData: function () {
            return {
                document_list: app.current_project.files.map(function (item) {
                    return {
                        is_selected: item.url === this.options.active_document_url,
                        name: item.get('name'),
                        type: item.get('type'),
                        url: item.get('url')
                    };
                }, this)
            };
        }
    });
})();
