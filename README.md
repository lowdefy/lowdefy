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

# Lowdefy 🫶 The Config Webstack for Business Apps

Lowdefy is a source available web framework that enables you to:

- 🎨 Build web UIs and connect to databases and APIs.
- 🔌 Extend app functionality with npm plugins.
- ⚛️ Built on top of [Next.js](https://nextjs.org/) and [Auth.js](https://authjs.dev/).
- 🌐 Host your apps anywhere you host Next.js.
- ✂️ Only code your business logic.

Create internal tools, web apps, admin panels, BI dashboards, web sites and CRUD apps with simple YAML or JSON config.

### 🛠 Build Web UIs with Easy Config

Lowdefy config is easy to read, write, copy, paste, or template. Config when you can, but code when you need to.

- Over 70 Blocks and 150 logic operators for a quick start.
- Dynamic UIs with simple state management.
- Responsive layouts out of the box.
- Extend with custom React components.

### 📡 Connect to Your Data and APIs

Make API calls and read and write to your databases with minimal config. Build web apps that connect your data.

- Build dynamic queries using variables and logic operators.
- Execute requests from both authenticated and public pages.
- Secure secrets for passwords and API keys.
- Build custom connections with any npm modules.

## 🔧 Extend Everything with NPM Plugins

> Lowdefy's [Blocks](https://docs.lowdefy.com/blocks), [Requests](https://docs.lowdefy.com/connections-and-requests), [Operators](https://docs.lowdefy.com/operators), [Actions](https://docs.lowdefy.com/events-and-actions), Auth Providers, and Adapters can all be extended with plugins, making it the most flexible config web stack.
> Powered by NPM, Lowdefy's plugin system allows developers to bundle modules using their preferred packages. Even unpublished plugins can be added to your repository, enabling easy use of project-specific code. See the [plugin docs](https://docs.lowdefy.com/plugins) and [the plugin project example](https://github.com/lowdefy/lowdefy-example-plugins) for more details.

### 💼 Built for Developers and Enterprise-Ready

#### 🌍 Deploy Anywhere

Lowdefy runs as a Next.js app in production, so you can deploy it anywhere that supports Next.js deployment. Deploy with [Vercel](https://vercel.com), [Docker](https://docs.lowdefy.com/docker), or anything that runs Next.js apps.

#### 🔒 Secured with Auth.js

Authentication is built on top of Auth.js, providing the full flexibility and security from one of the most popular open-source auth layers. SSO, SAML, 2FA, no problem. Google, Okta, Auth0, and more - bring your own provider.

#### 👩‍💻👨‍💻 Git Control for Humans

Lowdefy's minimal config is designed to be easy to read, write, and understand, making it simple to copy, paste, review changes, or pick up where others left off. Defining apps using a structured schema speeds up development in teams of any size.

#### 🔑 Public, Authenticated, and Role-Based Access

Lowdefy supports building multi-page apps with both public and private pages, serving a wide range of use cases. Role-based access control (RBAC) allows for easy implementation of secure, granular access control where needed.

### How Lowdefy Apps Work 👉 https://docs.lowdefy.com

Lowdefy apps are built using:

- 📦 [Blocks](https://docs.lowdefy.com/blocks) are the visual part of the app, the React components. Lowdefy provides a set of default block types but app capabilities can be extended with custom blocks.
- ⚙️ [Operators](https://docs.lowdefy.com/operators) are the functions that are used to express logic within an app. Lowdefy has many built in easy to use operator functions for creating dynamic applications with ease, however, custom javascript operators can also be loaded.
- ⚡️ [Actions](https://docs.lowdefy.com/events-and-actions) are triggered by events, like clicking a button or loading a page. When events are triggered, a list of javascript functions can be called. Lowdefy has a set of useful actions, but applications functionality can be enriched by adding custom Lowdefy actions.
- 📣 [Requests](https://docs.lowdefy.com/connections-and-requests) make calls to external services to hydrate applications with data or post data to external services. Lowdefy doesn't have any data storage built in. Instead, it provides connections to external services like databases and APIs.

We are working on expanding the list of connections, and you can vote for the ones you need [here](https://github.com/lowdefy/lowdefy/discussions/309).

## Quick start

Run:

```bash
pnpx lowdefy@latest init && pnpx lowdefy@latest dev
```

This will create a file called `lowdefy.yaml` in the current working directory that contains the configuration for a Lowdefy app (as well as a `.gitignore`) and launch a local development server at http://localhost:3000. Make changes in the `lowdefy.yaml` file to see them reflect in the app.

### 🔗 More Lowdefy Links

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-start
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Join the Lowdefy Discord - https://discord.gg/WmcJgXt
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

### ⛹️‍♀️ Contributing

#### Lowdefy Plugins

The simplest way to contribute to Lowdefy is by creating custom plugins like Blocks, Actions, Requests, Operators, or Auth Adapters and Providers, and publishing them to NPM for the community's benefit.

Easily add and develop plugins in any Lowdefy project; refer to [the plugins project example](https://github.com/lowdefy/lowdefy-example-plugins) for a pnpm monorepo setup to jumpstart local plugin development.

When publishing your plugin to NPM, include `lowdefy` in the name for easy discovery, and share it on our [Github Discussions](https://github.com/lowdefy/lowdefy/discussions) to inform the community.

#### Lowdefy Platform Development

Run Lowdefy servers locally by adding your Lowdefy config to the `app/..` folder. Use one of the following scripts to the server:

- `pnpm app:cli:dev`: Starts the development server with the config provided in the `app` folder, useful for developing locally.
- `pnpm app:cli:build`: Creates a production build of your lowdefy app for the config config provided in the `app` folder.
- `pnpm app:cli:start`: Starts the production server of your lowdefy app built using the `build` command output.

> See the project `package.json` scripts for more predefined scripts.

Please also see [CONTRIBUTING.md](https://github.com/lowdefy/lowdefy/blob/main/CONTRIBUTING.md).

### ☕️ Changelog

Convert a v3 app to V4 - [See the v4 conversion notes.](https://docs.lowdefy.com/v3-to-v4)

All changes to this project are documented in [CHANGELOG.md](https://github.com/lowdefy/lowdefy/blob/main/CHANGELOG.md).

### 🔐 Security

If you discover a vulnerability, please follow the guide in [SECURITY.md](https://github.com/lowdefy/lowdefy/blob/main/SECURITY.md) to disclose this to us responsibly.

### 🤝 Code of Conduct

In the interest of fostering an open and welcoming environment, we as contributors and maintainers pledge to follow the [Contributor Covenant](https://www.contributor-covenant.org) code of conduct. See [CODE_OF_CONDUCT.md](https://github.com/lowdefy/lowdefy/blob/main/CODE_OF_CONDUCT.md) for more.
