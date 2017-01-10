/* eslint-disable no-console*/
/* eslint-disable global-require*/

require('babel-polyfill');
const express = require('express');
const cookieParser = require('cookie-parser');
const compress = require('compression');

const bodyParserMiddleware = require('./middlewares/bodyParserMiddleware');
const routers = require('./routers');
const config = require('../configs/config');
const port = config.get('server:port');
const isDebug = !config.get('release');

// Create app
const app = express();

app.use(cookieParser());
app.use(compress()); // Apply gzip compression

app.use(bodyParserMiddleware.bodyParserJsonMiddleware());
app.use(bodyParserMiddleware.bodyParserUrlencodedMiddleware());

if (isDebug) {
    const webpack = require('webpack');
    const webpackConfig = require('../configs/webpack.config');
    const compiler = webpack(webpackConfig);

    console.log('Enable webpack dev and HMR middleware');
    app.use(require('webpack-dev-middleware')(compiler, {
        publicPath: webpackConfig.output.publicPath,
        stats: webpackConfig.stats
    }));
    // app.use(require('webpack-hot-middleware')(compiler));
} else {
    app.use(express.static(config.get('dist:path')));
}

app.use('/', routers(config));

// And run the server
app.listen(config.get('server:port'), () => {
    console.log('Server running on port ' + port);
});
