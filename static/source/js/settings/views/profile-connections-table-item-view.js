var app = app || {};

(function () {
    'use strict';

    app.ProfileConnectionsTableItemView = Marionette.View.extend({
        tagName: 'tr',
        className: 'table-item',
        template: app.templates['settings/profile-connections-table-item-view'],
        ui: {

        },
        events: {

        },
        getProfileName: function () {
            var profile_id = this.model.get('profile_id');
            var profile = app.settings.profiles.get(profile_id);

            return profile ? profile.get('name') : 'Err: no profile with ID=' + profile_id;
        },
        getPricingGridString: function () {
            return 'helloworld';
        },
        templateContext: function () {
            return {
                profile_name: this.getProfileName(),
                pricing_grid_string: this.getPricingGridString()
            };
        }
    });
})();
