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
    - set: { blockId: priority, value: 3 }
    - click: submit
    - wait: { request: get_controls }
    - expect: { state: { path: controls.0.title, equals: Access reviews } }
    - expect: { dom: { blockId: submit, notHasClass: ant-btn-loading } }

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
| `fixtures` | No       | Names of shared fixtures (`fixtures/<name>.yaml`) to seed before the page opens, in order. See [Fixtures](/fixtures).                                                           |
| `steps`    | Yes      | At least one step. Each step is an object with exactly one key from the step grammar below.                                                                                     |

## Steps

Blocks are addressed by their `blockId`. A step resolves the block to the element the block itself
renders — every block carries `id="<blockId>"` and `data-testid="<blockId>"` on its own root — and
falls back to the `#bl-<blockId>` layout wrapper for the few blocks that render no root of their own
(`Icon`, `Throw`, `GoogleMapsScript`) or that render it into a portal. So `expect: { dom: ... }`
reads the classes, attributes and descendants of the block, including the `class:` and `style:` you
set on it in your config. Every step has a 5 second timeout by default; a step that does not
complete in time fails the journey.

| Step                                              | Meaning                                                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `click: blockId`                                  | Click the block.                                                                                                                                                 |
| `fill: { blockId, value }`                        | Type `value` into the `input` or `textarea` inside the block. A block that has neither — a rich text editor, a slider, a rating — falls back to `set` semantics. |
| `set: { blockId, value }`                         | Write `value` straight through the engine's `setValue` for the block. Only for input blocks; a block that holds no value is an error naming its type.            |
| `select: { blockId, value }`                      | Open the selector block and choose the option whose text is `value`. Options are looked up inside the dropdown the click opened.                                 |
| `press: Enter`                                    | Press a key or chord on the page. `Mod` in a chord (`Mod+k`) resolves to Cmd on macOS and Ctrl elsewhere.                                                        |
| `press: { blockId, key }`                         | Press the key on that block instead of the page, for a key handler bound to one input.                                                                           |
| `wait: { ms }`                                    | Pause for `ms` milliseconds.                                                                                                                                     |
| `wait: { request: requestId }`                    | Wait until the request has finished loading.                                                                                                                     |
| `wait: { state: path }`                           | Wait until the state value at `path` is defined.                                                                                                                 |
| `screenshot: name`                                | Capture a screenshot. Screenshots are returned to agents using the MCP tool; the CLI runner ignores them.                                                        |
| `expect: { state: { path, equals } }`             | The page state at `path` deep-equals `equals`.                                                                                                                   |
| `expect: { state: { path } }`                     | An expectation with no value yet: `lowdefy test --update` fills `equals` from the state it observes. Without `--update` the journey fails.                       |
| `expect: { visible: blockId } `                   | The block is visible.                                                                                                                                            |
| `expect: { text: { blockId, contains } }`         | The block's rendered text contains the string.                                                                                                                   |
| `expect: { text: { blockId, equals } }`           | The block's rendered text, trimmed, is exactly the string.                                                                                                       |
| `expect: { text: { blockId, notContains } }`      | The block's rendered text does not contain the string — what proves a row was removed.                                                                           |
| `expect: { url: { contains } }`                   | The browser URL contains the string.                                                                                                                             |
| `expect: { dom: { blockId, hasClass } }`          | The block's element carries the class.                                                                                                                           |
| `expect: { dom: { blockId, notHasClass } }`       | The block's element does not carry the class.                                                                                                                    |
| `expect: { dom: { blockId, matches } }`           | At least one descendant of the block matches the CSS selector.                                                                                                   |
| `expect: { dom: { blockId, attribute, equals } }` | The block's attribute equals the string.                                                                                                                         |
| `expect: { durationMsUnder: ms }`                 | The step before this one took less than `ms`. It cannot be the first step.                                                                                       |

Each step is an object with exactly **one** key, and each `expect` and `wait` names exactly **one**
form. `expect: { dom: ... }` takes exactly one of `hasClass`, `notHasClass`, `matches`, or
`attribute` together with `equals`.

