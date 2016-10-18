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
//  Single dictionary entry
//  ------------------------------------------------------------------------

test('dictionary entry basic test', function () {
    var entry = new app.OptionsDictionaryEntry({
        name: 'White Plastic Handle',
        price: 15,
        profiles: [
            {
                id: 1,
                is_default: false
            }
        ]
    });

    ok(entry.get('name'), 'Entry name should be defined');
});

test('default attributes', function (assert) {
    var entry = new app.OptionsDictionaryEntry();

    ok(entry.hasOnlyDefaultAttributes(), 'Entry has only default attributes upon creation');

    entry.set('name', 'Whatever Name');
    assert.notOk(entry.hasOnlyDefaultAttributes(), 'Entry has non-default attributes after calling set()');
});

test('dictionary entry profile availability functions', function () {
    var entry = new app.OptionsDictionaryEntry({
        name: 'White Plastic Handle',
        price: 15,
        profiles: [
            {
                id: 1,
                is_default: false
            },
            {
                id: 4,
                is_default: false
            },
            {
                id: 77,
                is_default: true
            }
        ]
    });

    ok(entry.isAvailableForProfile(1), 'Should be available');
    notOk(entry.isAvailableForProfile(2), 'Should not be available');
    ok(entry.isDefaultForProfile(77), 'Should be set as default');
    notOk(entry.isDefaultForProfile(1), 'Should not be set as default');
    notOk(entry.isDefaultForProfile(2), 'Should not be set as default');
});

//  ------------------------------------------------------------------------
//  Collection of dictionary entries
//  ------------------------------------------------------------------------

test('dictionary entry profile availability functions for collection', function () {
    var entries = new app.OptionsDictionaryEntryCollection([
        {
            name: 'White Plastic Handle',
            profiles: [
                {
                    id: 1,
                    is_default: false
                },
                {
                    id: 4,
                    is_default: false
                },
                {
                    id: 77,
                    is_default: true
                }
            ]
        },
        {
            name: 'Brown Plastic Handle',
            profiles: [
                {
                    id: 1,
                    is_default: false
                },
                {
                    id: 4,
                    is_default: true
                }
            ]
        },
        {
            name: 'Red Plastic Handle',
            profiles: [
                {
                    id: 5,
                    is_default: true
                },
                {
                    id: 6,
                    is_default: false
                }
            ]
        }
    ]);

    deepEqual(
        getNames(entries.models),
        ['White Plastic Handle', 'Brown Plastic Handle', 'Red Plastic Handle'],
        'Names of all entries'
    );

    //  Entry availability functions
    deepEqual(
        getNames(entries.getEntriesAvailableForProfile(1)),
        ['White Plastic Handle', 'Brown Plastic Handle'],
        'Entries available for a certain profile'
    );
    deepEqual(
        getNames(entries.getEntriesAvailableForProfile(112)),
        [],
        'Entries available for a not existing profile'
    );
    deepEqual(
        getNames(entries.getEntriesAvailableForProfile(112)),
        [],
        'Entries available for a not existing profile'
    );

    //  Default entry functions
    equal(
        entries.getDefaultEntryForProfile(5).get('name'),
        'Red Plastic Handle',
        'Get default entry for a certain profile'
    );
    equal(
        entries.getDefaultEntryForProfile(1),
        undefined,
        'Get default entry for a profile with no default entries'
    );
    equal(
        entries.getDefaultEntryForProfile(112),
        undefined,
        'Get default entry for a not existing profile'
    );
});

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
            profiles: [
                {
                    id: 1,
                    is_default: false
                },
                {
                    id: 4,
                    is_default: false
                },
                {
                    id: 77,
                    is_default: true
                }
            ]
        },
        {
            name: 'Brown Plastic Handle',
            id: 2,
            profiles: [
                {
                    id: 1,
                    is_default: false
                },
                {
                    id: 4,
                    is_default: true
                }
            ]
        },
        {
            name: 'Red Plastic Handle',
            id: 3,
            profiles: [
                {
                    id: 5,
                    is_default: true
                },
                {
                    id: 6,
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
    app.settings.dictionaries.get(1).entries.get(2).set('profiles', [
        {
            id: 1,
            is_default: false
        },
        {
            id: 4,
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
            profiles: [
                {
                    id: 1,
                    is_default: false
                },
                {
                    id: 4,
                    is_default: false
                },
                {
                    id: 77,
                    is_default: true
                }
            ]
        },
        {
            name: 'Brown Plastic Handle',
            id: 2,
            profiles: [
                {
                    id: 1,
                    is_default: false
                },
                {
                    id: 4,
                    is_default: true
                }
            ]
        },
        {
            name: 'Red Plastic Handle',
            id: 3,
            profiles: [
                {
                    id: 5,
                    is_default: true
                },
                {
                    id: 6,
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
