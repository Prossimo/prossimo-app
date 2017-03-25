Sales web app for Prossimo LLC.

Looking for something? Check our [Wiki](https://github.com/prossimo-ben/prossimo-app/wiki) and [Slack team chat](https://prossimo.slack.com/).

Use this [awesome board](https://github.com/orgs/Prossimo/projects/1?fullscreen=true) to keep track of our issues.

## Getting Started

#### 1. Run `npm install`

This will install both run-time project dependencies and developer tools listed
in [package.json](./package.json) file.

#### 3. Run `npm start`

This command will build the app from the source files (`/src`) into the output
`/dist` folder. As soon as the initial build completes, it will start the
Node.js server (`node server/server.js`) and [Browsersync](https://browsersync.io/)
with [HMR](https://webpack.github.io/docs/hot-module-replacement) on top of it.

> [http://localhost:3000/](http://localhost:3000/) — Node.js server (`server/server.js`)<br>
> [http://localhost:3001/](http://localhost:3001/) — BrowserSync proxy with HMR, React Hot Transform<br>
> [http://localhost:3002/](http://localhost:3002/) — BrowserSync control panel (UI)

![browsersync](https://dl.dropboxusercontent.com/u/16006521/react-starter-kit/brwosersync.jpg)

### How to Build, Test, Deploy

### Requirements

  * Mac OS X, Windows, or Linux
  * [Node.js](https://nodejs.org/) v6.9 or newer
  * `npm` v3.10 or newer (new to [npm](https://docs.npmjs.com/)?)
  * `node-gyp` prerequisites mentioned [here](https://github.com/nodejs/node-gyp)

### Directory Layout **(is under development)**
Before you start, take a moment to see how the project structure looks like:

### Quick Start

### Сonfiguration

We use [nconf](https://github.com/indexzero/nconf) for configuration this app. If necessary, you can use your configuration file. You could create `local.conf.json` in the app root folder.

#### Example `local.conf.json`

```javascript
{
    server: {
        port: '9987',
        apiHost: '127.0.0.1',
        apiPort: '8000',
        apiPrefix: '/api',
        printerHost: '127.0.0.1',
        printerPort: '8080',
        printerPrefix: '/print'
    }
}
```

Full list of available options you can look in the file `./configs/default.conf.js`

#### Env
Responsible for loading the values parsed from process.env into the configuration hierarchy.
```shell
node app.js --server:port=9987 --release`
```
