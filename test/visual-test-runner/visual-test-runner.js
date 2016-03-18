/* eslint quotes:0 */
/* jscs:disable */
/* global resemble */

var app = app || {};

(function () {
    'use strict';

    function getExpectedFilename (basic_name) {
        var user_agent = navigator.userAgent;
        var postfix = '-chrome.png';

        if ( user_agent.indexOf('PhantomJS') !== -1 ) {
            postfix = '-phantom.png';
        } else if ( user_agent.indexOf('Firefox') !== -1 ) {
            postfix = '-firefox.png';
        }

        return '../visual-test-data/' + basic_name.replace('.png', postfix);
    }

    app.runVisualTest = function (options) {
        var defaults = {
            diff_threshold: 0,
            test_case: {},
            callback: undefined
        };

        options = _.defaults({}, options, defaults);

        var time_started = performance.now();

        var profile = new app.Profile(options.test_case.profile_data);
        var unit = new app.Unit(_.extend({}, options.test_case.unit_data, {
            root_section: options.test_case.root_section_json_string
        }));

        unit.profile = profile;

        var preview = app.preview(unit, {
            width: options.test_case.preview_settings.width,
            height: options.test_case.preview_settings.height,
            mode: 'base64',
            position: options.test_case.preview_settings.position,
            hingeIndicatorMode: options.test_case.preview_settings.hingeIndicatorMode
        });

        resemble.outputSettings({
            errorColor: {
                red: 255,
                green: 0,
                blue: 255
            },
            errorType: 'movementDifferenceIntensity',
            transparency: 0.3,
            largeImageThreshold: 1200
        });

        var expected_filename = getExpectedFilename(options.test_case.expected_image_filename);

        resemble(expected_filename).compareTo(preview).ignoreAntialiasing().onComplete(function (data) {
            var diff_output = {};

            diff_output.diff_image_src = data.getImageDataUrl();

            if ( data.rawMisMatchPercentage <= options.diff_threshold ) {
                diff_output.status = 'success';
                diff_output.status_text = 'Images are identical';
            } else {
                diff_output.status = 'error';
                diff_output.status_text = 'Images are different';
            }

            if ( data.isSameDimensions ) {
                diff_output.same_dimensions = 'Yes';
            } else {
                diff_output.same_dimensions = 'No';
            }

            diff_output.mismatch_percentage = data.misMatchPercentage;

            var time_ended = performance.now();

            var visual_test_result = {
                unit: unit,
                profile: profile,
                test_case: options.test_case,
                preview: preview,
                diff_output: diff_output,
                execution_time: time_ended - time_started,
                expected_filename: expected_filename
            };

            if ( options.callback && _.isFunction(options.callback) ) {
                options.callback.call(this, visual_test_result);
            }
        });
    };
})();
