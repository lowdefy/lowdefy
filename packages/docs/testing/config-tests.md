Config tests let you test a Lowdefy app in the same language you build it in. A **journey** is a YAML file that names a page, a user to act as, and a list of steps — click this block, fill that input, wait for a request, expect this state — and `lowdefy test` runs every journey in your app and reports which passed.

Journeys need no JavaScript, no Playwright setup and no separate test build. The runner boots your app's development server headless, drives each journey through the dev server's [journey route](/ai-agent-docs) (the same one the `lowdefy_run_journey` MCP tool uses), and prints a pass/fail line per journey. Because the format is declarative, an AI coding agent can write a journey for a page it just changed, run it, and read the failing step.

> Config tests run against the **development server**. For tests against a production build, or tests that need custom browser code, use the Playwright based [e2e testing](/e2e-introduction) toolkit instead.

## Layout

Journeys live in `tests/journeys/` inside your config directory, one `.yaml` file per journey or a top-level list of journeys per file:

```
my-app/
├── lowdefy.yaml
├── pages/
└── tests/
    └── journeys/
        ├── controls.yaml
        └── sign-up.yaml
```

Files run in file-name order, and journeys run one at a time — each journey opens its own browser context, but they all share your app's database, so parallel journeys would interfere with one another.

## A journey

```yaml
# tests/journeys/controls.yaml
- name: member creates a control
  pageId: controls
  user: admin
  urlQuery: { status: open }
  steps:
    - click: new_control
    - fill: { blockId: title, value: Access reviews }
    - click: submit
    - wait: { request: get_controls }
    - expect: { state: { path: controls.0.title, equals: Access reviews } }

- name: guest sees the empty state
  pageId: controls
  steps:
    - expect: { visible: empty_state }
```

| Field      | Required | Description                                                                                                                                                                     |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`     | Yes      | A short description. `--filter` matches against it, and it is printed in the results.                                                                                           |
| `pageId`   | Yes      | The page to open.                                                                                                                                                               |
| `user`     | No       | The user to act as: the name of a dev user fixture defined in `auth.dev.users`, or an inline user object such as `{ sub: u1, roles: [admin] }`. Leave it out to run signed out. |
| `urlQuery` | No       | An object appended to the page URL as a query string, for pages that read `_url_query`.                                                                                         |
| `steps`    | Yes      | At least one step. Each step is an object with exactly one key from the step grammar below.                                                                                     |

## Steps

Blocks are addressed by their `blockId`. Every step has a 5 second timeout by default; a step that does not complete in time fails the journey.

| Step                                      | Meaning                                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `click: blockId`                          | Click the block.                                                                                          |
| `fill: { blockId, value }`                | Type `value` into the input inside the block.                                                             |
| `select: { blockId, value }`              | Open the selector block and choose the option whose text is `value`.                                      |
| `press: Enter`                            | Press a key or chord. `Mod` in a chord (`Mod+k`) resolves to Cmd on macOS and Ctrl elsewhere.             |
| `wait: { ms }`                            | Pause for `ms` milliseconds.                                                                              |
| `wait: { request: requestId }`            | Wait until the request has finished loading.                                                              |
| `wait: { state: path }`                   | Wait until the state value at `path` is defined.                                                          |
| `screenshot: name`                        | Capture a screenshot. Screenshots are returned to agents using the MCP tool; the CLI runner ignores them. |
| `expect: { state: { path, equals } }`     | The page state at `path` deep-equals `equals`.                                                            |
| `expect: { visible: blockId }`            | The block is visible.                                                                                     |
| `expect: { text: { blockId, contains } }` | The block's rendered text contains the string.                                                            |
| `expect: { url: { contains } }`           | The browser URL contains the string.                                                                      |

The full grammar, including the failure shape the route returns, is documented with the [journey tool](/ai-agent-docs). The CLI and the MCP tool share one implementation, so a journey an agent verifies interactively can be committed as-is.

## Request tests

A **request test** runs one request or one Api endpoint routine on the server, with no browser, and compares the response to an expectation. It is the fastest way to check the shape a request returns — the thing every `_request.x.field` downstream depends on. Request tests live in `tests/requests/`, in files named `*.test.yaml`, one test or a list per file:

```
my-app/
└── tests/
    ├── journeys/
    └── requests/
        ├── controls.test.yaml
        └── create_control.test.yaml
```

```yaml
# tests/requests/controls.test.yaml
- name: get_controls returns open controls for the caller org
  pageId: controls
  requestId: get_controls
  user: admin
  payload: { status: open }
  seed:
    controls_connection:
      - _id: c1
        title: Access reviews
        status: open
        organization_id: org_1
        created_at: { '~d': '2026-01-01T00:00:00.000Z' }
  expect:
    - title: Access reviews
      status: open

- name: create_control returns the new control
  endpointId: create_control
  user: admin
  payload: { title: Vendor reviews }
  expect: { schema: { type: object, required: [_id, title] } }
```

| Field        | Required | Description                                                                                                                                                                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`       | Yes      | A short description. `--filter` matches against it, and it is printed in the results.                                                                                                                                       |
| `pageId`     | One of   | With `requestId`, the page request to run, through the dev server's `run-request` route.                                                                                                                                    |
| `requestId`  | One of   | The request on `pageId`.                                                                                                                                                                                                    |
| `endpointId` | One of   | Instead of `pageId` and `requestId`: the Api endpoint routine to run, through the `run-endpoint` route. Routines are never classified read-only, so this needs `cli.agentTools.allowWriteRequests: true` in `lowdefy.yaml`. |
| `user`       | No       | The caller: the name of a dev user fixture defined in `auth.dev.users`, or an inline user object such as `{ sub: u1, roles: [admin] }`. Leave it out to run signed out.                                                     |
| `payload`    | No       | The request or endpoint payload. Defaults to `{}`.                                                                                                                                                                          |
| `fixtures`   | No       | Names of shared fixtures (`fixtures/<name>.yaml`) to load before the test runs, in order, before `seed`. See [Fixtures](/fixtures).                                                                                         |
| `seed`       | No       | Documents to load before the test runs, keyed by `connectionId`. See below.                                                                                                                                                 |
| `expect`     | Yes      | What the response must look like: a literal subset, or `{ schema }`.                                                                                                                                                        |

