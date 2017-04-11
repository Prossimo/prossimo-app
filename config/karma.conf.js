/* eslint-disable global-require*/
process.env.NODE_ENV = 'test';

const doVisualTests = process.env.DO_VISUAL_TESTS;
const path = require('path');
const webpackConfig = require('./webpack.config');
const rootPath = path.join(__dirname, '../');

let files = [];

if (doVisualTests) {
    files = [
        path.resolve(rootPath, './test/index.js'),
        path.resolve(rootPath, './test/**/test-visual.js')
    ];
} else {
    files = [
        path.resolve(rootPath, './test/index.js'),
        path.resolve(rootPath, './test/**/*.spec.js')
    ];
}

module.exports = {
    basePath: '',
    files: files,

    // frameworks to use
    frameworks: ['mocha', 'sinon-chai', 'jquery-chai'],

    preprocessors: {
        [path.resolve(rootPath, './test/index.js')]: ['webpack', 'sourcemap'],
        [path.resolve(rootPath, './test/**/*.spec.js')]: ['webpack', 'sourcemap'],
        [path.resolve(rootPath, './test/**/test-visual.js')]: ['webpack', 'sourcemap'],
        [path.resolve(rootPath, './test/**/*.png')]: ['webpack']
    },

    reporters: ['mocha'],

    webpack: Object.assign({}, webpackConfig, {entry: '', devtool: 'eval'}),

    webpackMiddleware: {
        noInfo: true
    },

    // reporter options
    mochaReporter: {
        showDiff: false
    },

    plugins: [
        require('karma-webpack'),
        require('karma-mocha'),
        require('karma-coverage'),
        require('karma-phantomjs-launcher'),
        require('karma-mocha-reporter'),
        require('karma-sinon-chai'),
        require('karma-jquery-chai'),
        require('karma-sourcemap-loader'),
        require('karma-chrome-launcher')
    ],

    browsers: ['PhantomJS']
};
