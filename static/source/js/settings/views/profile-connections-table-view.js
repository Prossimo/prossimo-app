var app = app || {};

(function () {
    'use strict';

    app.ProfileConnectionsTableView = Marionette.CollectionView.extend({
        tagName: 'div',
        className: 'profile-connections-table',
        childView: app.ProfileConnectionsTableItemView
        // regions: {
        //     tbody: {
        //         el: 'tbody',
        //         replaceElement: true
        //     }
        // },
        // onRender: function () {
        //     this.showChildView('tbody', new TableBodyView({
        //         collection: this.collection
        //     }));
        // },
        // initialize: function () {
        //     console.log( 'collection', this.collection );
        // }
    });
})();