Journeys run under a fixed locale (`en-US`), timezone (`UTC`) and colour scheme, so an assertion on
a formatted date reads the same on your machine and in CI.

After a step that navigates, the runner waits for the new page to be committed before it waits for
the page's events and requests to settle, so the next step asserts against the page that was opened.

The step grammar is one implementation shared by `lowdefy test` and the dev server's
[journey tool](/ai-agent-docs), so a journey an agent verifies interactively can be committed as-is,
and a file with a typo — an unknown top-level key, a step with two keys, a `fill:` with no `blockId`
— is reported with its file path and step index before a browser is opened.

## Data for a journey

A journey that reads a list needs rows before it opens the page. `fixtures:` names the
[fixtures](/fixtures) to seed first, exactly as a request test does:

```yaml
- name: member closes a control
  pageId: controls
  fixtures: [base, org-a]
  user: admin
  steps:
    - click: close_c1
    - expect: { text: { blockId: status_c1, equals: closed } }
```

Every connection those fixtures name is pointed at an **in-memory MongoDB** the runner starts for
the run, so a journey never touches the database your `.env` names. Before every journey and every
request test of that run, all seeded collections are dropped and the fixtures re-inserted, so one
test's writes never reach the next. This needs a server the command started: a journey with
`fixtures` cannot run against `--url`, and it is never run against a development server you already
have up, because the runner cannot redirect that server's connections.

The `lowdefy_run_journey` MCP tool takes the same `fixtures` list. There it seeds your **dev**
database through the connection layer, so it sits behind `cli.agentTools.allowWriteRequests: true`
like every other write an agent makes.

## Recording expectations with `--update`

An `expect: { state: { path } }` written with no `equals` is an expectation waiting for a value:

```yaml
steps:
  - click: submit
  - expect: { state: { path: controls.0.title } }
```

`lowdefy test --update` runs the journey up to that step, reads the state the app is actually in,
writes the value into the file and marks it:

```yaml
- expect: { state: { path: controls.0.title, equals: Access reviews, from: recorded } }
```

Only the two keys are written; the rest of the file — its comments, its key order, its other
journeys — is left exactly as you wrote it. `from: recorded` says the value came from a run rather
than from a person: it asserts **what the app does today**, which catches unintended change but can
also freeze a bug in as the expectation. Read a recorded value once, in the diff, before you commit
it.

Without `--update` an unfilled expectation is never reported as passed: the journey **fails** with
`Incomplete expectation at step 1: "expect.state" for path "controls.0.title" has no "equals". Run
lowdefy test --update to fill it from the observed state.` and `lowdefy test` exits `1`. The dev
server's journey tool refuses one with the same message.

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
| `expect`     | Yes      | What the response must look like: a literal subset, `{ schema }`, `{ contains }` or `{ reject }`. See below.                                                                                                                |

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

Seeded tests need a server the command started; `--url` fails with `Seeded tests need a server this command started; --url targets a server whose connections it cannot redirect.`

### Expectations

`expect` has four forms.

A **literal subset**: every key in `expect` must be present in the response with a deep-equal value; keys the response has that `expect` does not name are ignored. Arrays are compared element by element with the same rule and must have the same length, so `expect: [{ title: Access reviews }]` asserts exactly one row whose `title` is `Access reviews`, whatever else the row contains.

A **JSON schema**: `expect: { schema: { ... } }` validates the response against the schema instead. Use it when values are not predictable — ids, timestamps, counts.

A **membership assertion**: `expect: { contains: [{ title: Access reviews }] }` asserts that every element listed appears somewhere in the response array, in any order, and lets the response hold more. Use it for "the list includes the open controls"; a bare array stays exact, including its length.

A **rejection**: `expect: { reject: { messageContains, name } }` asserts that the request refuses instead of returning data — a routine's `:reject`, a payload-schema refusal, a tenant-wall or write-gate refusal. At least one of `messageContains` (a substring of the error message) or `name` (the error class name, or `Refused` for a gate refusal) must be given, and both must hold when both are given. A request that succeeds fails the test with `Expected request <id> to reject, it returned ...`.

