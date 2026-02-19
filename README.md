<p align="center">
  <img alt="Lowdefy"  src="https://user-images.githubusercontent.com/7165064/121780045-d0021200-cb9e-11eb-84f9-ff67c8255ec6.gif" data-canonical-src="https://user-images.githubusercontent.com/7165064/121780045-d0021200-cb9e-11eb-84f9-ff67c8255ec6.gif" width="450" />
</p>

[![Discord](https://img.shields.io/discord/729696747261263962?label=Join%20our%20Discord&logo=discord&logoColor=white)](https://discord.gg/WmcJgXt)
[![Follow](https://img.shields.io/twitter/follow/lowdefy?logo=x&style=flat-square)](https://x.com/lowdefy)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Lowdefy-blue?logo=linkedin&logoColor=white)](https://www.linkedin.com/company/lowdefy)

# Lowdefy - The Config-First Web Stack for AI and Humans

Build apps that AI can generate, humans can review, and teams can maintain. Config that works between code and natural language.

### Why config-first matters in the age of AI

AI writes code fast, but the maintenance doesn't scale. LLMs generate thousands of lines that are hard to review, inconsistent across sessions, and full of hidden vulnerabilities. Lowdefy solves this:

- **50 lines of config vs 500 lines of code** — AI generates concise, reviewable config instead of sprawling React components.
- **Schema-validated, no arbitrary code paths** — Every property validated against a schema. No arbitrary code paths.
- **One framework update upgrades all your apps** — Config is stable. Lowdefy updates benefits all apps. No fixing each AI-generated codebase individually.
- **Config is interpreted, not executed** — No code injection possible. Auth, permissions, and data validation built into the runtime.

### Full-stack, production-ready

- **Built on [Next.js](https://nextjs.org/) and [Auth.js](https://authjs.dev/)** — Deploy anywhere you host Next.js.
- **70+ UI components** — Forms, tables, charts, markdown, and more out of the box.
- **50+ logic operators** — `_if`, `_get`, `_js`, `_state` for dynamic UIs without writing code.
- **10+ data connectors** — MongoDB, PostgreSQL, MySQL, REST APIs, Google Sheets, S3, Elasticsearch, Stripe.
- **Auth & RBAC** — 75+ auth providers, public and private pages, role-based access control.

### Extend with npm plugins

Blocks, Connections, Operators, Actions, Auth Providers, and Adapters can all be extended with plugins. Declare them in config — Lowdefy handles the rest.

Tree-shaking bundles only what you use. Build custom plugins with npm packages and publish them for the community.

- https://docs.lowdefy.com/plugins-introduction
- https://github.com/lowdefy/lowdefy-example-plugins (pnpm monorepo setup)
- https://github.com/lowdefy/community-plugins

## Quick Start

```bash
npx lowdefy@latest init && npx lowdefy@latest dev
```

This creates a `lowdefy.yaml` in the current directory and launches a local development server at http://localhost:3000. Edit the config to see changes reflected in the app.

## How It Works

```yaml
lowdefy: 4
pages:
  - id: welcome
    type: PageHeaderMenu
    blocks:
      - id: card
        type: Card
        blocks:
          - id: name
            type: TextInput
            properties:
              label: What's your name?
          - id: greeting
            type: Alert
            properties:
              type: success
              message:
                _js: |
                  const n = state('name');
                  return n ? `Hello, ${n}!` : 'Type your name';
          - id: submit
            type: Button
            properties:
              title: Save
            events:
              onClick:
                - id: validate
                  type: Validate
```

Lowdefy apps are built using:

- **[Blocks](https://docs.lowdefy.com/blocks)** — 70+ React UI components, from forms and tables to charts and markdown. Extend with custom blocks via npm plugins.
- **[Operators](https://docs.lowdefy.com/operators)** — 50+ logic functions (`_if`, `_get`, `_js`) for dynamic UIs with simple state management.
- **[Actions](https://docs.lowdefy.com/events-and-actions)** — Event handlers triggered by clicks, page loads, and more. Validate, navigate, call APIs, and set state.
- **[Connections & Requests](https://docs.lowdefy.com/connections-and-requests)** — Connect to MongoDB, PostgreSQL, MySQL, REST APIs, Google Sheets, S3, Elasticsearch, Stripe, and more.

## Links

- [Documentation](https://docs.lowdefy.com)
- [Getting started tutorial](https://docs.lowdefy.com/tutorial-start)
- [Website](https://lowdefy.com)
- [Community forum](https://github.com/lowdefy/lowdefy/discussions)
- [Discord](https://discord.gg/WmcJgXt)
- [Bug reports & feature requests](https://github.com/lowdefy/lowdefy/issues)

---

## Lowdefy is built and maintained by Resonancy

🚀 Too many apps? https://resonancy.io builds it for you.

Most teams run 10+ business apps that don't talk to each other. https://resonancy.io replaces them with one purpose-built solution on Lowdefy — delivered in days, not months.

- Consolidate your stack — Replace disconnected apps with one unified solution.
- Streamline workflows — Seamlessly integrated systems that free up your team.
- Ship in days — Custom apps built fast with Lowdefy.
- Connect everything — Real-time data across your business for reliable insights.

✅ One unified app replacing your SaaS dependency · ✅ Custom solution tailored to your business · ✅ AI, data science & integrations included · ✅ Ongoing support & managed hosting

10+ years building business apps. 50+ internal tools deployed. Built on open source.

https://resonancy.io

---

## Contributing

### Platform Development

Run Lowdefy servers locally by adding your config to the `app/` folder:

- `pnpm app:dev` — Start the development server.
- `pnpm app:build` — Create a production build.
- `pnpm app:start` — Start the production server.

> Use `pnpm app:dev -- --path <path>` to run a specific app directory (e.g. a test app). See [CONTRIBUTING.md](https://github.com/lowdefy/lowdefy/blob/main/CONTRIBUTING.md) for more. See the project `package.json` scripts for more predefined scripts.

See [CONTRIBUTING.md](https://github.com/lowdefy/lowdefy/blob/main/CONTRIBUTING.md) for more.

## Changelog

All changes are documented in [CHANGELOG.md](https://github.com/lowdefy/lowdefy/blob/main/CHANGELOG.md). Converting from v3? See the [v4 migration guide](https://docs.lowdefy.com/v3-to-v4).

## Security

If you discover a vulnerability, please follow the guide in [SECURITY.md](https://github.com/lowdefy/lowdefy/blob/main/SECURITY.md).

## Code of Conduct

See [CODE_OF_CONDUCT.md](https://github.com/lowdefy/lowdefy/blob/main/CODE_OF_CONDUCT.md).
