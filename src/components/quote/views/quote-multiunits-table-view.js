import Marionette from 'backbone.marionette';

import QuoteMultiunitsItemView from './quote-multiunits-item-view';

export default Marionette.CollectionView.extend({
    className: 'quote-multiunits-table-body',
    childView: QuoteMultiunitsItemView,
    reorderOnSort: true,
    childViewOptions() {
        return {
            extras: this.options.extras,
            project: this.options.project,
            units: this.options.units,
            quote: this.options.quote,
            display_options: this.options.display_options,
        };
    },
});
