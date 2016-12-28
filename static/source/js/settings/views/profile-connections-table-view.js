var app = app || {};

(function () {
    'use strict';

    var empty_view = Marionette.View.extend({
        template: _.template('<p>This item is not currently available for any profile.</p>')
    });

    app.ProfileConnectionsTableView = Marionette.CollectionView.extend({
        tagName: 'div',
        className: 'profile-connections-table',
        childView: app.ProfileConnectionsTableItemView,
        emptyView: empty_view
    });
})();
