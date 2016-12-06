var app = app || {};

(function () {
    'use strict';

    // var TableBodyView = Marionette.CollectionView.extend({
    //     tagName: 'tbody',
    //     className: 'connections-table-body',
    //     childView: app.ProfileConnectionsTableItemView,
    //     childViewContainer: '.table-container'
    // });

    // app.ProfileConnectionsTableView = Marionette.View.extend({
    //     tagName: 'div',
    //     className: 'profile-connections-table',
    //     template: app.templates['settings/profile-connections-table-view'],
    //     regions: {
    //         tbody: {
    //             el: 'tbody',
    //             replaceElement: true
    //         }
    //     },
    //     onRender: function () {
    //         this.showChildView('tbody', new TableBodyView({
    //             collection: this.collection
    //         }));
    //     },
    //     initialize: function () {
    //         console.log( 'collection', this.collection );
    //     }
    // });

    // var TableBodyView = Marionette.CollectionView.extend({
    //     tagName: 'tbody',
    //     className: 'connections-table-body',
    //     childView: app.ProfileConnectionsTableItemView,
    //     childViewContainer: '.table-container'
    // });

    app.ProfileConnectionsTableView = Marionette.CollectionView.extend({
        tagName: 'div',
        className: 'profile-connections-table',
        // template: app.templates['settings/profile-connections-table-view'],
        childView: app.ProfileConnectionsTableItemView,
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
        initialize: function () {
            console.log( 'collection', this.collection );
        }
    });
})();
