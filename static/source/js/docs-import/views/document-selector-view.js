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
        onChange: function (e) {
            this.$el.trigger({
                type: 'document-selected',
                url: this.ui.$select.val()
            });
        },
        onRender: function () {
            this.ui.$select.selectpicker();
        },
        initialize: function () {
            //  TODO: the list should be loaded from a `current_project`
            //  An unique identifier here is `url`
            this.document_list = [
                {
                    name: 'developer-specs-REV1_2_Public.pdf',
                    url: '/test/pdf/developer-specs-REV1_2_Public.pdf'
                },
                {
                    name: 'helloworld.pdf',
                    url: '/test/pdf/helloworld.pdf'
                }
            ];
        },
        serializeData: function () {
            return {
                document_list: _.map(this.document_list, function (item) {
                    item.is_selected = item.url === this.options.active_document_url;
                    return item;
                }, this)
            };
        }
    });
})();
