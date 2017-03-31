import Marionette from 'backbone.marionette';
import EquationParamsItemView from './equation-params-item-view';

export default Marionette.CollectionView.extend({
    className: 'equation-params-container',
    tagName: 'div',
    childView: EquationParamsItemView
});
