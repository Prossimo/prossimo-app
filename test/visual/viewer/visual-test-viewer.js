import _ from 'underscore';
import $ from 'jquery';

import App from '../../../src/main';
import cases from '../visual-test-data';
import runVisualTest from '../visual-test-runner';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

const diff_threshold = 0;

function renderNested(data_object, is_nested) {
    const normal_sting_template = _.template('<<%= wrpr %>><strong><%= key %></strong>: <span><%= value %></span></<%= wrpr %>>');
    const nested_sting_template = _.template('<<%= wrpr %>><strong><%= key %></strong>: <ul><%= list_content %></ul></<%= wrpr %>>');
    let result_html = '';
    const wrapper = is_nested ? 'li' : 'p';

    _.each(data_object, (value, key) => {
        //  This is true for objects and arrays
        if (_.isObject(value)) {
            result_html += nested_sting_template({
                key,
                list_content: renderNested(value, true),
                wrpr: wrapper,
            });
        } else {
            result_html += normal_sting_template({
                value,
                key,
                wrpr: wrapper,
            });
        }
    });

    return result_html;
}

function renderTestCase(processed_data) {
    const test_case_template = _.template(
        '<div class="case-wrapper">' +
            '<h2><%= case_title %></h2>' +
            '<div class="case-contents">' +
                '<div class="expected-image">' +
                    '<h4>Expected image</h4>' +
                    '<img src="<%= expected_image %>">' +
                '</div>' +
                '<div class="result-image">' +
                    '<h4>Generated image</h4>' +
                    '<img src="<%= generated_image %>">' +
                '</div>' +
                '<div class="diff-image">' +
                    '<h4>Diff image</h4>' +
                    '<img src="<%= diff_image %>">' +
                '</div>' +
            '</div>' +
            '<div class="diff-data">' +
                '<h4>Diff Status: <span class="<%= status %>"><%= status_text %></span></h4>' +
                '<h5>Execution time: <%= execution_time %></h5>' +
                '<p>Mismatch: <%= mismatch_percentage %>%</p>' +
                '<p>Images have same dimensions: <%= same_dimensions %></p>' +
            '</div>' +
            '<div class="case-data">' +
                '<h4>Unit properties</h4>' +
                '<div class="unit-properties"><%= unit_properties %></div>' +
                '<h4>Profile properties</h4>' +
                '<div class="profile-properties"><%= profile_properties %></div>' +
                '<h4>Preview settings</h4>' +
                '<div class="preview-settings"><%= preview_settings %></div>' +
            '</div>' +
        '</div>',
    );

    $('body').append(test_case_template({
        case_title: processed_data.test_case.title || '',
        expected_image: processed_data.expected_filename,
        generated_image: processed_data.preview,
        diff_image: processed_data.diff_output.diff_image_src,
        status: processed_data.diff_output.status,
        status_text: processed_data.diff_output.status_text,
        mismatch_percentage: processed_data.diff_output.mismatch_percentage,
        same_dimensions: processed_data.diff_output.same_dimensions,
        unit_properties: renderNested(processed_data.unit.toJSON()),
        profile_properties: renderNested(processed_data.profile.toJSON()),
        preview_settings: renderNested(processed_data.test_case.preview_settings),
        execution_time: `${parseInt(processed_data.execution_time, 10)} ms`,
    }));
}

//  Main rendering loop
$(window).on('load', () => {
    _.each(cases, (test_case) => {
        runVisualTest({
            test_case,
            diff_threshold,
            callback: (result) => {
                renderTestCase(result);
            },
        });
    });
});