```yaml
- name: a member may not close another org's control
  pageId: controls
  requestId: close_control
  user: member
  payload: { _id: c1 }
  expect:
    reject: { messageContains: not authorized to close this ticket }
```

> **Reserved keys.** `schema`, `contains` and `reject` are markers, not data: an `expect` that is an object with only one of those keys is read as an assertion form. A response whose only asserted top-level key is literally `schema` cannot be matched as a literal subset — write `expect: { '~schema': { ... } }` to assert a JSON schema and leave a plain `{ schema: ... }` matchable, or name a second key alongside it.

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

- `--coverage`: Report journey coverage after the run and write the page-to-journeys index. See [Journey coverage](#journey-coverage).
- `--filter <name>`: Only run journeys and request tests whose `name` contains the string (case-insensitive). `lowdefy test --filter control` runs every test with "control" in its name.
- `--url <url>`: Run against a development server that is already running instead of starting one, for example `lowdefy test --url http://localhost:3000` while `lowdefy dev` is open in another terminal. This is the fastest way to iterate on a journey.
- `--port <port>`: The port to start the development server on. If it is in use the next free port is taken. The default is `3000`.
- `--config-directory`, `--dev-directory`, `--ref-resolver`, `--log-level`, `--disable-telemetry`: As for [`lowdefy dev`](/cli#dev).

### Exit codes

| Exit code | Meaning                                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`       | Every test passed, or there are no journeys or request tests (a note is printed).                                                             |
| `1`       | At least one test failed, a test file was invalid, seeding needed a package that is not installed, or an explicit `--filter` matched nothing. |

A journey file that is not valid YAML, is empty, or does not match the journey format (a missing `name`, a typo'd top-level key such as `pageID`, a step with two keys, an unknown step key, or a step malformed below its key such as `fill: title`) is reported as a failed journey with the validation message and the file path. It never aborts the run, so one broken file cannot hide the results of the others.

## Journey coverage

```
pnpx lowdefy@5 test --coverage
```

`--coverage` answers "which parts of this app has nobody written a journey for?".

```
Journey coverage (static, declared config): 14/31 triples, 45.2%
  controls (9 uncovered)
    control_form onSubmit
    delete_control onClick
    request delete_control
  home (5 uncovered)
    ...
Journey index written to /my-app/.lowdefy/test/journeyIndex.json
```

The denominator is **static**: it is every `(pageId, blockId, eventName)` triple the built
config declares, plus one entry per page request. The build writes it to
`.lowdefy/server/build/journeyCoverage.json` on every build. The numerator is the triples
the committed journeys exercise — a `click` covers that block's `onClick`, `fill`, `set`
and `select` cover its `onChange`, a `press` on a block covers `onKeyDown` (and `onEnter`
when the key is `Enter`), and a `wait: { request: ... }` covers that request.

Read the number as coverage of what the app _can_ do, not of what its users _do_: a page
nobody visits and a page everybody visits weigh the same, and a click that navigates to
another page is credited to the page the journey started on. For coverage of what users
_do_, run `lowdefy journeys coverage` against a recorded trace — see
[Recorded journeys](#recorded-journeys) — and read this static number as the offline
fallback.

`--coverage` also writes `.lowdefy/test/journeyIndex.json`, a `page -> journeys` map, so a
pre-commit hook or CI step can run only the journeys that touch the pages a change edited.

## Recorded journeys

A deployed Lowdefy app records what its users do. Every completed block event becomes one
`journey_event` line in the app's log: the page, the block, the event name, whether it
succeeded, the actions and requests it ran, and the state paths it wrote. Export those
lines to a file — one JSON object per line — and the framework turns them into journeys.

```
pnpx lowdefy@5 journeys compile prod-trace.jsonl
```

Sessions that drove the same `(page, block, event)` sequence are one journey done more
than once, so they compile to a single candidate under `tests/journeys/_candidates/`,
named `<pageId>-<hash>.yaml`. `lowdefy test` does not run that directory: a candidate is a
proposal, and promoting it is moving the file into `tests/journeys/`.

```yaml
# tests/journeys/_candidates/orders-5e9f5687.yaml
# Recorded candidate, compiled by `lowdefy journeys compile`.
# `lowdefy test` does not run this directory. To promote it: move the file into
# tests/journeys/, name it something a human would recognise, add the fixtures it
# needs, and run `lowdefy test --update` to fill the expectations left unfilled.
#
# origin:
#   sequence_hash: 5e9f5687
#   sessions: 2
#   failures: 1
#   first_seen: 2026-09-01T11:00:00.000Z
#   last_seen: 2026-09-02T09:00:02.000Z
#   rank:
#     by_failures: 1
#     by_sessions: 1
#   sample_rids:
#     - rid-b
#   failure:
#     block_id: submit
#     error: RequestError
#     event_name: onClick
#     page_id: orders
#     rid: rid-b
#     config_key: pages.orders.blocks.2.events.onClick.0

name: orders recorded 5e9f5687
pageId: orders
steps:
  # onInit on "page" is not a step: no interaction reaches it.
  - set:
      blockId: search
      value: x
  - expect:
      state:
        path: search
        equals: x
  - click: submit
```

### What compiles to what

| Recorded event                                                      | Step                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `onClick`                                                           | `click: <blockId>`                                                                          |
| `onChange` on a block whose type has a `valueType` (an input block) | `set: { blockId, value }`                                                                   |
| `onEnter`, or `onKeyDown` with a key                                | `press: { blockId, key }`                                                                   |
| an action of type `Link` that succeeded                             | `expect: { url: { contains } } }`, and the journey carries on from the page it landed on    |
| any other event name                                                | no step, and a comment above the next step naming the event                                 |
| after each event                                                    | up to five `expect: { state: { path, equals } }` for the paths it wrote, leaf scalars first |
| an event that failed                                                | the journey ends at that step, with the failure in `origin`                                 |

There is no verb that fires an event through the engine without the interaction: a journey
that skips the click can pass while the button that should fire it is hidden, disabled or
gone. An event no interaction reaches is named in a comment for you to decide about.

A failing event ends the journey at its own step, so a candidate compiled from a failure is
a failing test until the bug is fixed — the expectation is simply that the step succeeds.

### Values, and why a promoted candidate needs `--update`

Production traces carry **no values**: state writes record the path and the JSON type, and
event payloads are dropped. So a `set` compiled from production reads
`value: null` with `from: recorded-shape`, and a state expectation is written with a `path`
and no `equals`. Both are proposals. Run `lowdefy test --update` after promoting the file
to fill them from what the app does, and review the values it writes — an auto-filled
expectation asserts "this is what the app does today", which is a regression assertion,
not a specification. Dev traces do carry values, so a candidate compiled from a dev trace
arrives filled.

A journey is also worthless without the rows it ran against. Add
[`fixtures`](#data-for-a-journey) to the promoted file before committing it.

### Compiling from the build

`journeys compile` reads `plugins/blockMetas.json` and the pages the trace names from the
build, because only the build knows which blocks are input blocks. Run `lowdefy build`
first, or have `lowdefy dev` running; without a build, a change on an input block compiles
to a comment rather than a `set`.

### Reruns

A rerun never rewrites a candidate's steps. When it recognises the sequence hash it
rewrites only the `origin` block of the existing file, so a name, a fixture list or an
expectation you filled survives. A sequence it has not seen gets a new file. `sessions` and
`failures` count the trace that was just compiled; `first_seen` and `sample_rids` accumulate
across runs.

### Coverage of what users do

```
pnpx lowdefy@5 journeys coverage prod-trace.jsonl
```

```
412 sessions in prod-trace.jsonl drove 37 (page, block, event) triples.
Journey coverage: 22/37 (59%) across 8 committed journeys.
Uncovered, most-used first:
  orders refresh onClick - 96 sessions
  orders export onClick - 41 sessions
```

That list is the next test to write, in order. Two caveats: the recorder only sees events
the config declares a handler for, and a sampling rate below 1 makes the denominator itself
a sample. Track the trend; do not gate a build on the number.

### From a production error

An agent connected to the dev server's MCP endpoint can go from a request id in an error
report straight to a journey: `lowdefy_prod_repro({ rid })` returns the events that request
recorded, compiled into a journey that ends at the failure.

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
