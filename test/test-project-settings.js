/* global app */
/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */

app.session = new app.Session();
app.session.set('no_backend', true);

// app.settings = new app.Settings();

test('project settings model basic tests', function () {
    var project_settings = new app.ProjectSettings();

    equal(project_settings.get('inches_display_mode'), 'feet_and_inches', 'Should be feet_and_inches upon creation');
});


test('project settings parse function', function () {
    var data_to_set = {
        inches_display_mode: 'feet_and_inches',
        hinge_indicator_mode: 'european',
        pricing_mode: 'normal',
        show_drawings_in_quote: true
    };

    var project_settings = new app.ProjectSettings(
        _.clone(data_to_set),
        { parse: true }
    );

    equal(
        project_settings.get('inches_display_mode'),
        'feet_and_inches',
        'inches_display_mode is set correctly on parse'
    );
    equal(
        project_settings.get('hinge_indicator_mode'),
        'european',
        'hinge_indicator_mode is set correctly on parse'
    );
    equal(
        project_settings.get('pricing_mode'),
        undefined,
        'pricing_mode is thrown out on parse as expected'
    );
});


test('project settings toJSON function', function () {
    var data_to_set = {
        inches_display_mode: 'feet_and_inches',
        hinge_indicator_mode: 'european',
        pricing_mode: 'normal',
        show_drawings_in_quote: true
    };

    var default_project_settings = new app.ProjectSettings();
    var preloaded_project_settings = new app.ProjectSettings(
        _.clone(data_to_set),
        { parse: true }
    );

    deepEqual(
        default_project_settings.toJSON(),
        {
            inches_display_mode: 'feet_and_inches',
            hinge_indicator_mode: 'american',
            show_drawings_in_quote: true
        },
        'Default Project Settings should be correctly cast to JSON representation'
    );

    deepEqual(
        preloaded_project_settings.toJSON(),
        {
            inches_display_mode: 'feet_and_inches',
            hinge_indicator_mode: 'european',
            show_drawings_in_quote: true
        },
        'Preloaded Project Settings should be correctly cast to JSON representation'
    );
});
