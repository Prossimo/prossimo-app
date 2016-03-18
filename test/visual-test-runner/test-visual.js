/* eslint-env qunit */
/* eslint strict:0 */
/* eslint max-statements:0 */
/* jscs:disable */

var app = app || {};
var case_data_array = case_data_array || [];

app.settings = new app.Settings();
app.session = new app.Session();
app.session.set('no_backend', true);


//  Test that QUnit is working
test('basic test', function () {
    ok(true, 'Passed.');
});

//  Run all available visual tests in a loop
test('visual tests', function (assert) {
    _.each(case_data_array, function (test_case) {
        var done = assert.async();

        app.runVisualTest({
            test_case: test_case,
            diff_threshold: 0,
            callback: function (result) {
                assert.equal( result.diff_output.mismatch_percentage, 0, result.test_case.title );
                done();
            }
        });
    });
});
