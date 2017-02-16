/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

app.session = new app.Session();
app.session.set('no_backend', true);


test('UnitOption model basic tests', function () {
    var unit_option = new app.UnitOption();

    equal(unit_option.get('dictionary_id'), 0, 'dictionary_id is 0 upon creation');
    equal(unit_option.get('dictionary_entry_id'), 0, 'dictionary_entry_id is 0 upon creation');
    equal(unit_option.get('quantity'), 1, 'quantity is 1 upon creation');
});


test('UnitOption parse function', function () {
    var data_to_set = {
        id: 45,
        dictionary_id: 12,
        dictionary_entry_id: 33,
        quantity: 15,
        whatever: true
    };

    var unit_option = new app.UnitOption(data_to_set, { parse: true });

    equal(unit_option.get('dictionary_id'), 12, 'dictionary_id should be correct');
    equal(unit_option.get('dictionary_entry_id'), 33, 'dictionary_entry_id should be correct');
    equal(unit_option.get('quantity'), 15, 'quantity should be correct');
    equal(unit_option.get('id'), undefined, 'id should be undefined');
    equal(unit_option.get('whatever'), undefined, 'whatever should be undefined');
});


test('UnitOption toJSON function', function () {
    var data_to_set = {
        id: 45,
        dictionary_id: 12,
        dictionary_entry_id: 33,
        quantity: 15,
        whatever: true
    };

    var default_unit_option = new app.UnitOption();
    var predefined_unit_option = new app.UnitOption(data_to_set, { parse: true });

    deepEqual(
        default_unit_option.toJSON(),
        {
            dictionary_entry_id: 0,
            dictionary_id: 0,
            quantity: 1
        },
        'Default UnitOption should be correctly cast to JSON representation'
    );

    deepEqual(
        predefined_unit_option.toJSON(),
        {
            dictionary_entry_id: 33,
            dictionary_id: 12,
            quantity: 15
        },
        'Predefined UnitOption should be correctly cast to JSON representation'
    );
});
