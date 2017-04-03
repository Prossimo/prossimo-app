import Backbone from 'backbone';
import App from '../src/main';
import Unit from '../src/core/models/unit';
import UnitOptionCollection from '../src/core/collections/inline/unit-option-collection';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

describe('Unit tests:', function () {
    it('Mode "no_backend" is true', function () {
        expect(App.session.get('no_backend')).to.be.true;
    });
    it('App.settings.filling_types is ok', function () {
        expect(App.settings.filling_types.toJSON().length > 0).to.be.true;
    });
    it('App.settings.profiles is not empty', function () {
        expect(App.settings.profiles.toJSON().length > 0).to.be.true;
    });
    it('App.settings.dictionaries is not empty', function () {
        expect(App.settings.dictionaries.toJSON().length > 0).to.be.true;
    });
    before(function () {
        //  This is here to avoid creating side effects inside tests.
        //  TODO: we need to get rid of globals eventually
        App.settings.profiles.reset([
            {id: 1, position: 0},
            {id: 22, position: 1},
            {id: 77, position: 2},
            {id: 17, position: 3}
        ], {parse: true});
        App.settings.dictionaries.reset([
            {
                id: 17,
                position: 0,
                name: 'Interior Handle',
                pricing_scheme: 'PER_ITEM',
                entries: [
                    {
                        id: 14,
                        name: 'White Plastic Handle',
                        dictionary_entry_profiles: [
                            {profile_id: 17, is_default: false},
                            {profile_id: 1, is_default: false},
                            {profile_id: 22, is_default: true}
                        ]
                    },
                    {
                        id: 77,
                        name: 'Red Metal Handle',
                        dictionary_entry_profiles: [
                            {profile_id: 17, is_default: false},
                            {profile_id: 1, is_default: true}
                        ]
                    }
                ]
            },
            {
                id: 32,
                position: 1,
                name: 'Exterior Handle',
                pricing_scheme: 'PER_ITEM',
                entries: [
                    {
                        id: 53,
                        name: 'Blue Metal Hande - External',
                        dictionary_entry_profiles: [
                            {profile_id: 17, is_default: false},
                            {profile_id: 1, is_default: false}
                        ]
                    }
                ]
            },
            {
                id: 19,
                position: 2,
                name: 'External Sill',
                pricing_scheme: 'PRICING_GRIDS',
                rules_and_restrictions: ['IS_OPTIONAL'],
                entries: [
                    {
                        id: 8,
                        name: 'Nice Sill',
                        dictionary_entry_profiles: [
                            {profile_id: 17, is_default: false},
                            {profile_id: 1, is_default: false}
                        ]
                    }
                ]
            }
        ], {parse: true});
    });

    after(function () {
        delete App.settings;
    });
    describe('Unit model basic tests', function () {
        let unit = new Unit();

        it('height is 0 upon creation', () => {
            expect(unit.get('height')).to.to.equal('0');
        });
        it('width is 0 upon creation', () => {
            expect(unit.get('width')).to.to.equal(0);
        });
        it('quantity is 1 upon creation', () => {
            expect(unit.get('quantity')).to.to.equal(1);
        });

        it('unit_options is a Backbone.Collection instance', () => {
            expect(new UnitOptionCollection()).to.be.an.instanceof(Backbone.Collection);
        });
    });

    describe('Unit parse function', function () {
        let data_to_set = {
            quantity: 15,
            whatever: true,
            unit_options: [
                {
                    dictionary_id: 12,
                    dictionary_entry_id: 33,
                    quantity: 5
                },
                {
                    dictionary_id: 5,
                    dictionary_entry_id: 13
                }
            ]
        };

        let unit = new Unit(data_to_set, {parse: true});

        it('quantity should be correct', () => {
            expect(unit.get('quantity')).to.to.equal(15);
        });
        it('whatever should be undefined', () => {
            expect(unit.get('whatever')).to.to.equal(undefined);
        });

        it('unit_options should be a Backbone.Collection instance', () => {
            expect(unit.get('unit_options') instanceof Backbone.Collection).to.be.ok;
        });
    });

    //  TODO: this relies on globally available app.settings.profiles
    describe('Unit toJSON function', function () {
        let data_to_set = {
            quantity: 15,
            whatever: true,
            root_section: JSON.stringify({
                bars: {
                    horizontal: [],
                    vertical: []
                },
                fillingName: 'Glass',
                fillingType: 'glass',
                id: '4',
                measurements: {
                    frame: {
                        horizontal: ['max', 'max'],
                        vertical: ['max', 'max']
                    },
                    glass: null,
                    opening: null
                },
                sashType: 'fixed_in_frame'
            })
        };

        let unit = new Unit(data_to_set, {parse: true});

        it('Unit should be correctly cast to JSON representation', () => {
            expect(unit.toJSON()).to.contain.any.keys({
                conversion_rate: 0.9,
                customer_image: '',
                description: '',
                discount: 0,
                exceptions: '',
                glazing: 'Glass',
                glazing_bar_width: 12,
                height: 0,
                mark: '',
                notes: '',
                opening_direction: 'Inward',
                original_cost: 0,
                original_currency: 'EUR',
                position: 0,
                price_markup: 2.3,
                profile_id: 1,
                profile_name: '',
                quantity: 15,
                root_section: JSON.stringify({
                    bars: {
                        horizontal: [],
                        vertical: []
                    },
                    fillingName: 'Glass',
                    fillingType: 'glass',
                    id: '4',
                    measurements: {
                        frame: {
                            horizontal: ['max', 'max'],
                            vertical: ['max', 'max']
                        },
                        glass: null,
                        opening: null
                    },
                    sashType: 'fixed_in_frame'
                }),
                supplier_discount: 0,
                unit_options: [
                    {
                        dictionary_entry_id: 77,
                        dictionary_id: 17,
                        quantity: 1
                    },
                    {
                        dictionary_entry_id: 53,
                        dictionary_id: 32,
                        quantity: 1
                    }
                ],
                uw: 0,
                width: 0
            });
        });
    });

    describe('Unit hasOnlyDefaultAttributes function', function () {
        let unit_one = new Unit({profile_id: 1});
        let unit_two = new Unit({profile_id: 1});
        let unit_three = new Unit({profile_id: 1});
        let unit_four = new Unit({profile_id: 1});

        it('Unit 1 has only default attributes upon creation', () => {
            expect(unit_one.hasOnlyDefaultAttributes()).to.be.ok;
        });
        it('Unit 2 has only default attributes upon creation', () => {
            expect(unit_two.hasOnlyDefaultAttributes()).to.be.ok;
        });
        it('Unit 3 has only default attributes upon creation', () => {
            expect(unit_three.hasOnlyDefaultAttributes()).to.be.ok;
        });
        it('Unit 4 has only default attributes upon creation', () => {
            expect(unit_four.hasOnlyDefaultAttributes()).to.be.ok;
        });

        unit_one.set('mark', 'ABCD');
        unit_two.set('profile_id', 17);
        unit_three.toggleCircular(unit_three.get('root_section').id, true);
        unit_four.get('unit_options').reset();

        it('Unit 1 has non-default attributes after calling set', () => {
            expect(unit_one.hasOnlyDefaultAttributes()).to.not.be.ok;
        });
        it('Unit 2 has non-default attributes after changing profile', () => {
            expect(unit_two.hasOnlyDefaultAttributes()).to.not.be.ok;
        });
        it('Unit 3 has non-default attributes after making changes to root_section', () => {
            expect(unit_three.hasOnlyDefaultAttributes()).to.not.be.ok;
        });
        it('Unit 4 has non-default attributes after making changes to unit_options', () => {
            expect(unit_four.hasOnlyDefaultAttributes()).to.not.be.ok;
        });
    });

    //  TODO: This relies on globally available app.settings.dictionaries, we need
    //  to get rid of globals eventually
    describe('Unit getDefaultUnitOptions function', function () {
        let unit = new Unit({
            profile_id: 1
        });

        let another_unit = new Unit({
            profile_id: 17
        });

        it('getDefaultUnitOptions for unit returns the expected result', () => {
            expect(unit.getDefaultUnitOptions().toJSON()).to.deep.equal([
                {
                    dictionary_entry_id: 77,
                    dictionary_id: 17,
                    quantity: 1
                },
                {
                    dictionary_entry_id: 53,
                    dictionary_id: 32,
                    quantity: 1
                }
            ]);
        });
        it('getDefaultUnitOptions for another unit returns the expected result', () => {
            expect(another_unit.getDefaultUnitOptions().toJSON()).to.deep.equal([
                {
                    dictionary_entry_id: 14,
                    dictionary_id: 17,
                    quantity: 1
                },
                {
                    dictionary_entry_id: 53,
                    dictionary_id: 32,
                    quantity: 1
                }
            ]);
        });
    });

    describe('Unit getCurrentUnitOptions, getCurrentUnitOptionsByDictionaryId, getUnitOptionsGroupedByPricingScheme functions', function () {
        let unit = new Unit({
            profile_id: 1
        });
        let current_options = unit.getCurrentUnitOptions();
        let first_option = current_options[0];

        it('getCurrentUnitOptions returns array with 2 elements', () => {
            expect(current_options.length).to.to.equal(2);
        });
        it('First option contains correct dictionary link', () => {
            expect(first_option.dictionary.toJSON()).to.deep.equal({
                is_hidden: false,
                name: 'Interior Handle',
                position: 0,
                pricing_scheme: 'PER_ITEM',
                rules_and_restrictions: '[]'
            });
        });
        it('First option contains correct entry link', () => {
            expect(first_option.entry.toJSON()).to.deep.equal({
                data: '{}',
                dictionary_entry_profiles: [
                    {
                        cost_per_item: 0,
                        is_default: true,
                        pricing_equation_params: '[{"name":"fixed","param_a":0,"param_b":0},{"name":"operable","param_a":0,"param_b":0}]',
                        pricing_grids: '[{"name":"fixed","data":[{"height":500,"width":500,"value":0},{"height":914,"width":1514,"value":0},{"height":2400,"width":3000,"value":0}]},{"name":"operable","data":[{"height":500,"width":500,"value":0},{"height":914,"width":1514,"value":0},{"height":1200,"width":2400,"value":0}]}]',
                        profile_id: 1
                    },
                    {
                        cost_per_item: 0,
                        is_default: false,
                        pricing_equation_params: '[{"name":"fixed","param_a":0,"param_b":0},{"name":"operable","param_a":0,"param_b":0}]',
                        pricing_grids: '[{"name":"fixed","data":[{"height":500,"width":500,"value":0},{"height":914,"width":1514,"value":0},{"height":2400,"width":3000,"value":0}]},{"name":"operable","data":[{"height":500,"width":500,"value":0},{"height":914,"width":1514,"value":0},{"height":1200,"width":2400,"value":0}]}]',
                        profile_id: 17
                    }
                ],
                name: 'Red Metal Handle',
                position: 1,
                supplier_name: ''
            });
        });

        let options_by_dictionary = unit.getCurrentUnitOptionsByDictionaryId(17);

        it('getCurrentUnitOptionsByDictionaryId returns array with 1 element', () => {
            expect(options_by_dictionary.length).to.to.equal(1);
        });
        it('getCurrentUnitOptionsByDictionaryId returns the expected entry', () => {
            expect(JSON.stringify(options_by_dictionary[0].entry.toJSON())).to.to.equal(JSON.stringify(first_option.entry.toJSON()));
        });

        let grouped_by_scheme = unit.getUnitOptionsGroupedByPricingScheme();

        it('PER_ITEM group contains 2 elements', () => {
            expect(grouped_by_scheme.PER_ITEM.length).to.to.equal(2);
        });
        it('PRICING_GRIDS group contains 0 elements', () => {
            expect(grouped_by_scheme.PRICING_GRIDS.length).to.to.equal(0);
        });
    });

    describe('Unit persistOption function', function () {
        let unit = new Unit({
            profile_id: 1
        });
        let current_options = unit.getCurrentUnitOptions();

        it('getCurrentUnitOptions returns array with 2 elements', () => {
            expect(current_options.length).to.to.equal(2);
        });
        it('First option is from Interior Handle dictionary', () => {
            expect(current_options[0].dictionary.get('name')).to.to.equal('Interior Handle');
        });
        it('First option is Red Metal Handle', () => {
            expect(current_options[0].entry.get('name')).to.to.equal('Red Metal Handle');
        });

        //  Persist the same Red Metal Handle we already have there
        unit.persistOption(17, 77);
        current_options = unit.getCurrentUnitOptions();

        it('getCurrentUnitOptions still returns array with 2 elements', () => {
            expect(current_options.length).to.to.equal(2);
        });
        it('First option is still Red Metal Handle', () => {
            expect(current_options[0].entry.get('name')).to.to.equal('Red Metal Handle');
        });

        //  Persist some different handle, it should replace the existing one
        unit.persistOption(17, 14);
        current_options = unit.getCurrentUnitOptions();

        it('getCurrentUnitOptions still returns array with 2 elements', () => {
            expect(current_options.length).to.to.equal(2);
        });
        it('First option is now White Plastic Handle', () => {
            expect(current_options[0].entry.get('name')).to.to.equal('White Plastic Handle');
        });
        it('First option quantity is 1', () => {
            expect(current_options[0].quantity).to.to.equal(1);
        });

        //  Don't change the option, but update its quantity
        unit.persistOption(17, 14, 5);
        current_options = unit.getCurrentUnitOptions();

        it('getCurrentUnitOptions still returns array with 2 elements', () => {
            expect(current_options.length).to.to.equal(2);
        });
        it('First option is still White Plastic Handle', () => {
            expect(current_options[0].entry.get('name')).to.to.equal('White Plastic Handle');
        });
        it('First option quantity is now 5', () => {
            expect(current_options[0].quantity).to.to.equal(5);
        });
        //  Remove the option
        unit.persistOption(17, false);
        current_options = unit.getCurrentUnitOptions();

        it('getCurrentUnitOptions now returns array with only 1 element', () => {
            expect(current_options.length).to.to.equal(1);
        });
        it('First option is Blue Metal Hande - External', () => {
            expect(current_options[0].entry.get('name')).to.to.equal('Blue Metal Hande - External');
        });
    });
});
