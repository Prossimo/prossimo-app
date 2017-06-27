import _ from 'underscore';
import Stickit from 'backbone.stickit';
import mixin from '../mixinDecoratorFactory';

// Stickit is a Backbone data binding plugin
export default mixin({
    ...Stickit.ViewMixin,
    initialize() {
        // Allow to use Marionette ui syntax with bindings
        this.bindings = this.normalizeUIKeys(_.result(this, 'bindings'),
            _.result(this, 'ui'));
    },
    onRender() {
        this.stickit();
    },
    onDestroy() {
        this.unstickit();
    },
});
