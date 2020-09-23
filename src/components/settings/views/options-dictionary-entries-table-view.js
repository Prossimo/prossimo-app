import Marionette from 'backbone.marionette';
import OptionsDictionaryEntriesItemView from './options-dictionary-entries-item-view';

export default Marionette.CollectionView.extend({
    childView: OptionsDictionaryEntriesItemView,
    childViewOptions() {
        return {
            parent_view: this,
        };
    },
});
