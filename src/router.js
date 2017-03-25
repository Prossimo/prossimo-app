import Backbone from 'backbone';

export default Backbone.Router.extend({
    routes: {},
    addRoute: function (route, callback) {
        this.route(route, route, callback);
    }
});
