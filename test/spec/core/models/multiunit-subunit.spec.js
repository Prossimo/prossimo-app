import App from '../../../../src/main';
import MultiunitSubunit from '../../../../src/core/models/inline/multiunit-subunit';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

test('MultiunitSubunit test', () => {
    test('MultiunitSubunit model basic tests', () => {
        const subunit = new MultiunitSubunit();

        equal(subunit.get('unit_id'), 0, 'unit_id is 0 upon creation');
        equal(subunit.get('unit_cid'), '', 'unit_id is empty upon creation');
    });

    test('MultiunitSubunit parse function', () => {
        const data_to_set = {
            id: 45,
            unit_id: 12,
            unit_cid: 'c435',
        };

        const subunit = new MultiunitSubunit(data_to_set, { parse: true });

        equal(subunit.get('unit_id'), 12, 'unit_id should be correct');
        equal(subunit.get('unit_cid'), 'c435', 'unit_cid should be correct');
        equal(subunit.get('id'), undefined, 'id should be undefined');
        equal(subunit.get('whatever'), undefined, 'whatever should be undefined');
    });

    test('MultiunitSubunit toJSON function', () => {
        const data_to_set = {
            id: 45,
            unit_id: 12,
            unit_cid: 'c435',
        };

        const default_subunit = new MultiunitSubunit();
        const predefined_subunit = new MultiunitSubunit(data_to_set, { parse: true });

        equal(default_subunit.toJSON(), 0, 'Default MultiunitSubunit should be correctly cast to JSON representation');
        equal(predefined_subunit.toJSON(), 12, 'Predefined MultiunitSubunit should be correctly cast to JSON representation');
    });
});
