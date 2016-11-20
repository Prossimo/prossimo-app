import Backbone from '../../backbone-extended';

function getUserDefaults() {
    return {
        email: '',
        username: '',
        roles: []
    };
}

export default Backbone.Model.extend({
    defaults: getUserDefaults(),
    reset: function () {
        this.set(getUserDefaults());
    }
});
