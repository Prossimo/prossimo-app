var app = app || {};

(function () {
    'use strict';

    app.DocumentSelectorView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'document-selector',
        template: app.templates['docs-import/document-selector-view'],
        events: {
            'click .dropdown-menu a': 'onClick'
        },
        onClick: function (e) {
            var $target = $(e.target);
            e.preventDefault();
            this.$el.trigger({
                type: 'document-selected',
                filename: $target.text(),
                url: $target.attr('href')
            });
        },
        onRender: function () {

        }
    });
})();
