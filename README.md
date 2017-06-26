# Windows drawing and Quoting application

## Overview

This is our primary frontend application. It's mostly JavaScript (ES6), and is powered by the following stack:

- [Backbone](http://backbonejs.org/)
- [Marionette](https://marionettejs.com/)
- [Handlebars](http://handlebarsjs.com/)
- [Less](http://lesscss.org/)
- [Bootstrap](http://getbootstrap.com/)
- [Handsontable](http://handsontable.com/)
- [Konva](https://konvajs.github.io/)
- [Babel](https://babeljs.io/)
- [Webpack](https://webpack.js.org/)

## Requirements

- Mac OS X, Linux, or Windows
- [Node.js](https://nodejs.org/) v6.9 or newer
- `npm` v3.10 or newer (included with `Node.js`)
- `yarn` (download at https://yarnpkg.com/en/docs/install)

## Quick Start

#### 1. Install dependencies

Clone the repo, then `cd` to the destination directory and run:

```
yarn
```

This should install all project's dependencies from `package.json` for you. We're using `yarn` package manager because it has more deterministic algorithm than `npm`, so it guarantees that everyone has the exact same version of each dependency. Also, it's faster. Read more on [switching to yarn from npm](https://yarnpkg.com/lang/en/docs/migrating-from-npm/).

#### 2. Add configuration file

Create a `local.conf.json` file inside project's root folder, and copy the following:

```json
{
  "app": {
    "apiPrefix": "/api"
  },
  "server": {
    "apiPrefix": "",
    "printerPrefix": ""
  }
}
```

Please refer to the `tools/config/default.conf.js` file for the full list of configuration options. Use your `local.conf.json` file to override any default option. This is powered by [nconf](https://github.com/indexzero/nconf).

#### 3. Start development server

```
npm start
```

This command starts a development server (at http://localhost:9987/ by default). The server is powered by `Express.js` and [webpack dev middleware](https://github.com/webpack/webpack-dev-middleware). It takes source files from `src/`, runs them through `Babel`, bundles and serves them. In development mode all compiled files are stored in RAM.

Please note, that Hot Module Replacement is disabled by default, but you might enable it by adding `"hotWebpack": true` line to your `local.conf.json` file or by starting your development server with the corresponding flag, like this:

```
npm start -- --hotWebpack
```

#### 4. Run tests and lint checks

First, ensure that your code passes lint checks:

```
npm run lint
```

This command is powered by `eslint`. We mostly rely on the [config used by aribnb](https://github.com/airbnb/javascript), but have a few minor changes (see our `.eslintrc` for that). Also, our tests and development tools use slightly different configurations as well, but mostly follow our root configuration.

Then, run unit tests with this command:

```
npm run test
```

Tests are powered by [Mocha](https://mochajs.org/) and [Karma](https://karma-runner.github.io/). All unit tests are expected to pass.

Additionally, you could also run visual tests:

```
npm run test:visual
```

The idea behind the visual tests is to generate some images with the help of our Unit Drawing module, and compare them with the reference images. However, in its current state visual tests are not expected to pass. _We are going to improve this fuctionality, but until then visual tests are optional._

#### 5. Build

```
npm run build
```

This command will compile, bundle and minify project's files, and put them into `dist/` folder along with the static assets (fonts and images). The contents of the `dist/` folder are ready to be deployed to the production server.

## Directory layout

```
assets/       - static assets like images and fonts
design/       - source files for images
src/          - application source files
test/         - unit tests
tools/        - everything related to development: server, configs, etc.
```

## Our workflow and additional info

We use GitHub Issues as our task and issue tracker. Each repository has its own separate set of issues, but we also group them all into [a kanban board](https://github.com/orgs/Prossimo/projects/1).

Please refer to the wiki doc on [our GitHub workflow](https://github.com/Prossimo/prossimo-app/wiki/Our-GitHub-workflow).

Also, check the following links:

- [our Slack team chat](https://mavrikdev.slack.com)
- [our Wiki](https://github.com/prossimo-ben/prossimo-app/wiki)
