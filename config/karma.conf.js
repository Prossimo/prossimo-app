/* eslint-disable global-require*/

const path = require('path');
const webpackConfig = require('./webpack.config');
const rootPatch = path.join(__dirname, '../');

module.exports = {
    basePath: '',
    files: [
        path.resolve(rootPatch, './test/index.js'),
        path.resolve(rootPatch, './test/**/*_spec2.js')
    ],

    // frameworks to use
    frameworks: ['mocha', 'sinon-chai', 'jquery-chai'],

    preprocessors: {
        [path.resolve(rootPatch, './test/index.js')]: ['webpack', 'sourcemap'],
        [path.resolve(rootPatch, './test/**/*_spec2.js')]: ['webpack', 'sourcemap'],
        [path.resolve(rootPatch, './test/**/*.png')]: ['webpack']
    },

    reporters: ['mocha'],

    webpack: Object.assign({}, webpackConfig, {entry: '', devtool: false}),

    webpackMiddleware: {
        noInfo: true
    },

    //  karma-spec-reporter
    specReporter: {
        maxLogLines: 10,         // limit number of lines logged per test
        suppressErrorSummary: false,  // do not print error summary
        suppressFailed: false,  // do not print information about failed test
        suppressPassed: false,  // do not print information about passed test
        suppressSkipped: true,  // do not print information about skipped test
        showSpecTiming: false // print the time elapsed for each spec
    },

    plugins: [
        require('karma-webpack'),
        require('karma-mocha'),
        require('karma-coverage'),
        require('karma-phantomjs-launcher'),
        require('karma-spec-reporter'),
        require('karma-mocha-reporter'),
        require('karma-sinon-chai'),
        require('karma-jquery-chai'),
        require('karma-sourcemap-loader'),
        require('karma-chrome-launcher')
    ],

    browsers: ['PhantomJS']
};
