import _ from 'underscore';
import Marionette from 'backbone.marionette';

import ProfileConnectionsTableItemView from './profile-connections-table-item-view';

const template = _.template('<p>This item is not currently available for any profile.</p>');
const empty_view = Marionette.View.extend({
    template,
});

export default Marionette.CollectionView.extend({
    tagName: 'div',
    className: 'profile-connections-table',
    childView: ProfileConnectionsTableItemView,
    emptyView: empty_view,
    childViewOptions() {
        return {
            data_store: this.options.data_store,
        };
    },
});
