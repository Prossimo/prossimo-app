/* eslint-disable global-require*/
process.env.NODE_ENV = 'test';

const path = require('path');
const webpackConfig = require('./webpack.config');
const rootPatch = path.join(__dirname, '../');

module.exports = {
    basePath: '',
    files: [
        path.resolve(rootPatch, './test/index.js'),
        path.resolve(rootPatch, './test/**/*_spec.js')
    ],

    // frameworks to use
    frameworks: ['mocha', 'sinon-chai', 'jquery-chai'],

    preprocessors: {
        [path.resolve(rootPatch, './test/index.js')]: ['webpack', 'sourcemap'],
        [path.resolve(rootPatch, './test/**/*_spec.js')]: ['webpack', 'sourcemap'],
        [path.resolve(rootPatch, './test/**/*.png')]: ['webpack']
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
