var app = app || {};

(function () {
    'use strict';

    app.QuotesEditorTableView = Marionette.CollectionView.extend({
        tagName: 'tbody',
        childView: app.QuotesEditorTableItemView
    });
})();
