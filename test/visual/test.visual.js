import _ from 'underscore';

import App from '../../src/main';
import cases from './visual-test-data';
import runVisualTest from './visual-test-runner';

App.session.set('no_backend', true);
App.getChannel().trigger('app:start');

//  Run all available visual tests in a loop
test('Visual tests', () => {
    _.each(cases, (test_case) => {
        it(test_case.title, (done) => {
            runVisualTest({
                test_case,
                diff_threshold: 0,
                callback: (result) => {
                    expect(result.diff_output.mismatch_percentage).to.equal(0);
                    done();
                },
            });
        });
    });
});
