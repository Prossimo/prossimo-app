import Backbone from 'backbone';
import _ from 'underscore';
import App from '../../main';
import OptionsDictionaryEntry from '../models/options-dictionary-entry';

export default Backbone.Collection.extend({
        model: OptionsDictionaryEntry,
        reorder_property_name: 'entries',
        url: function () {
            return App.settings.get('api_base_path') + '/dictionaries/' +
                this.options.dictionary.get('id') + '/entries';
        },
        reorder_url: function () {
            return App.settings.get('api_base_path') + '/dictionaries/' +
                this.options.dictionary.get('id') + '/reorder_entries';
        },
        parse: function (data) {
            //  We do this check to avoid confusion with native JS
            //  Array.prototype.etries() method
            return !_.isArray(data) && data.entries ? data.entries : data;
        },
        getNameTitleTypeHash: function (names) {
            return this.proxy_entry.getNameTitleTypeHash(names);
        },
        getTitles: function (names) {
            return this.proxy_entry.getTitles(names);
        },
        getAttributeType: function () {
            return this.proxy_entry.getAttributeType();
        },
        getByName: function (name) {
            return this.findWhere({ name: name });
        },getAvailableForProfile: function (profile_id) {
            return this.models.filter(function (entry) {
                return entry.isAvailableForProfile(profile_id);
            }, this);
        },
        getDefaultForProfile: function (profile_id) {
            var available_entries = this.getAvailableForProfile(profile_id);

        var default_entry = _.find(available_entries, function (entry) {
            return entry.isDefaultForProfile(profile_id);
        });

            return default_entry || undefined;
        },
        getDefaultOrFirstAvailableForProfile: function (profile_id) {
            var available_items = this.getAvailableForProfile(profile_id);

            var default_item = _.find(available_items, function (item) {
                return item.isDefaultForProfile(profile_id);
            });

            return default_item || ( available_items.length ? available_items[0] : undefined );
        },
        //  We collect an array of ids for all profiles that are connected to
        //  at least one item in our collection
        getIdsOfAllConnectedProfiles: function () {
            var arrays = this.map(function (item) {
                return item.getIdsOfProfilesWhereIsAvailable();
            });

            return _.uniq(_.flatten(arrays, true).sort(function (a, b) { return a - b; }), true);
        },
        //  We go over all profiles and make sure we only have one default
        //  entry per profile per each dictionary. If not, the first one wins.
        //  This is executed on collection load.
        //  TODO: this might have a different name (to distinguish from
        //  validation which is a slightly different concept)
        validatePerProfileDefaults: function () {
            var profiles = this.getIdsOfAllConnectedProfiles();

            _.each(profiles,function ( profile_id ) {
                var all_items = this.getAvailableForProfile(profile_id);
                var default_item = this.getDefaultForProfile(profile_id);
                var non_default_items = _.without(all_items, default_item);

                //  Iterate over non default items and make sure they're
                //  set as non default. If all's fine, no requests are fired
                if ( default_item && non_default_items ) {
                    _.each(non_default_items, function (item) {
                        item.setProfileAvailability( profile_id , true , false);

                    }, this);
                }
            }, this);
        },
        setItemAvailabilityForProfile: function (profile_id, target_item, new_value) {
            if ( !this.get(target_item) ) {
                throw new Error('Cannot set item availability: target item does not belong to this collection ');
            }

             target_item.setProfileAvailability( profile_id,
                     new_value );
        },
        setItemAsDefaultForProfile: function (profile_id, new_item) {
            var old_item= this.getDefaultForProfile(profile_id) ;

            if ( new_item ) {
                if ( !this.get(new_item) ) {
                    throw new Error(
                        'Cannot set item as default for profile: target item does not belong to this collection'
                    );
                }

                //  Set new_itemas available and default for profile_id


                    new_item.setProfileAvailability(profile_id, true, true);
            }


            if ( old_item ) {
                //  Setold_item as available but notdefault for profile_id
                     old_item.setProfileAvailability( profile_id , true , false);

            }
        },
        initialize: function (models, options) {
            this.options = options || {};
            this.proxy_entry = new OptionsDictionaryEntry(null, { proxy: true });


            this.once( 'fully_loaded', function () {this.validatePositions();
            this.validatePerProfileDefaults();
            },this);
        }
    });
