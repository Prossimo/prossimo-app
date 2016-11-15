Sales web app for Prossimo LLC.

Looking for something? Check our [Wiki](https://github.com/prossimo-ben/prossimo-app/wiki) and [Slack team chat](https://prossimo.slack.com/).

Use this [awesome board](https://github.com/orgs/Prossimo/projects/1?fullscreen=true) to keep track of our issues.

## Сonfiguration

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
