import Backbone from 'backbone';

function getUserDefaults() {
    return {
        email: '',
        username: '',
        roles: [],
    };
}

export default Backbone.Model.extend({
    defaults: getUserDefaults(),
    reset() {
        this.set(getUserDefaults());
    },
});
