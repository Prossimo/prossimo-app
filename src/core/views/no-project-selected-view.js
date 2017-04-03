import Marionette from 'backbone.marionette';

import template from '../../templates/core/no-project-selected-view.hbs';

export default Marionette.View.extend({
    tagName: 'div',
    className: 'screen no-project-selected-screen',
    template: template
});
