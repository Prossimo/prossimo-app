import _ from 'underscore';
import resemble from 'resemblejs';

import Unit from '../../src/core/models/unit';
import Profile from '../../src/core/models/profile';

function getExpectedFile(imgData) {
    const user_agent = navigator.userAgent;
    let agent = 'chrome';

    if (user_agent.indexOf('PhantomJS') !== -1) {
        agent = 'phantom';
    } else if (user_agent.indexOf('Firefox') !== -1) {
        agent = 'firefox';
    }

    return imgData[agent];
}

const runVisualTest = (options) => {
    const defaults = {
        diff_threshold: 0,
        test_case: {},
        callback: undefined,
    };
    const current_options = _.defaults({}, options, defaults);

    const time_started = performance.now();

    const profile = new Profile(current_options.test_case.profile_data);
    const unit = new Unit(_.extend({}, current_options.test_case.unit_data, {
        root_section: current_options.test_case.root_section_json_string,
    }));

    unit.profile = profile;

    const preview = unit.getPreview({
        width: current_options.test_case.preview_settings.width,
        height: current_options.test_case.preview_settings.height,
        mode: 'base64',
        position: current_options.test_case.preview_settings.position,
        hingeIndicatorMode: current_options.test_case.preview_settings.hingeIndicatorMode,
    });

    resemble.outputSettings({
        errorColor: {
            red: 255,
            green: 0,
            blue: 255,
        },
        errorType: 'movementDifferenceIntensity',
        transparency: 0.3,
        largeImageThreshold: 1200,
        useCrossOrigin: false,
    });

    const expected_filename = getExpectedFile(current_options.test_case.imgData);

    resemble(expected_filename).compareTo(preview).ignoreAntialiasing().onComplete((data) => {
        const diff_output = {};

        diff_output.diff_image_src = data.getImageDataUrl();

        if (data.rawMisMatchPercentage <= current_options.diff_threshold) {
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

        const time_ended = performance.now();

        const visual_test_result = {
            unit,
            profile,
            test_case: current_options.test_case,
            preview,
            diff_output,
            execution_time: time_ended - time_started,
            expected_filename,
        };

        if (current_options.callback && _.isFunction(current_options.callback)) {
            current_options.callback.call(this, visual_test_result);
        }
    });
};

export default runVisualTest;
