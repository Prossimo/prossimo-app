var app = app || {};

(function () {
    'use strict';

    app.ProfileConnectionsTableView = Marionette.CollectionView.extend({
        tagName: 'div',
        className: 'profile-connections-table',
        childView: app.ProfileConnectionsTableItemView
    });
})();
