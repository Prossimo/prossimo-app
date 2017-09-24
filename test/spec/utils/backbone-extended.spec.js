import Backbone from 'backbone';

test('backbone-extended.js tests: ', () => {
    //  ------------------------------------------------------------------------
    //  Test Backbone.Model extensions
    //  ------------------------------------------------------------------------
    test('Backbone.Model', () => {
        const TestClass = Backbone.Model.extend({});

        const test_object = new TestClass({
            something: 'anything',
        });

        equal(test_object.get('something'), 'anything', 'Model attribute is set correctly');
    });

    test('Backbone.Collection', () => {
        const TestClass = Backbone.Model.extend({});
        const TestCollection = Backbone.Collection.extend({
            model: TestClass,
        });

        const test_collection = new TestCollection([
            { something: 'anything' },
        ]);

        const test_object = test_collection.at(0);

        equal(test_object.get('something'), 'anything', 'First collection model attribute is set correctly');
    });
});
