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
  user: { roles: [admin] }
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
| `user`     | No       | The user to act as, as an inline user object such as `{ sub: u1, roles: [admin] }`. Leave it out to run as the default roleless headless user.                                   |
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
1 passed, 1 failed of 2 journeys
```

A failing journey stops at its first failing step and prints the step's index, the step itself, and the `expected` and `actual` values. Steps after the failure are not run.

### Options

- `--filter <name>`: Only run journeys whose `name` contains the string (case-insensitive). `lowdefy test --filter control` runs every journey with "control" in its name.
- `--url <url>`: Run against a development server that is already running instead of starting one, for example `lowdefy test --url http://localhost:3000` while `lowdefy dev` is open in another terminal. This is the fastest way to iterate on a journey.
- `--port <port>`: The port to start the development server on. If it is in use the next free port is taken. The default is `3000`.
- `--config-directory`, `--dev-directory`, `--ref-resolver`, `--log-level`, `--disable-telemetry`: As for [`lowdefy dev`](/cli#dev).

### Exit codes

| Exit code | Meaning                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `0`       | Every journey passed, or `tests/journeys/` has no journeys (a note is printed).                        |
| `1`       | At least one journey failed, a journey file was invalid, or an explicit `--filter` matched no journey. |

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
