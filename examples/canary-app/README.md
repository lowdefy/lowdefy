# canary-app

This app exists to be built by CI against every candidate framework build. It is not a
starter template and not a showcase. It must stay small.

`.github/workflows/canary.yml` publishes a nightly `experimental` candidate to npm, copies
this directory to `.canary/canary-app` with `lowdefy:` rewritten to that version
(`scripts/canary/prepareApp.mjs`), and runs, from npm:

```
npx lowdefy@<version> build
npx lowdefy@<version> check --json
npx lowdefy@<version> test
```

A candidate that passes here and for `packages/docs` is recorded with a `canary-green-<version>`
tag; the weekly promotion moves the `known-good` dist-tag to the newest green candidate.

## What it covers

One page (or endpoint) per feature area, so a regression anywhere lands on a red job:

| File                                 | Exercises                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `lowdefy.yaml`                       | `auth.dev.users` fixtures, `collections:` with a tenant field and a shared collection, a scoped and a shared `MongoDBCollection` |
| `pages/form.yaml`                    | A `state:` contract, `required` on text, select, date and number inputs, `Validate`, a submit `Request`, a `_js` module reference, a `Template` block |
| `pages/list.yaml`                    | A `List` over an aggregation with a filter and `Pagination`, a `Template` over the shared catalogue |
| `pages/detail.yaml`                  | `_url_query`, `Descriptions`, a `Modal` opened with `CallMethod`                       |
| `api/save-item.yaml`                 | An `Api` endpoint with `payloadSchema`, `responseSchema`, `:try`/`:catch`, `MongoDBInsertOne`, `:return` |
| `lib/items.js`                       | The module the `_js` references resolve to                                             |
| `plugins/**`                         | File plugins: a `.jsx` block, an action, a shared operator and a `StaticRows` connection with one request, each with a sibling JSON meta/schema, used on `pages/list.yaml` |
| `tests/journeys/*.yaml`              | Two journeys: form submit and list filter                                              |
| `tests/requests/save-item.test.yaml` | Request tests for the endpoint and the list request, seeded into an in-memory MongoDB   |

## Running it locally

The committed `lowdefy:` version is the placeholder `0.0.0-canary`; CI rewrites it. To run the
app against the monorepo's workspace build, copy it with `lowdefy: local`:

```
node scripts/canary/prepareApp.mjs --app examples/canary-app --out .canary/local --version local
export MONGODB_URI=mongodb://localhost:27017/canary BETTER_AUTH_SECRET=canary-local-secret
node scripts/build.mjs --config-directory .canary/local
node packages/cli/dist/index.js check --config-directory .canary/local --server-directory _server/prod
node scripts/dev.mjs --skip-build --config-directory .canary/local --port 3246   # prepares _server/dev; stop it
node packages/cli/dist/index.js test --config-directory .canary/local --dev-directory _server/dev --port 3246
```

The request tests seed an in-memory MongoDB and need `mongodb-memory-server` and `mongodb`
installed (`package.json` lists them; the workflow runs `npm install` in the copy).

## Keeping it small

Add a page only when a feature area gets no coverage from the pages that exist. Prefer adding a
block or a step to an existing page. Every journey runs against a booted dev server, so each
new one adds seconds to the canary; every new secret adds a workflow variable.
