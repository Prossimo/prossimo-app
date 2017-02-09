import _ from 'underscore';
import App from '../src/main';
import OptionsDictionaryEntry from '../src/core/models/options-dictionary-entry';
import OptionsDictionaryCollection from '../src/core/collections/options-dictionary-collection';
import OptionsDictionaryEntryCollection from '../src/core/collections/options-dictionary-entry-collection';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

function getNames(models) {
    return _.map(models, function (model) {
        return model.get('name');
    });
}

test('Options dictionaries tests', function () {
    //  ------------------------------------------------------------------------
    //  Single dictionary entry
    //  ------------------------------------------------------------------------
    test('dictionary entry basic test', function () {
        let entry = new OptionsDictionaryEntry({
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
        let entry = new OptionsDictionaryEntry();

        ok(entry.hasOnlyDefaultAttributes(), 'Entry has only default attributes upon creation');

        entry.set('name', 'Whatever Name');
        notOk(entry.hasOnlyDefaultAttributes(), 'Entry has non-default attributes after calling set()');
    });

    test('dictionary entry profile availability functions', function () {
        let entry = new OptionsDictionaryEntry({
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
        let entries = new OptionsDictionaryEntryCollection([
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
            getNames(entries.getAvailableForProfile(1)),
            ['White Plastic Handle', 'Brown Plastic Handle'],
            'Entries available for a certain profile'
        );
        deepEqual(
            getNames(entries.getAvailableForProfile(112)),
            [],
            'Entries available for a not existing profile'
        );
        deepEqual(
            getNames(entries.getAvailableForProfile(112)),
            [],
            'Entries available for a not existing profile'
        );

        //  Default entry functions
        equal(
            entries.getDefaultForProfile(5).get('name'),
            'Red Plastic Handle',
            'Get default entry for a certain profile'
        );
        equal(
            entries.getDefaultForProfile(1),
            undefined,
            'Get default entry for a profile with no default entries'
        );
        equal(
            entries.getDefaultForProfile(112),
            undefined,
            'Get default entry for a not existing profile'
        );
    });

    //  ------------------------------------------------------------------------
    //  Some related functions from `settings.js`
    //  ------------------------------------------------------------------------
    test('dictionary entry profile availability functions from settings.js', function () {
        App.settings.dictionaries = new OptionsDictionaryCollection([
            {
                name: 'Interior Handle',
                id: 1
            }
        ]);

        App.settings.dictionaries.get(1).entries.set([
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
            getNames(App.settings.getAvailableOptions(1, 1)),
            ['White Plastic Handle', 'Brown Plastic Handle'],
            'Get entries available for a certain profile'
        );
        deepEqual(
            getNames(App.settings.getAvailableOptions(1, 112)),
            [],
            'Get entries available for a not existing profile'
        );
        deepEqual(
            getNames(App.settings.getAvailableOptions(123, 1)),
            [],
            'Get entries available for a not existing dictionary'
        );

        //  Test same function, but in "put default option first" mode
        deepEqual(
            getNames(App.settings.getAvailableOptions(1, 4, true)),
            ['Brown Plastic Handle', 'White Plastic Handle'],
            'Get entries available for a certain profile, put default option first'
        );
        deepEqual(
            getNames(App.settings.getAvailableOptions(1, 4, false)),
            ['White Plastic Handle', 'Brown Plastic Handle'],
            'Get entries available for a certain profile, do not put default option first'
        );

        //  Test function getDefaultOption
        equal(
            App.settings.getDefaultOption(1, 5).get('name'),
            'Red Plastic Handle',
            'Get default option for a certain profile'
        );
        equal(
            App.settings.getDefaultOption(1, 1),
            undefined,
            'Get default option for a profile with no default entries'
        );
        equal(
            App.settings.getDefaultOption(1, 112),
            undefined,
            'Get default option for a not existing profile'
        );

        //  Test function getFirstAvailableOption
        equal(
            App.settings.getFirstAvailableOption(1, 1).get('name'),
            'White Plastic Handle',
            'Get first available option for a certain profile'
        );
        equal(
            App.settings.getFirstAvailableOption(1, 112),
            undefined,
            'Get first available option for a not existing profile'
        );

        //  Test function getDefaultOrFirstAvailableOption
        equal(
            App.settings.getDefaultOrFirstAvailableOption(1, 1).get('name'),
            'White Plastic Handle',
            'Get first available option for a certain profile'
        );
        equal(
            App.settings.getDefaultOrFirstAvailableOption(1, 4).get('name'),
            'Brown Plastic Handle',
            'Get first available option for a certain profile'
        );
        equal(
            App.settings.getDefaultOrFirstAvailableOption(1, 112),
            undefined,
            'Get first available option for a not existing profile'
        );

        //  Now remove default option for a profile with id=4 and try again
        App.settings.dictionaries.get(1).entries.get(2).set('profiles', [
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
            App.settings.getDefaultOrFirstAvailableOption(1, 4).get('name'),
            'White Plastic Handle',
            'Get first available option for a certain profile'
        );
    });

    test('misc dictionary functions from settings.js', function () {
        App.settings.dictionaries = new OptionsDictionaryCollection([
            {
                name: 'Interior Handle',
                id: 1
            }
        ]);

        App.settings.dictionaries.get(1).entries.set([
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
            App.settings.getDictionaryIdByName('Interior Handle'),
            1,
            'Get existing dictionary id by name'
        );
        equal(
            App.settings.getDictionaryIdByName('Exterior Handle'),
            undefined,
            'Get non-existing dictionary id by name'
        );

        //  Test getDictionaryEntryIdByName
        equal(
            App.settings.getDictionaryEntryIdByName(1, 'White Plastic Handle'),
            1,
            'Get existing entry id by name'
        );
        equal(
            App.settings.getDictionaryEntryIdByName(1, 'Purple Metal Handle'),
            undefined,
            'Get non-existing entry id by name'
        );

        //  Test getAvailableDictionaries and getAvailableDictionaryNames
        deepEqual(
            getNames(App.settings.getAvailableDictionaries().models),
            ['Interior Handle'],
            'Get list of available dictionaries'
        );
        deepEqual(
            App.settings.getAvailableDictionaryNames(),
            ['Interior Handle'],
            'Get list of available dictionary names'
        );

        //  Add one more dictionary and try again
        App.settings.dictionaries.add({
            name: 'Exterior Handle'
        });

        deepEqual(
            getNames(App.settings.getAvailableDictionaries().models),
            ['Interior Handle', 'Exterior Handle'],
            'Get list of available dictionaries'
        );
        deepEqual(
            App.settings.getAvailableDictionaryNames(),
            ['Interior Handle', 'Exterior Handle'],
            'Get list of available dictionary names'
        );
    });
});
