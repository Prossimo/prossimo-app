/* eslint-disable no-console*/
/* eslint-disable global-require*/

require('babel-polyfill');
// const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compress = require('compression');

const config = require('../configs/config');
const port = config.get('server:port');
const isDebug = !config.get('release');

// Create app
const app = express();

app.use(cookieParser());
app.use(compress()); // Apply gzip compression
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

if (isDebug) {
    const webpack = require('webpack');
    const webpackConfig = require('../configs/webpack.config');
    const compiler = webpack(webpackConfig);

    console.log('Enable webpack dev and HMR middleware');
    app.use(require('webpack-dev-middleware')(compiler, {
        stats: webpackConfig.stats
    }));
    // app.use(require('webpack-hot-middleware')(compiler));
} else {
    app.use(express.static(config.get('dist:patch')));
}

// api
// app.all('/api/*', (req, res) => {
    // var options = {
    //     host: config.get('server:apiHost'),
    //     port: config.get('server:apiPort'),
    //     path: config.get('server:apiPrefix'),
    //     headers: req.headers
    // };
    //
    // var creq = http.request(options, function (cres) {
    //
    //     // set encoding
    //     cres.setEncoding('utf8');
    //
    //     // wait for data
    //     cres.on('data', function (chunk) {
    //         res.write(chunk);
    //     });
    //
    //     cres.on('close', function () {
    //         // closed, let's end client request as well
    //         res.writeHead(cres.statusCode);
    //         res.end();
    //     });
    //
    //     cres.on('end', function () {
    //         // finished, let's finish client request as well
    //         res.writeHead(cres.statusCode);
    //         res.end();
    //     });
    //
    // }).on('error', function (e) {
    //     // we got an error, return 500 error to client and log error
    //     console.log(e.message);
    //     res.writeHead(500);
    //     res.end();
    // });
    //
    // creq.end();
// });

// And run the server
app.listen(config.get('server:port'), () => {
    console.log('Server running on port ' + port);
});
