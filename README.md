![Lowdefy](https://lowdefy.com/banner.png)

[![Tweet](https://img.shields.io/twitter/url?logo=twitter&style=flat-square&url=https%3A%2F%2Flowdefy.com)](https://twitter.com/intent/tweet?text=Build%20web%20apps%2C%20admin%20panels%2C%20BI%20dashboards%2C%20and%20CRUD%20apps%20with%20ease%21%20Try%20&url=https://lowdefy.com&via=lowdefy&hashtags=lowcode,lowdefy,internaltools,developers,opensource)
[![Follow](https://img.shields.io/twitter/follow/lowdefy?logo=twitter&style=flat-square)](https://twitter.com/intent/follow?screen_name=lowdefy)

![Tests Main](https://github.com/lowdefy/lowdefy/workflows/Test%20Branches/badge.svg?branch=main)
![Tests Develop](https://github.com/lowdefy/lowdefy/workflows/Test%20Branches/badge.svg?branch=develop)
[![Maintainability](https://api.codeclimate.com/v1/badges/6efe9bfa0648772cae00/maintainability)](https://codeclimate.com/github/lowdefy/lowdefy/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/6efe9bfa0648772cae00/test_coverage)](https://codeclimate.com/github/lowdefy/lowdefy/test_coverage)
[![Codecov](https://codecov.io/gh/lowdefy/lowdefy/branch/main/graph/badge.svg?token=U2AEEH9K1W)](https://codecov.io/gh/lowdefy/lowdefy)

Lowdefy is an open-source (Apache-2.0) low-code framework that lets you build web apps with YAML configuration files. It is great for building admin panels, BI dashboards, workflows, and CRUD apps.

Advantages of writing internal tools in YAML:

- All apps use the same structured config schema, this makes it easy to debug large apps or pick up where others left off.
- Nothing is hidden in a GUI. This allows you to do basic essential stuff, like copy, paste, find, replace etc. which makes developing apps more productive.
- App config is just data, thus you can even develop scripts to create and manage your apps.
- YAML files work with your favorite developer and source control tools.

Read the docs at https://docs.lowdefy.com.

UIs in Lowdefy are built using blocks, which are React components. Lowdefy provides a set of default block types with the essentials needed to build an app, but you can also create your own custom blocks. Lowdefy uses [webpack module federation](https://webpack.js.org/concepts/module-federation/) to import these blocks as micro front-ends.

Lowdefy doesn't have any data storage built in. Instead, it provides connections to external services like databases and APIs. We are working on expanding the list of connections, and you can vote for the ones you need [here](https://github.com/lowdefy/lowdefy/discussions/309).

To host a Lowdefy app, only a simple server is needed. Lowdefy was designed to run in a serverless environment from the start. Currently you can host your apps on [Netlify](https://www.netlify.com), with support for Docker, AWS Lambda functions and more coming soon.

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

## More Lowdefy resources

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-start
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

## Changelog

All changes to this project are documented in [CHANGELOG.md](https://github.com/lowdefy/lowdefy/blob/main/CHANGELOG.md).

## Contributing

Please see [CONTRIBUTING.md](https://github.com/lowdefy/lowdefy/blob/main/CONTRIBUTING.md).

## Security

If you discover a vulnerability, please follow the guide in [SECURITY.md](https://github.com/lowdefy/lowdefy/blob/main/SECURITY.md) to disclose this to us responsibly.

## Code of conduct

In the interest of fostering an open and welcoming environment, we as contributors and maintainers pledge to follow the [Contributor Covenant](https://www.contributor-covenant.org) code of conduct. See [CODE_OF_CONDUCT.md](https://github.com/lowdefy/lowdefy/blob/main/CODE_OF_CONDUCT.md) for more.

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
