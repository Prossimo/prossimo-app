import _ from 'underscore';

import App from '../../../../src/main';
import OptionsDictionaryEntryCollection from '../../../../src/core/collections/options-dictionary-entry-collection';
import OptionsDictionary from '../../../../src/core/models/options-dictionary';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

test('Options dictionary', function () {
    //  ------------------------------------------------------------------------
    //  Single options dictionary
    //  ------------------------------------------------------------------------
    test('dictionary basic tests', function () {
        let dictionary = new OptionsDictionary({
            name: 'Interior Handle'
        });

        equal(dictionary.get('name'), 'Interior Handle', 'Dictionary name is properly set');
        ok(dictionary.entries instanceof OptionsDictionaryEntryCollection, 'Dictionary entries is properly set');
        equal(dictionary.get('rules_and_restrictions').length, 0, 'Dictionary has 0 rules_and_restrictions');
        ok(_.isArray(dictionary.get('rules_and_restrictions')), 'Dictionary rules_and_restrictions is an array');
        equal(dictionary.get('pricing_scheme'), 'NONE', 'Dictionary pricing_scheme is NONE by default');
    });

    test('dictionary parse function', function () {
        let source_data = {
            name: 'Interior Handle',
            nonexistent_option: 'Whatever',
            pricing_scheme: 'PRICING_GRIDS',
            rules_and_restrictions: JSON.stringify(['OPERABLE_ONLY', 'IS_OPTIONAL']),
            entries: [
                {name: 'White Plastic Handle'},
                {name: 'Brass Metal Handle'}
            ]
        };
        let broken_data = _.extend({}, source_data, {rules_and_restrictions: 'garbage'});

        let dictionary = new OptionsDictionary(source_data, {parse: true});
        let parsed_data = dictionary.parse(source_data);

        //  Check specific results of the parse function
        equal(parsed_data.name, source_data.name, 'Parsed data correctly preserves attributes included in schema');
        equal(parsed_data.nonexistent_option, undefined, 'Parsed data does not include any nonexistent attributes');
        equal(parsed_data.entries.length, 2, 'Parsed data still contains entries data as an array');

        let dictionary_two = new OptionsDictionary(source_data, {parse: true});

        //  Check that item has proper attributes after being initialized
        equal(dictionary_two.get('name'), source_data.name, 'Dictionary name is set correctly');
        equal(dictionary_two.get('pricing_scheme'), source_data.pricing_scheme, 'Dictionary pricing_scheme is set correctly');
        deepEqual(
            dictionary_two.get('rules_and_restrictions'),
            ['OPERABLE_ONLY', 'IS_OPTIONAL'],
            'Dictionary rules_and_restrictions is set correctly'
        );

        let dictionary_three = new OptionsDictionary(broken_data, {parse: true});

        deepEqual(
            dictionary_three.get('rules_and_restrictions'),
            [],
            'Dictionary rules_and_restrictions is empty array if source data is incorrect'
        );
    });

    test('dictionary.entries correctly calls validatePositions and validatePerProfileDefaults function', function () {
        let source_data = {
            name: 'Interior Handle',
            id: 22,
            entries: [
                {
                    name: 'White Plastic Handle',
                    id: 3,
                    position: 1,
                    dictionary_entry_profiles: [
                        {
                            profile_id: 5,
                            is_default: true
                        },
                        {
                            profile_id: 8,
                            is_default: false
                        }
                    ]
                },
                {
                    name: 'Brass Metal Handle',
                    id: 5,
                    position: 8,
                    dictionary_entry_profiles: [
                        {
                            profile_id: 5,
                            is_default: true
                        }
                    ]
                }
            ]
        };

        let dictionary = new OptionsDictionary(source_data, {parse: true});

        //  Check results of calling validatePositions()
        deepEqual(dictionary.entries.pluck('position'), [0, 1], 'Entries wrong position attributes were fixed');

        //  Check results of calling validatePerProfileDefaults()
        equal(dictionary.entries.get(3).isDefaultForProfile(5), true, 'Entry 1 should be default for profile_id=5');
        equal(dictionary.entries.get(5).isDefaultForProfile(5), false, 'Entry 2 should no longer be default for profile_id=5');
    });

    test('dictionary toJSON function', function () {
        let dictionary = new OptionsDictionary(
            {
                name: 'Interior Handle',
                nonexistent_option: 'Whatever',
                pricing_scheme: 'PRICING_GRIDS',
                rules_and_restrictions: JSON.stringify(['OPERABLE_ONLY', 'IS_OPTIONAL']),
                entries: [
                    {name: 'White Plastic Handle'},
                    {name: 'Brass Metal Handle'}
                ]
            },
            {parse: true}
        );

        deepEqual(
            dictionary.toJSON(),
            {
                is_hidden: false,
                name: 'Interior Handle',
                position: 0,
                pricing_scheme: 'PRICING_GRIDS',
                rules_and_restrictions: JSON.stringify(['OPERABLE_ONLY', 'IS_OPTIONAL'])
            },
            'Dictionary is properly cast toJSON'
        );
    });

    test('dictionary.entries entrie_change event is triggered correctly', function () {
        let dictionary = new OptionsDictionary(
            {
                name: 'Interior Handle',
                entries: [
                    {name: 'White Plastic Handle'},
                    {name: 'Brass Metal Handle'}
                ]
            },
            {parse: true}
        );

        let first_entry = dictionary.entries.at(0);

        let dictionary_event_counter = 0;
        let entry_event_counter = 0;

        dictionary.on('entries_change', function () {
            dictionary_event_counter += 1;
        });
        first_entry.on('change', function () {
            entry_event_counter += 1;
        });

        equal(dictionary_event_counter, entry_event_counter, 'Number of events matches in the beginning');

        first_entry.set('name', 'Whatever');

        equal(dictionary_event_counter, entry_event_counter, 'Number of events matches after calling set on entry');
    });
});
