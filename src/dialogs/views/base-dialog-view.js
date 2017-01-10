import Marionette from 'backbone.marionette';
import template from '../../templates/dialogs/base-dialog-view.hbs';

export default Marionette.View.extend({
    className: 'modal fade',
    template: template,
    events: {
        'submit form': 'returnFalse'
    },
    close: function () {
        if (this.$el.modal) {
            this.$el.modal('hide');
        }
    },
    returnFalse: function () {
        return false;
    }
});
