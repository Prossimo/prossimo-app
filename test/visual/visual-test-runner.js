import _ from 'underscore';
import resemble from 'resemblejs';

import Unit from 'src/core/models/unit';
import Profile from 'src/core/models/profile';
import {preview as previewFn} from 'src/components/drawing/module/drawing-module';

function getExpectedFile(imgData) {
    let user_agent = navigator.userAgent;
    let agent = 'chrome';

    if (user_agent.indexOf('PhantomJS') !== -1) {
        agent = 'phantom';
    } else if (user_agent.indexOf('Firefox') !== -1) {
        agent = 'firefox';
    }

    return imgData[agent];
}

const runVisualTest = function (options) {
    let defaults = {
        diff_threshold: 0,
        test_case: {},
        callback: undefined
    };

    options = _.defaults({}, options, defaults);

    let time_started = performance.now();

    let profile = new Profile(options.test_case.profile_data);
    let unit = new Unit(_.extend({}, options.test_case.unit_data, {
        root_section: options.test_case.root_section_json_string
    }));

    unit.profile = profile;

    let preview = previewFn(unit, {
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
        largeImageThreshold: 1200,
        useCrossOrigin: false
    });

    let expected_filename = getExpectedFile(options.test_case.imgData);

    resemble(expected_filename).compareTo(preview).ignoreAntialiasing().onComplete(function (data) {
        let diff_output = {};

        diff_output.diff_image_src = data.getImageDataUrl();

        if (data.rawMisMatchPercentage <= options.diff_threshold) {
            diff_output.status = 'success';
            diff_output.status_text = 'Images are identical';
        } else {
            diff_output.status = 'error';
            diff_output.status_text = 'Images are different';
        }

        if (data.isSameDimensions) {
            diff_output.same_dimensions = 'Yes';
        } else {
            diff_output.same_dimensions = 'No';
        }

        diff_output.mismatch_percentage = data.misMatchPercentage;

        let time_ended = performance.now();

        let visual_test_result = {
            unit: unit,
            profile: profile,
            test_case: options.test_case,
            preview: preview,
            diff_output: diff_output,
            execution_time: time_ended - time_started,
            expected_filename: expected_filename
        };

        if (options.callback && _.isFunction(options.callback)) {
            options.callback.call(this, visual_test_result);
        }
    });
};
export default runVisualTest;
