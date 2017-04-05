import App from '../src/main';
import Unit from '../src/core/models/unit';
import UnitOptionCollection from '../src/core/collections/inline/unit-option-collection';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

describe('Unit model', function () {
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

    it('should have a correctly configured environment', function () {
        expect(App.session.get('no_backend')).to.be.true;
        expect(App.settings.filling_types.toJSON().length > 0).to.be.true;
        expect(App.settings.profiles.toJSON().length > 0).to.be.true;
        expect(App.settings.dictionaries.toJSON().length > 0).to.be.true;
    });

    describe('Basic tests', function () {
        let unit = new Unit();

        it('should have default height upon creation', () => {
            expect(unit.get('height')).to.to.equal('0');
        });

        it('should have default width upon creation', () => {
            expect(unit.get('width')).to.to.equal(0);
        });

        it('should have default quantity upon creation', () => {
            expect(unit.get('quantity')).to.to.equal(1);
        });

        it('should have unit_options that are an instance of UnitOptionCollection', () => {
            expect(unit.get('unit_options')).to.be.an.instanceof(UnitOptionCollection);
        });
    });

    describe('parse function', function () {
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

        it('should have correct quantity', () => {
            expect(unit.get('quantity')).to.to.equal(15);
        });

        it('should have undefined "whatever" attribute', () => {
            expect(unit.get('whatever')).to.to.equal(undefined);
        });

        it('should have unit_options that are an instance of UnitOptionCollection', () => {
            expect(unit.get('unit_options')).to.be.an.instanceof(UnitOptionCollection);
        });
    });

    //  TODO: this relies on globally available app.settings.profiles
    describe('toJSON function', function () {
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

        it('should be correctly cast to JSON representation', () => {
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

    describe('hasOnlyDefaultAttributes function', function () {
        it('should have only default attributes upon creation', () => {
            let unit_zero = new Unit({profile_id: 1});

            expect(unit_zero.hasOnlyDefaultAttributes()).to.be.ok;
        });

        it('should not have default attributes after setting "mark"', () => {
            let unit_one = new Unit({profile_id: 1});

            expect(unit_one.hasOnlyDefaultAttributes()).to.be.ok;
            unit_one.set('mark', 'ABCD');
            expect(unit_one.hasOnlyDefaultAttributes()).to.not.be.ok;
        });

        it('should not have default attributes after setting "profile_id"', () => {
            let unit_two = new Unit({profile_id: 1});

            expect(unit_two.hasOnlyDefaultAttributes()).to.be.ok;
            unit_two.set('profile_id', 17);
            expect(unit_two.hasOnlyDefaultAttributes()).to.not.be.ok;
        });

        it('should not have default attributes after modifying "root_section"', () => {
            let unit_three = new Unit({profile_id: 1});

            expect(unit_three.hasOnlyDefaultAttributes()).to.be.ok;
            unit_three.toggleCircular(unit_three.get('root_section').id, true);
            expect(unit_three.hasOnlyDefaultAttributes()).to.not.be.ok;
        });

        it('should not have default attributes after resetting unit options', () => {
            let unit_four = new Unit({profile_id: 1});

            expect(unit_four.hasOnlyDefaultAttributes()).to.be.ok;
            unit_four.get('unit_options').reset();
            expect(unit_four.hasOnlyDefaultAttributes()).to.not.be.ok;
        });
    });

    //  TODO: This relies on globally available app.settings.dictionaries, we need
    //  to get rid of globals eventually
    describe('getDefaultUnitOptions function', function () {
        it('should have correct default unit options if created with profile_id=1', () => {
            let unit = new Unit({
                profile_id: 1
            });

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

        it('should have correct default unit options if created with profile_id=17', () => {
            let another_unit = new Unit({
                profile_id: 17
            });

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

    // describe('getCurrentUnitOptions, getCurrentUnitOptionsByDictionaryId, getUnitOptionsGroupedByPricingScheme functions', function () {
    describe('getCurrentUnitOptions function', function () {
        it('should have exactly 2 unit options if created with profile_id=1', () => {
            let unit = new Unit({
                profile_id: 1
            });
            let current_options = unit.getCurrentUnitOptions();

            expect(current_options.length).to.to.equal(2);
        });

        it('should have unit option (at position 0) that belongs to a correct dictionary', () => {
            let unit = new Unit({
                profile_id: 1
            });
            let current_options = unit.getCurrentUnitOptions();
            let first_option = current_options[0];

            expect(first_option.dictionary.toJSON()).to.deep.equal({
                is_hidden: false,
                name: 'Interior Handle',
                position: 0,
                pricing_scheme: 'PER_ITEM',
                rules_and_restrictions: '[]'
            });
        });

        it('should have unit option (at position 0) that is serialized to json as expected', () => {
            let unit = new Unit({
                profile_id: 1
            });
            let current_options = unit.getCurrentUnitOptions();
            let first_option = current_options[0];

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
    });

    describe('getCurrentUnitOptionsByDictionaryId function', function () {
        it('should have exactly 1 option from dictionary with id=17', () => {
            let unit = new Unit({
                profile_id: 1
            });
            let options_by_dictionary = unit.getCurrentUnitOptionsByDictionaryId(17);

            expect(options_by_dictionary.length).to.to.equal(1);
        });

        it('should return the expected entry for dictionary with id=17', () => {
            let unit = new Unit({
                profile_id: 1
            });
            let current_options = unit.getCurrentUnitOptions();
            let first_option = current_options[0];
            let options_by_dictionary = unit.getCurrentUnitOptionsByDictionaryId(17);

            expect(JSON.stringify(options_by_dictionary[0].entry.toJSON())).to.to.equal(JSON.stringify(first_option.entry.toJSON()));
        });
    });

    describe('getUnitOptionsGroupedByPricingScheme function', function () {
        it('should have exactly 2 options inside PER_ITEM group', () => {
            let unit = new Unit({
                profile_id: 1
            });
            let grouped_by_scheme = unit.getUnitOptionsGroupedByPricingScheme();

            expect(grouped_by_scheme.PER_ITEM.length).to.to.equal(2);
        });

        it('should not have any options inside PRICING_GRIDS group', () => {
            let unit = new Unit({
                profile_id: 1
            });
            let grouped_by_scheme = unit.getUnitOptionsGroupedByPricingScheme();

            expect(grouped_by_scheme.PRICING_GRIDS.length).to.to.equal(0);
        });
    });

    describe('persistOption function', function () {
        it('should have correct options upon creation', () => {
            let unit = new Unit({
                profile_id: 1
            });
            let current_options = unit.getCurrentUnitOptions();

            //  getCurrentUnitOptions returns array with 2 elements
            expect(current_options.length).to.to.equal(2);
            //  First option is from Interior Handle dictionary
            expect(current_options[0].dictionary.get('name')).to.to.equal('Interior Handle');
            //  First option is Red Metal Handle
            expect(current_options[0].entry.get('name')).to.to.equal('Red Metal Handle');
        });

        it('should correctly persist same Red Metal Handle we already have', () => {
            let unit = new Unit({
                profile_id: 1
            });
            unit.persistOption(17, 77);
            let current_options = unit.getCurrentUnitOptions();

            //  getCurrentUnitOptions still returns array with 2 elements
            expect(current_options.length).to.to.equal(2);
            //  First option is still Red Metal Handle
            expect(current_options[0].entry.get('name')).to.to.equal('Red Metal Handle');
        });

        it('should correctly persist some different handle, and it should replace the existing one', () => {
            let unit = new Unit({
                profile_id: 1
            });
            unit.persistOption(17, 14);
            let current_options = unit.getCurrentUnitOptions();

            //  getCurrentUnitOptions still returns array with 2 elements
            expect(current_options.length).to.to.equal(2);
            //  First option is now White Plastic Handle
            expect(current_options[0].entry.get('name')).to.to.equal('White Plastic Handle');
            //  First option quantity is 1
            expect(current_options[0].quantity).to.to.equal(1);
        });

        it('should correctly persist option quantity without modifying the option', () => {
            let unit = new Unit({
                profile_id: 1
            });
            unit.persistOption(17, 14);
            unit.persistOption(17, 14, 5);
            let current_options = unit.getCurrentUnitOptions();

            //  getCurrentUnitOptions still returns array with 2 elements
            expect(current_options.length).to.to.equal(2);
            //  First option is still White Plastic Handle
            expect(current_options[0].entry.get('name')).to.to.equal('White Plastic Handle');
            //  First option quantity is now 5
            expect(current_options[0].quantity).to.to.equal(5);
        });

        it('should correctly remove option', () => {
            let unit = new Unit({
                profile_id: 1
            });
            unit.persistOption(17, false);
            let current_options = unit.getCurrentUnitOptions();

            //  getCurrentUnitOptions now returns array with only 1 element
            expect(current_options.length).to.to.equal(1);
            //  First option is now Blue Metal Hande - External
            expect(current_options[0].entry.get('name')).to.to.equal('Blue Metal Hande - External');
        });
    });
});
