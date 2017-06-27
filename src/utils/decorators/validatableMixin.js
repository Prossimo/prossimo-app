import Validation from 'backbone.validation';
import mixin from '../mixinDecoratorFactory';

// Mixin for validation Backbone plugin
export default mixin({
    initialize() {
        Validation.bind(this, {
            valid(view, attr) {}, // eslint-disable-line no-unused-vars
            invalid(view, attr, error) {}, // eslint-disable-line no-unused-vars
        });
    },
    onDestroy() {
        Validation.unbind(this);
    },
});
