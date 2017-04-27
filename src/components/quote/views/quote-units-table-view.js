import Marionette from 'backbone.marionette';

import QuoteUnitsItemView from './quote-units-item-view';

export default Marionette.CollectionView.extend({
    className: 'quote-units-table-body',
    childView: QuoteUnitsItemView,
    reorderOnSort: true,
    filter(...args) {
        return this.options.filter ? this.options.filter(...args) : true;
    },
    childViewOptions() {
        return {
            extras: this.options.extras,
            project: this.options.project,
            quote: this.options.quote,
            display_options: this.options.display_options,
        };
    },
});