A test names exactly one target: `pageId` together with `requestId`, or `endpointId`. Requests whose type is not declared read-only (for example `MongoDBInsertOne`) also need `cli.agentTools.allowWriteRequests: true`; a refused test fails with the reason and how to enable it.

### Seeding data

`seed` maps a `connectionId` to the documents that collection should hold when the request runs. Every seeded connection is pointed at an **in-memory MongoDB** the runner starts for the duration of the run, so seeded tests never touch the database your `.env` names, and one test's data never leaks into the next: before each test, every collection it seeds is dropped and re-inserted.

Seeding needs two optional packages installed in your project:

```
pnpm add -D mongodb-memory-server mongodb
```

Without them a run that contains a seeded test exits `1` with that install line — tests are never skipped silently. `mongodb-memory-server` downloads a MongoDB binary the first time it runs.

The collection a seed targets is read from the connection's build artifact, so the connection's `collection` (and `databaseName`, if set) must be **literal strings**. A connection that resolves its collection with an operator cannot be seeded; the test fails with `Connection "<id>" resolves its collection with an operator, so a seed cannot target it. Use a literal "collection" property, or seed through a request.` The connection's `databaseUri` may stay `{ _secret: MONGODB_URI }` — the runner overrides it.

Dates are written with the `~d` marker, exactly as Lowdefy serializes them: `created_at: { '~d': '2026-01-01T00:00:00.000Z' }` is inserted as a `Date`, and the same marker in `expect` compares as a date.

Documents that several tests share belong in a [fixture](/fixtures): `fixtures/base.yaml` is keyed by `connectionId` exactly like `seed`, and a test loads it with `fixtures: [base]`. Before each test the runner drops every collection named by its fixtures and its `seed` once, inserts the fixtures in list order, then inserts `seed`, so a test layers its specifics on a shared base.

Seeded tests need a server the command started; `--url` fails with `Seeded request tests need a server this command started; --url targets a server whose connections it cannot redirect.`

### Expectations

`expect` has two forms.

A **literal subset**: every key in `expect` must be present in the response with a deep-equal value; keys the response has that `expect` does not name are ignored. Arrays are compared element by element with the same rule and must have the same length, so `expect: [{ title: Access reviews }]` asserts exactly one row whose `title` is `Access reviews`, whatever else the row contains.

A **JSON schema**: `expect: { schema: { ... } }` validates the response against the schema instead. Use it when values are not predictable — ids, timestamps, counts.

A failing request test prints the path of the first mismatch, with `expected` and `actual`:

```
FAIL  get_controls returns open controls for the caller org
      file: /my-app/tests/requests/controls.test.yaml
      at: response.0.status
      expected: open
      actual:   closed
```

Journeys and request tests run in one `lowdefy test` run and share one summary line: `3 passed, 1 failed of 4 tests`. `--filter` matches the `name` of both kinds.

## Running

```
pnpx lowdefy@5 test
```

With no options, `lowdefy test` prepares `.lowdefy/dev` exactly as `lowdefy dev` does, starts the development server on a free port without opening a browser, runs every journey, prints the results and stops the server.

```
PASS  member creates a control  (5 steps, 1840ms)
FAIL  guest sees the empty state
      file: /my-app/tests/journeys/controls.yaml
      step 0: { expect: { visible: empty_state } }
      expected: block "empty_state" to be visible
      actual:   Timeout 5000ms exceeded.
1 passed, 1 failed of 2 tests
```

A failing journey stops at its first failing step and prints the step's index, the step itself, and the `expected` and `actual` values. Steps after the failure are not run.

### Options

- `--filter <name>`: Only run journeys and request tests whose `name` contains the string (case-insensitive). `lowdefy test --filter control` runs every test with "control" in its name.
- `--url <url>`: Run against a development server that is already running instead of starting one, for example `lowdefy test --url http://localhost:3000` while `lowdefy dev` is open in another terminal. This is the fastest way to iterate on a journey.
- `--port <port>`: The port to start the development server on. If it is in use the next free port is taken. The default is `3000`.
- `--config-directory`, `--dev-directory`, `--ref-resolver`, `--log-level`, `--disable-telemetry`: As for [`lowdefy dev`](/cli#dev).

### Exit codes

| Exit code | Meaning                                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`       | Every test passed, or there are no journeys or request tests (a note is printed).                                                             |
| `1`       | At least one test failed, a test file was invalid, seeding needed a package that is not installed, or an explicit `--filter` matched nothing. |

A journey file that is not valid YAML, or does not match the journey format (a missing `name`, a step with two keys, an unknown step key) is reported as a failed journey with the validation message and the file path. It never aborts the run, so one broken file cannot hide the results of the others.

## Continuous integration

`lowdefy test` needs only Node.js, pnpm and a Chromium the dev server can launch. A GitHub Actions job looks like:

```yaml
name: Config tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: pnpx playwright install --with-deps chromium
      - run: pnpx lowdefy@5 test
        env:
          LOWDEFY_DISABLE_TELEMETRY: true
```

Set the same environment variables (`.env` values, connection secrets) the app needs in dev, and make sure the database the journeys write to is a test database — journeys perform real actions against real requests.
