import Schema from '../../src/schema';

test('Schema test', () => {
    test('createSchema', () => {
        const schema = Schema.createSchema([
            {
                name: 'client_address_state',
                title: 'Client address state',
                type: 'string',
            },
            {
                name: 'client_address_city',
                title: 'Client address city',
                type: 'string',
                validation: ({ name, type }) => ({ required: true, name, type }),
            },
            {
                name: 'project_name',
                title: 'Project Name',
                type: 'string',
                validation: { required: true },
            },
        ]);
        notOk({}.propertyIsEnumerable.call(schema, 'validation'),
            'validation should be not enumerable');
        it('check available keys', () => {
            expect(schema).to.have.all
                .keys('client_address_state', 'client_address_city',
                    'project_name');
        });
        containSubset(schema.validation, {
            project_name: {
                required: true,
            },
            client_address_city: {
                required: true,
                name: 'client_address_city',
                type: 'string',
            },
        }, 'check validation object');
        containSubset(
            Schema.createSchema([
                {
                    name: 1,
                    validation: false,
                },
                {
                    name: 1,
                    validation: {},
                },
                {
                    name: 1,
                    validation: () => {},
                },
            ]),
            {},
            'check empty validation object');
    });
});
