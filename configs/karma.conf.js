/* eslint-disable global-require*/

const path = require('path');
const webpackConfig = require('./webpack.config');
const rootPatch = path.join(__dirname, '../');

module.exports = {
    basePath: '',
    files: [
        path.resolve(rootPatch, './tests/**/*_spec.js')
    ],

    // frameworks to use
    frameworks: ['mocha', 'sinon-chai', 'jquery-chai'],

    preprocessors: {
        [path.resolve(rootPatch, './tests/**/*_spec.js')]: ['webpack', 'sourcemap']
    },

    reporters: ['spec'],

    webpack: Object.assign({}, webpackConfig, {entry: '', devtool: 'inline'}),

    webpackMiddleware: {
        noInfo: true
    },

    //  karma-spec-reporter
    specReporter: {
        maxLogLines: 10,         // limit number of lines logged per test
        suppressErrorSummary: false,  // do not print error summary
        suppressFailed: false,  // do not print information about failed tests
        suppressPassed: false,  // do not print information about passed tests
        suppressSkipped: true,  // do not print information about skipped tests
        showSpecTiming: false // print the time elapsed for each spec
    },

    plugins: [
        require('karma-webpack'),
        require('karma-mocha'),
        require('karma-coverage'),
        require('karma-phantomjs-launcher'),
        require('karma-spec-reporter'),
        require('karma-sinon-chai'),
        require('karma-jquery-chai'),
        require('karma-sourcemap-loader'),
        require('karma-chrome-launcher')
    ],

    browsers: ['PhantomJS']
};
