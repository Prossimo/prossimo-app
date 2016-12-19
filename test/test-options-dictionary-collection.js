/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

app.session = new app.Session();
app.session.set('no_backend', true);

app.settings = new app.Settings();

function getNames(models) {
    return _.map(models, function (model) {
        return model.get('name');
    });
}


//  ------------------------------------------------------------------------
//  Collection of dictionaries
//  ------------------------------------------------------------------------


//  ------------------------------------------------------------------------
//  Some related functions from `settings.js`
//  ------------------------------------------------------------------------

test('dictionary entry profile availability functions from settings.js', function () {
    app.settings.dictionaries = new app.OptionsDictionaryCollection([
        {
            name: 'Interior Handle',
            id: 1
        }
    ]);

    app.settings.dictionaries.get(1).entries.set([
        {
            name: 'White Plastic Handle',
            id: 1,
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: false
                },
                {
                    profile_id: 4,
                    is_default: false
                },
                {
                    profile_id: 77,
                    is_default: true
                }
            ]
        },
        {
            name: 'Brown Plastic Handle',
            id: 2,
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: false
                },
                {
                    profile_id: 4,
                    is_default: true
                }
            ]
        },
        {
            name: 'Red Plastic Handle',
            id: 3,
            dictionary_entry_profiles: [
                {
                    profile_id: 5,
                    is_default: true
                },
                {
                    profile_id: 6,
                    is_default: false
                }
            ]
        }
    ]);

    //  Test function getAvailableOptions
    deepEqual(
        getNames(app.settings.getAvailableOptions(1, 1)),
        ['White Plastic Handle', 'Brown Plastic Handle'],
        'Get entries available for a certain profile'
    );
    deepEqual(
        getNames(app.settings.getAvailableOptions(1, 112)),
        [],
        'Get entries available for a not existing profile'
    );
    deepEqual(
        getNames(app.settings.getAvailableOptions(123, 1)),
        [],
        'Get entries available for a not existing dictionary'
    );

    //  Test same function, but in "put default option first" mode
    deepEqual(
        getNames(app.settings.getAvailableOptions(1, 4, true)),
        ['Brown Plastic Handle', 'White Plastic Handle'],
        'Get entries available for a certain profile, put default option first'
    );
    deepEqual(
        getNames(app.settings.getAvailableOptions(1, 4, false)),
        ['White Plastic Handle', 'Brown Plastic Handle'],
        'Get entries available for a certain profile, do not put default option first'
    );

    //  Test function getDefaultOption
    equal(
        app.settings.getDefaultOption(1, 5).get('name'),
        'Red Plastic Handle',
        'Get default option for a certain profile'
    );
    equal(
        app.settings.getDefaultOption(1, 1),
        undefined,
        'Get default option for a profile with no default entries'
    );
    equal(
        app.settings.getDefaultOption(1, 112),
        undefined,
        'Get default option for a not existing profile'
    );

    //  Test function getFirstAvailableOption
    equal(
        app.settings.getFirstAvailableOption(1, 1).get('name'),
        'White Plastic Handle',
        'Get first available option for a certain profile'
    );
    equal(
        app.settings.getFirstAvailableOption(1, 112),
        undefined,
        'Get first available option for a not existing profile'
    );

    //  Test function getDefaultOrFirstAvailableOption
    equal(
        app.settings.getDefaultOrFirstAvailableOption(1, 1).get('name'),
        'White Plastic Handle',
        'Get first available option for a certain profile'
    );
    equal(
        app.settings.getDefaultOrFirstAvailableOption(1, 4).get('name'),
        'Brown Plastic Handle',
        'Get first available option for a certain profile'
    );
    equal(
        app.settings.getDefaultOrFirstAvailableOption(1, 112),
        undefined,
        'Get first available option for a not existing profile'
    );

    //  Now remove default option for a profile with id=4 and try again
    app.settings.dictionaries.get(1).entries.get(2).set('dictionary_entry_profiles', [
        {
            profile_id: 1,
            is_default: false
        },
        {
            profile_id: 4,
            is_default: false
        }
    ]);
    equal(
        app.settings.getDefaultOrFirstAvailableOption(1, 4).get('name'),
        'White Plastic Handle',
        'Get first available option for a certain profile'
    );
});

test('misc dictionary functions from settings.js', function () {
    app.settings.dictionaries = new app.OptionsDictionaryCollection([
        {
            name: 'Interior Handle',
            id: 1
        }
    ]);

    app.settings.dictionaries.get(1).entries.set([
        {
            name: 'White Plastic Handle',
            id: 1,
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: false
                },
                {
                    profile_id: 4,
                    is_default: false
                },
                {
                    profile_id: 77,
                    is_default: true
                }
            ]
        },
        {
            name: 'Brown Plastic Handle',
            id: 2,
            dictionary_entry_profiles: [
                {
                    profile_id: 1,
                    is_default: false
                },
                {
                    profile_id: 4,
                    is_default: true
                }
            ]
        },
        {
            name: 'Red Plastic Handle',
            id: 3,
            dictionary_entry_profiles: [
                {
                    profile_id: 5,
                    is_default: true
                },
                {
                    profile_id: 6,
                    is_default: false
                }
            ]
        }
    ]);

    //  Test getDictionaryIdByName
    equal(
        app.settings.getDictionaryIdByName('Interior Handle'),
        1,
        'Get existing dictionary id by name'
    );
    equal(
        app.settings.getDictionaryIdByName('Exterior Handle'),
        undefined,
        'Get non-existing dictionary id by name'
    );

    //  Test getDictionaryEntryIdByName
    equal(
        app.settings.getDictionaryEntryIdByName(1, 'White Plastic Handle'),
        1,
        'Get existing entry id by name'
    );
    equal(
        app.settings.getDictionaryEntryIdByName(1, 'Purple Metal Handle'),
        undefined,
        'Get non-existing entry id by name'
    );

    //  Test getAvailableDictionaries and getAvailableDictionaryNames
    deepEqual(
        getNames(app.settings.getAvailableDictionaries().models),
        ['Interior Handle'],
        'Get list of available dictionaries'
    );
    deepEqual(
        app.settings.getAvailableDictionaryNames(),
        ['Interior Handle'],
        'Get list of available dictionary names'
    );

    //  Add one more dictionary and try again
    app.settings.dictionaries.add({
        name: 'Exterior Handle'
    });

    deepEqual(
        getNames(app.settings.getAvailableDictionaries().models),
        ['Interior Handle', 'Exterior Handle'],
        'Get list of available dictionaries'
    );
    deepEqual(
        app.settings.getAvailableDictionaryNames(),
        ['Interior Handle', 'Exterior Handle'],
        'Get list of available dictionary names'
    );
});
