import _ from 'underscore';

import App from '../../../../src/main';
import OptionsDictionaryCollection from '../../../../src/core/collections/options-dictionary-collection';
import OptionsDictionary from '../../../../src/core/models/options-dictionary';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

function getNames(models) {
    return _.map(models, function (model) {
        return model.get('name');
    });
}

test('Options dictionary collection tests', function () {
    //  ------------------------------------------------------------------------
    //  Collection of dictionaries
    //  ------------------------------------------------------------------------
    test('dictionary collection base functions', function () {
        let dictionaries = new OptionsDictionaryCollection([
            {
                name: 'Interior Handle',
                id: 1
            }
        ]);
        let handles = dictionaries.get(1);

        ok(handles instanceof OptionsDictionary, 'Collection item is a model of proper type');
        equal(dictionaries.length, 1, 'Collection length equals 1');
    });

    test('dictionary collection getAvailableOptions, getDefaultOption, getFirstAvailableOption, getDefaultOrFirstAvailableOption', function () {
        let dictionaries = new OptionsDictionaryCollection([
            {
                name: 'Interior Handle',
                id: 1
            }
        ]);
        let handles = dictionaries.get(1);

        handles.entries.set([
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
        ], {parse: true});

        //  Test function getAvailableOptions
        deepEqual(
            getNames(dictionaries.getAvailableOptions(1, 1)),
            ['White Plastic Handle', 'Brown Plastic Handle'],
            'Get entries available for a certain profile'
        );
        deepEqual(
            getNames(dictionaries.getAvailableOptions(1, 112)),
            [],
            'Get entries available for a not existing profile'
        );
        deepEqual(
            getNames(dictionaries.getAvailableOptions(123, 1)),
            [],
            'Get entries available for a not existing dictionary'
        );

        //  Test same function, but in "put default option first" mode
        deepEqual(
            getNames(dictionaries.getAvailableOptions(1, 4, true)),
            ['Brown Plastic Handle', 'White Plastic Handle'],
            'Get entries available for a certain profile, put default option first'
        );
        deepEqual(
            getNames(dictionaries.getAvailableOptions(1, 4, false)),
            ['White Plastic Handle', 'Brown Plastic Handle'],
            'Get entries available for a certain profile, do not put default option first'
        );

        //  Test function getDefaultOption
        equal(
            dictionaries.getDefaultOption(1, 5).get('name'),
            'Red Plastic Handle',
            'Get default option for a certain profile'
        );
        equal(
            dictionaries.getDefaultOption(1, 1),
            undefined,
            'Get default option for a profile with no default entries'
        );
        equal(
            dictionaries.getDefaultOption(1, 112),
            undefined,
            'Get default option for a not existing profile'
        );

        //  Test function getFirstAvailableOption
        equal(
            dictionaries.getFirstAvailableOption(1, 1).get('name'),
            'White Plastic Handle',
            'Get first available option for a certain profile'
        );
        equal(
            dictionaries.getFirstAvailableOption(1, 112),
            undefined,
            'Get first available option for a not existing profile'
        );

        //  Test function getDefaultOrFirstAvailableOption
        equal(
            dictionaries.getDefaultOrFirstAvailableOption(1, 1).get('name'),
            'White Plastic Handle',
            'Get first available option for a certain profile'
        );
        equal(
            dictionaries.getDefaultOrFirstAvailableOption(1, 4).get('name'),
            'Brown Plastic Handle',
            'Get first available option for a certain profile'
        );
        equal(
            dictionaries.getDefaultOrFirstAvailableOption(1, 112),
            undefined,
            'Get first available option for a not existing profile'
        );

        //  Now remove default option for a profile with id=4 and try again
        handles.entries.get(2).get('dictionary_entry_profiles').set([
            {
                profile_id: 1,
                is_default: false
            },
            {
                profile_id: 4,
                is_default: false
            }
        ], {parse: true});
        equal(
            dictionaries.getDefaultOrFirstAvailableOption(1, 4).get('name'),
            'White Plastic Handle',
            'Get first available option for a certain profile'
        );
    });

    test('dictionary collection getDictionaryIdByName, getDictionaryEntryIdByName, getAvailableDictionaryNames', function () {
        let dictionaries = new OptionsDictionaryCollection([
            {
                name: 'Interior Handle',
                id: 1
            }
        ]);

        dictionaries.get(1).entries.set([
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
            dictionaries.getDictionaryIdByName('Interior Handle'),
            1,
            'Get existing dictionary id by name'
        );
        equal(
            dictionaries.getDictionaryIdByName('Exterior Handle'),
            undefined,
            'Get non-existing dictionary id by name'
        );

        //  Test getDictionaryEntryIdByName
        equal(
            dictionaries.getDictionaryEntryIdByName(1, 'White Plastic Handle'),
            1,
            'Get existing entry id by name'
        );
        equal(
            dictionaries.getDictionaryEntryIdByName(1, 'Purple Metal Handle'),
            undefined,
            'Get non-existing entry id by name'
        );

        //  Test getAvailableDictionaryNames
        deepEqual(
            dictionaries.getAvailableDictionaryNames(),
            ['Interior Handle'],
            'Get list of available dictionary names'
        );

        //  Add one more dictionary and try again
        dictionaries.add({
            name: 'Exterior Handle'
        });

        deepEqual(
            dictionaries.getAvailableDictionaryNames(),
            ['Interior Handle', 'Exterior Handle'],
            'Get list of available dictionary names'
        );
    });
});
