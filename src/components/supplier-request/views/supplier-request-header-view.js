import Marionette from 'backbone.marionette';

import template from '../templates/supplier-request-header-view.hbs';

export default Marionette.View.extend({
    template: template,
    initialize: function () {
        this.listenTo(this.model, 'all', this.render);
    }
});
