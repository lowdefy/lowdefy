<p align="center">
  <img alt="Lowdefy"  src="https://user-images.githubusercontent.com/7165064/121780045-d0021200-cb9e-11eb-84f9-ff67c8255ec6.gif" data-canonical-src="https://user-images.githubusercontent.com/7165064/121780045-d0021200-cb9e-11eb-84f9-ff67c8255ec6.gif" width="450" />
</p>

[![Discord](https://img.shields.io/discord/729696747261263962?label=Join%20our%20Discord&logo=discord&logoColor=white)](https://discord.gg/WmcJgXt)

[![Tweet](https://img.shields.io/twitter/url?logo=twitter&style=flat-square&url=https%3A%2F%2Flowdefy.com)](https://twitter.com/intent/tweet?text=Build%20web%20apps%2C%20admin%20panels%2C%20BI%20dashboards%2C%20and%20CRUD%20apps%20with%20ease%21%20Try%20&url=https://lowdefy.com&via=lowdefy&hashtags=lowcode,lowdefy,internaltools,developers,opensource)
[![Follow](https://img.shields.io/twitter/follow/lowdefy?logo=twitter&style=flat-square)](https://twitter.com/intent/follow?screen_name=lowdefy)

![Tests](https://github.com/lowdefy/lowdefy/workflows/Tests/badge.svg?branch=main)
[![Maintainability](https://api.codeclimate.com/v1/badges/6efe9bfa0648772cae00/maintainability)](https://codeclimate.com/github/lowdefy/lowdefy/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/6efe9bfa0648772cae00/test_coverage)](https://codeclimate.com/github/lowdefy/lowdefy/test_coverage)
[![Codecov](https://codecov.io/gh/lowdefy/lowdefy/branch/main/graph/badge.svg?token=U2AEEH9K1W)](https://codecov.io/gh/lowdefy/lowdefy)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/lowdefy/lowdefy.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/lowdefy/lowdefy/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/lowdefy/lowdefy.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/lowdefy/lowdefy/context:javascript)

Lowdefy is an open-source (Apache-2.0) low-code framework that lets you build web apps with YAML or JSON configuration files. It is great for building admin panels, BI dashboards, workflows, and CRUD apps.

## Advantages of writing internal tools in YAML or JSON

- All apps use the same structured config schema, this makes it easy to debug large apps or pick up where others left off.
- Nothing is hidden in a GUI. This allows you to do basic essential stuff, like copy, paste, find, replace, review changes etc. which makes developing apps more productive.
- App config is just data, thus you can even develop scripts to create and manage your apps.
- YAML files work with your favorite developer and source control tools.

## How Lowdefy apps work 👉 https://docs.lowdefy.com

Lowdefy apps are built using:

- 📦 [Blocks](https://docs.lowdefy.com/blocks) are the visual part of the app, the React components. Lowdefy provides a set of default block types but app capabilities can be extended with custom blocks.
- ⚙️ [Operators](https://docs.lowdefy.com/operators) are the functions that are used to express logic within an app. Lowdefy has many built in easy to use operator functions for creating dynamic applications with ease, however, custom javascript operators can also be loaded.
- ⚡️ [Actions](https://docs.lowdefy.com/events-and-actions) are triggered by events, like clicking a button or loading a page. When events are triggered, a list of javascript functions can be called. Lowdefy has a set of useful actions, but applications functionality can be enriched by adding custom Lowdefy actions.
- 📣 [Requests](https://docs.lowdefy.com/connections-and-requests) make calls to external services to hydrate applications with data or post data to external services. Lowdefy doesn't have any data storage built in. Instead, it provides connections to external services like databases and APIs.

We are working on expanding the list of connections, and you can vote for the ones you need [here](https://github.com/lowdefy/lowdefy/discussions/309).

## Lowdefy apps are self-hosted

Our goal is to make it easy to run Lowdefy apps anywhere. Lowdefy app servers are also stateless which makes it easy to run apps in serverless environments. Currently you can host Lowdefy apps:

- As a [Docker container](https://docs.lowdefy.com/docker).
- On [AWS Lambda](https://docs.lowdefy.com/aws-lambda) using Serverless.
- On [Netlify](https://docs.lowdefy.com/netlify) using Netlify functions.

## Quick start

Run:

```bash
npx lowdefy@latest init && npx lowdefy@latest dev
```

This will create a file called `lowdefy.yaml` in the current working directory that contains the configuration for a Lowdefy app (as well as a `.gitignore`) and launch a local development server at http://localhost:3000. Make changes in the `lowdefy.yaml` file to see them reflect in the app.

## Examples

##### CRUD example

This example shows patterns to implement a data admin app which allows users to view, create new, edit and delete data records.

- [Example demo.](https://example-crud.lowdefy.com)
- [App source code.](https://github.com/lowdefy/lowdefy-example-crud)

##### Survey example

This is a simple customer survey example built with Lowdefy. With this example we demonstrate how simple it is to define a public webform and thank you page in Lowdefy.

- [Example demo.](https://example-survey.lowdefy.com)
- [App source code.](https://github.com/lowdefy/lowdefy-example-survey)

##### Case management (ticketing) system example

This example focuses on building a rich UI for a hypothetical case management app, in a customer relations setting.

- [Example demo.](https://example-case-management.lowdefy.com)
- [App source code.](https://github.com/lowdefy/lowdefy-example-case-management)

##### Movies reporting example

This example demonstrates useful patterns for building a BI report/dashboard pages in Lowdefy. It connects to a MongoDB database with the Atlas Movies sample dataset pre-loaded.

- [Example demo.](https://example-reporting.lowdefy.com)
- [App source code.](https://github.com/lowdefy/lowdefy-example-reporting)

## Other Lowdefy packages and resources

- [@lowdefy/blocks-aggrid](https://github.com/lowdefy/blocks-aggrid): Lowdefy blocks to render [Ag-Grid](https://www.ag-grid.com/) tables.
- [@lowdefy/blocks-amcharts](https://github.com/lowdefy/blocks-amcharts): Lowdefy blocks to render [AmCharts v4](https://www.amcharts.com/).
- Lowdefy [Kubernetes examples](https://github.com/vaddisrinivas/lowdefy-example-k8s).

## More Lowdefy links

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-start
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Join the Lowdefy Discord - https://discord.gg/WmcJgXt
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

## Changelog

All changes to this project are documented in [CHANGELOG.md](https://github.com/lowdefy/lowdefy/blob/main/CHANGELOG.md).

## Contributing

Run Lowdefy servers locally by adding your Lowdefy config to the `app/..` folder. Use one of the following scripts to the server:

- `yarn start`: Starts the production server.
- `yarn start:dev`: Starts the production server in next development mode, useful for debugging Lowdefy code changes.
- `yarn start:server-dev`: Starts the development server in next production mode, useful for developing your Lowdefy config locally.

> `yarn install` and `yarn build` should be executed manually during development, this allows you to build only the package you are working on. Server needs to be restarted after package rebuild.

Please also see [CONTRIBUTING.md](https://github.com/lowdefy/lowdefy/blob/main/CONTRIBUTING.md).

## Security

If you discover a vulnerability, please follow the guide in [SECURITY.md](https://github.com/lowdefy/lowdefy/blob/main/SECURITY.md) to disclose this to us responsibly.

## Code of conduct

In the interest of fostering an open and welcoming environment, we as contributors and maintainers pledge to follow the [Contributor Covenant](https://www.contributor-covenant.org) code of conduct. See [CODE_OF_CONDUCT.md](https://github.com/lowdefy/lowdefy/blob/main/CODE_OF_CONDUCT.md) for more.

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
