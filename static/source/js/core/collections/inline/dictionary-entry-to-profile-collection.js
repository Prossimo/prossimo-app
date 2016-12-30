var app = app || {};

(function () {
    'use strict';

    app.DictionaryEntryProfileCollection = Backbone.Collection.extend({
        model: app.DictionaryEntryProfile,
        //  We sort items not by profile id, but by the order of profiles
        //  in their respective collection
        comparator: function (item) {
            var corresponding_profile = app.settings && app.settings.profiles &&
                app.settings.profiles.get(item.get('profile_id'));

            return corresponding_profile ? corresponding_profile.get('position') : Infinity;
        },
        getByProfileId: function (profile_id) {
            return this.findWhere({ profile_id: profile_id });
        },
        initialize: function (models, options) {
            this.options = options || {};
        }
    });
})();
