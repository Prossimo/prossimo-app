const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const config = require('./config');

const version = config.get('version');
const srcPath = config.get('app:srcPath');
const distPath = config.get('dist:patch');
const isDebug = !config.get('release');
const isVerbose = config.get('verbose');
const sourcePath = config.get('app:sourcePath');

const APP_ENTRY = [path.resolve(srcPath, 'main.js'), path.resolve(sourcePath, 'less/styles.less')];

const cssLoader = `css-loader?${JSON.stringify({
    importLoaders: 1,
    sourceMap: isDebug,
    modules: false,
    minimize: !isDebug
})}`;
const lessLoader = `less-loader?${JSON.stringify({
    sourceMap: isDebug
})}`;

module.exports = {
    context: srcPath,
    resolve: {
        root: srcPath
    },
    output: {
        filename: `app-${version}.js`,
        path: distPath,
        publicPath: '/'
    },

    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                include: [srcPath],
                loader: 'babel'
            },
            {test: /backbone\.js$/, loader: 'backbone-extended-loader'},
            {test: /\.hbs$/, loader: 'handlebars-template-loader'},
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract('style-loader', [cssLoader, lessLoader].join('!'))
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('style-loader', [cssLoader].join('!'))
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.txt$/,
                loader: 'raw-loader'
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/,
                loader: 'url-loader',
                query: {
                    name: isDebug ? 'img/[name].[ext]?[hash]' : 'img/[hash].[ext]',
                    limit: 10000
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf)$/,
                loader: 'file-loader',
                query: {
                    name: isDebug ? 'font/[name].[ext]?[hash]' : 'font/[hash].[ext]'
                }
            },
            {
                test: /\.(wav|mp3)$/,
                loader: 'file-loader',
                query: {
                    name: isDebug ? 'file/[name].[ext]?[hash]' : 'file/[hash].[ext]'
                }
            }
        ]
    },

    plugins: [
        new ExtractTextPlugin(`css/[name]-${version}.css`),
        new webpack.ContextReplacementPlugin(/moment\/locale/, /en-gb/),
        new HtmlWebpackPlugin({
            template: path.resolve(srcPath, 'index.html'),
            hash: false,
            version: version,
            api_prefix: config.get('app:apiPrefix'),
            printer_prefix: config.get('app:printerPrefix'),
            favicon: path.resolve(config.get('app:publicPath'), './img/favicon' + (isDebug ? '-dev' : '') + '.png'),
            filename: 'index.html',
            inject: 'body'
        }),
        new webpack.NoErrorsPlugin(),

        ...isDebug ? [
            // new webpack.HotModuleReplacementPlugin()
        ] : [
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    screw_ie8: true,
                    warnings: isVerbose
                }
            })
        ]
    ],

    entry: APP_ENTRY,

    devtool: isDebug ? config.get('app:devtool') : config.get('dist:devtool'),
    cache: isDebug,
    debug: isDebug,

    stats: {
        colors: true,
        reasons: isDebug,
        hash: isVerbose,
        version: isVerbose,
        timings: true,
        chunks: isVerbose,
        chunkModules: isVerbose,
        cached: isVerbose,
        cachedAssets: isVerbose
    }
};
