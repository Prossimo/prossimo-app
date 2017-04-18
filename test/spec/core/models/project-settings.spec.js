import _ from 'underscore';

import App from '../../../../src/main';
import ProjectSettings from '../../../../src/core/models/inline/project-settings';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

test('Project settings test', () => {
    test('project settings model basic tests', () => {
        const project_settings = new ProjectSettings();

        equal(project_settings.get('inches_display_mode'), 'feet_and_inches', 'Should be feet_and_inches upon creation');
    });

    test('project settings parse function', () => {
        const data_to_set = {
            inches_display_mode: 'feet_and_inches',
            hinge_indicator_mode: 'european',
            pricing_mode: 'normal',
            show_drawings_in_quote: true,
        };

        const project_settings = new ProjectSettings(
            _.clone(data_to_set),
            { parse: true },
        );

        equal(
            project_settings.get('inches_display_mode'),
            'feet_and_inches',
            'inches_display_mode is set correctly on parse',
        );
        equal(
            project_settings.get('hinge_indicator_mode'),
            'european',
            'hinge_indicator_mode is set correctly on parse',
        );
        equal(
            project_settings.get('pricing_mode'),
            undefined,
            'pricing_mode is thrown out on parse as expected',
        );
    });

    test('project settings toJSON function', () => {
        const data_to_set = {
            inches_display_mode: 'feet_and_inches',
            hinge_indicator_mode: 'european',
            pricing_mode: 'normal',
            show_drawings_in_quote: true,
        };

        const default_project_settings = new ProjectSettings();
        const preloaded_project_settings = new ProjectSettings(
            _.clone(data_to_set),
            { parse: true },
        );

        deepEqual(
            default_project_settings.toJSON(),
            {
                inches_display_mode: 'feet_and_inches',
                hinge_indicator_mode: 'american',
                show_drawings_in_quote: true,
            },
            'Default Project Settings should be correctly cast to JSON representation',
        );

        deepEqual(
            preloaded_project_settings.toJSON(),
            {
                inches_display_mode: 'feet_and_inches',
                hinge_indicator_mode: 'european',
                show_drawings_in_quote: true,
            },
            'Preloaded Project Settings should be correctly cast to JSON representation',
        );
    });
});
