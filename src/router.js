import Backbone from 'backbone';

export default Backbone.Router.extend({
    routes: {},
    addRoute(route, callback) {
        this.route(route, route, callback);
    },
});
