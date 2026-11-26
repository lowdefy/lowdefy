# Config Tests

Config tests let you test a Lowdefy app in the same language you build it in. A **journey** is a YAML file that names a page, a user to act as, and a list of steps — click this block, fill that input, wait for a request, expect this state — and `lowdefy test` runs every journey in your app and reports which passed.

Journeys need no JavaScript, no Playwright setup and no separate test build. The runner boots your app's development server headless, drives each journey through the dev server's [journey route](/ai-agent-docs) (the same one the `lowdefy_run_journey` MCP tool uses), and prints a pass/fail line per journey. Because the format is declarative, an AI coding agent can write a journey for a page it just changed, run it, and read the failing step.

Each kind of test has one way to write it:

| What you test                                                                                                                 | How                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| A page's logic and state, what it sends and writes                                                                            | A journey that targets blocks by `blockId`, run [headless](#headless-runs). It may end in `expect: { db }`.         |
| Endpoint and server logic: data scope, prices and totals, races, forced failures, cron and internal endpoints, webhooks       | A [page-less journey](#page-less-journeys), run headless.                                                           |
| What the page shows                                                                                                           | A journey in the browser, with `expect.text`.                                                                       |
| A payload's shape, such as an id that is not a string                                                                         | The endpoint's `payloadSchema`, and one journey that checks it is enforced. Case tables test data scope, not shape. |
| How an outside service answers                                                                                                | The journey's own [`stubs`](#stubs-and-forced-failures).                                                            |
| Who can reach which page and endpoint                                                                                         | The [access table](/access-table), `tests/access.yaml`, never a journey per role over every page.                   |
| Library, plugin and Lambda code                                                                                               | Unit tests.                                                                                                         |
| What a journey cannot say: a value computed in code, an answer computed from the request, thousands of rows generated in code | A [test-utils test](/endpoint-tests), whose file says why a journey can't express it.                               |

`lowdefy test` runs the journeys that need no browser on the development server, headless, `lowdefy test --thorough` runs the rest in a browser too, and `lowdefy test --build` runs the headless ones on a production build. An app with Playwright specs on `@lowdefy/e2e-utils` moves them to journeys: see [Moving from e2e-utils](/e2e-utils-migration).

## Layout

Journeys live in `tests/journeys/` inside your config directory, one `.yaml` file per journey or a top-level list of journeys per file. Group them in sub-folders as the suite grows; `lowdefy test` reads every sub-folder except those whose name starts with `_`, such as `_candidates/`, which hold journeys that are not part of the suite yet:

```
my-app/
├── lowdefy.yaml
├── pages/
└── tests/
    └── journeys/
        ├── controls.yaml
        ├── sign-up.yaml
        ├── review/
        │   ├── approve.yaml
        │   └── reject.yaml
        └── _candidates/
```

Files run in path order. Journeys on a [data set](/journey-data-sets) can run side by side, each on databases of its own, as `lowdefy test --build` runs them by default; a journey with no data set shares your app's database, so it always runs alone. See [Journeys side by side](#journeys-side-by-side).

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

- name: member opens a control from its own page
  pageId: control
  pathParams: { control_id: c-access-reviews }
  user: { roles: [admin] }
  steps:
    - expect: { text: { blockId: title, contains: Access reviews } }
```

A page whose [`path`](/page-paths) has placeholders, such as `controls/{control_id}`, has one instance per set of values. A journey names the instance it opens with `pathParams`, and the runner builds the URL from the page's path. It stops before opening a browser if a placeholder has no value.

| Field         | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | Yes      | A short name, at most 100 characters. `--filter` matches against it, and it is printed in the results.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `description` | No       | What the journey proves, its goal, in at most 60 words. It is for people and agents reading the suite; `lowdefy test` does not print it.                                                                                                                                                                                                                                                                                                                                                                                   |
| `pageId`      | No       | The page to open. Leave it out for a [page-less journey](#page-less-journeys), which only calls the server.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `user`        | No       | The user to act as, as an inline user object such as `{ sub: u1, roles: [admin] }`. Leave it out to run as the default roleless headless user, or as `auth.dev.mockUser` when one is active; a `user` given here wins over the mock user. On a journey with `data`, the name of one of the data set's users, such as `member`, or a list of them, such as `[admin, member]`, to [run the journey once as each](/journey-data-sets#one-journey-several-users).                                                              |
| `data`        | No       | A [data set](/journey-data-sets) name. The journey runs against a fresh in-memory MongoDB database of its own, loaded with the data set, so it may write freely.                                                                                                                                                                                                                                                                                                                                                           |
| `urlQuery`    | No       | An object appended to the page URL as a query string, for pages that read `_url_query`.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pathParams`  | No       | An object of strings, one per placeholder of the page's [`path`](/page-paths), for pages that read `_path_params`. Leave it out for a page whose path has no placeholders.                                                                                                                                                                                                                                                                                                                                                 |
| `stubs`       | No       | Answers for outside services and forced failures of any request, on the journey's data set. Needs `data`. See [Stubs and forced failures](#stubs-and-forced-failures).                                                                                                                                                                                                                                                                                                                                                     |
| `cases`       | No       | A case table: the journey runs once per row. Each row needs a unique `name`. See [Case tables](#case-tables).                                                                                                                                                                                                                                                                                                                                                                                                              |
| `tags`        | No       | A list of tags naming the sections of the suite the journey belongs to, such as `[smoke, review]`. `lowdefy test --tag smoke` runs the journeys tagged `smoke`. Tags are lowercase letters, digits, `-` and `_`.                                                                                                                                                                                                                                                                                                           |
| `serial`      | No       | `true` runs the journey with no other journey in flight. Mark a journey on a data set whose outcome depends on timing or on state outside its data session: a step that waits a fixed time for background work, a file the app writes, or state a plugin keeps in memory. Outside services need no `serial`: under a data set they are stubbed or sunk. It takes effect whenever journeys run side by side, which headless runs do by default. See [Journeys side by side](#journeys-side-by-side). |
| `steps`       | Yes      | At least one step. Each step is an object with exactly one key from the step grammar below.                                                                                                                                                                                                                                                                                                                                                                                                                                |

A journey also takes `timeout`, `deprecated`, `evidence` and `variant`, described below. Any other top-level key, such as a misspelt `seriel`, is refused: that journey fails as an invalid file, naming the key and listing the keys a journey takes, and the run's other journeys still run.

`user: none` injects no user at all, so the journey signs in through the app's own auth — see [Testing sign-up and sign-in](#testing-sign-up-and-sign-in). It is refused on a data set journey while auth is configured, and on any journey while a dev mock user is active, since every request would then act as the mock user.

`timeout` sets how long each step may wait, in milliseconds (a whole number from 1 to 60000, default 5000). Raise it on a slow machine rather than adding `wait: { ms }` steps.

### Timeouts

The journey's `timeout` (the step timeout) bounds every wait a step makes for something to happen, and a step moves on as soon as it has:

| Wait                                                                                               | Bound                                      |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| A control becoming actionable for `click`, `open`, `fill`, `select`, and the popup an `open` shows | The step timeout.                          |
| `expect` (`state`, `visible`, `text`, `url`, `title`) matching                                     | The step timeout.                          |
| `wait: { request }` and `wait: { state }`                                                          | The step timeout.                          |
| `back` loading the previous page                                                                   | The step timeout.                          |
| An email arriving for `email` or `fill.fromEmail`                                                  | The step timeout.                          |
| Opening a page: the journey's page, `goto`, the first `as` for a name                              | The step timeout, but at least 15 seconds. |
| Settling after an interaction (`click`, `fill`, `select`, `press`, `back`)                         | The step timeout, but at most 5 seconds.   |
| `wait: { ms }`                                                                                     | Exactly `ms`; the timeout does not apply.  |

The settle after an interaction lets the page's own events and requests finish before the next step. It never fails a step: a page still busy after 5 seconds (an event that ends in a resend cooldown, for example) moves on, and the next step waits for what it needs itself. So raising `timeout` makes a slow journey pass without making a passing one slower.

## Steps

Blocks are addressed by their `blockId`. A step that does not complete within the step timeout (5 seconds, or the journey's [`timeout`](#timeouts)) fails the journey. An `expect` step waits, up to that timeout, for what it checks to become true, so a value a click leads to can arrive a moment later.

| Step                                      | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `click: target`                           | Click the block, or the control a [target](#targets) narrows to.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `click: { ...target, count: 2 }`          | Click 2 (or 3) times in quick succession, as a person's double click, before the runner waits for the page to settle. `count` defaults to 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `open: target`                            | Open an input's dropdown or picker popup (Selector, MultipleSelector, AutoComplete, DateSelector, Cascader...) and wait for it to show, so a following `screenshot` or `select` sees the options. A block with no popup is clicked; one whose click opens nothing fails the step.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `fill: { blockId, value }`                | Type `value` into the input inside the block (or the grid cell a target names). A block that renders its input in a portal, such as a `Search` modal once opened, is reached through the same `blockId`. A `ColorSelector` takes a 6 or 8 digit hex colour (`#1677ff`): its picker opens, the hex is typed and the picker closes. Its value reads back as lowercase hex without an `ff` alpha, so `#1677FFFF` reads `#1677ff`. A `Selector`, `MultipleSelector`, `TreeSelector` or `TreeMultipleSelector` takes the text into its search box: it fires `onSearch` with `{ value }` and keeps its value, so a `select` after it picks from the options its `onSearch` loaded. With `showSearch: false` its search box is read-only and the fill fails. A block with neither a text input nor a colour picker fails, naming its type. |
| `fill: { blockId, fromEmail }`            | Type text read from an [email](#emails) instead of a fixed value, such as a one-time sign-in code. The actor stays on the page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `select: { blockId, value }`              | Open the selector block (or grid cell) and choose the option whose text is `value`. A radio, button or segmented selector's option is clicked by its label; a checkbox option is ticked, and left ticked if it already is.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `press: Enter`                            | Press a key or chord. `Mod` in a chord (`Mod+k`) resolves to Cmd on macOS and Ctrl elsewhere.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `back: true`                              | Go back one page, like the browser's Back button. Fails when the journey has not navigated from an earlier page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `goto: pageId`                            | Load a page the way a typed URL does; `{ pageId, pathParams, urlQuery }` adds the values of a [page path](/page-paths)'s placeholders and a query string. A protected page may redirect (to sign in), so assert where it landed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `email: { to, subject }`                  | Open the newest [email](#emails) to `to` — with a subject containing `subject`, when given — that arrived during the journey, waiting for it if needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `as: name`                                | Act as [another person](#several-people), each in their own browser. The journey starts as `main`. On a journey with `data`, the name is `main` or one of the data set's users.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `wait: { ms }`                            | Pause for `ms` milliseconds.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `wait: { request: requestId }`            | Wait until the request has been called since the last interaction (`click`, `open`, `fill`, `select`, `press`, `back`, `goto` or `as`; the page open before the first) and has finished loading. A call the page made before that interaction does not count.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `wait: { state: path }`                   | Wait until the state value at `path` is defined.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `screenshot: name`                        | Capture a screenshot. Screenshots are returned to agents using the MCP tool; the CLI runner ignores them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `expect: { state: { path, equals } }`     | The page state at `path` deep-equals `equals`. A path that does not exist reads as `null`, so `equals: null` also passes for a misspelt path.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `expect: { visible: target }`             | The block, or the control a target narrows to, is visible.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `expect: { hidden: target }`              | Nothing the target names is visible: no element matches, or every match is hidden. Passes at once when nothing matches yet, so pair it with a presence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `expect: { calls: { request, count } }`   | This person's browser called the request `count` times since the journey started, counted once the page settles. `pageId` names the request's page. With `payload` or `response`, the last call holds them (a [headless run](#headless-runs) only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `expect: { calls: { endpoint, count } }`  | The same for an endpoint called with `CallAPI`. Counts survive full page loads, so `count: 0` after a reload checks a write was never sent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `expect: { text: { blockId, contains } }` | The block's rendered text (or a grid row's or cell's) contains the string.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `expect: { url: { contains } }`           | The browser URL contains the string. It checks where the browser landed and never names a page: open a page with `pageId` or `goto`, with its `pathParams`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `expect: { title: { equals } }`           | The document title (the browser tab's text) is exactly the string; `{ contains }` checks part of it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `expect: { error: text }`                 | The interaction just before it raised an [app error](#app-errors) whose message contains `text`. Must directly follow a click, open, fill, select, press or back. After a `call`, `request`, `webhook` or `release`, the error of its answer contains `text`, or the message of a [forced failure](#stubs-and-forced-failures).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `call: { endpoint, payload, as }`         | Call an endpoint directly, with `payload` as given, as the journey's user or the data set user `as` names (`none` for signed out, `system` for a [cron or internal endpoint](#system-calls-and-webhooks), `{ system: { organization, caller } }` for one that runs per organization). See [calls, requests and the database](#calls-requests-and-the-database).                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `request: { pageId, requestId, payload }` | Call a page's request directly, with `payload` as given, as for `call`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `webhook: { endpoint, body }`             | Post to a webhook endpoint as the service that sends it does, so its `verify` gate runs. `query` and `headers` are optional. See [system calls and webhooks](#system-calls-and-webhooks).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `hold: { requestId }`                     | Hold the next routine that reaches the request, just before it runs, for a [race](#races). `endpoint` or `pageId` narrows it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `release: requestId`                      | Let the call held at that request go, and read its answer in the `expect` steps after it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `expect: { status: code }`                | The answer to the `call`, `request`, `webhook` or `release` before it has this HTTP status (`200`, `401`, `403`). Only `expect` steps may sit between them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `expect: { db: { collection, match } }`   | The journey's data set database holds what the step expects in `collection`: `count` documents matching `match`, or `equals`, a list each matching document holds, in `_id` order. `connectionId` names the connection when the app writes to several databases.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `expect: { sunk: { requestId, count } }`  | The journey asked an outside service: `count` requests matching `connectionType`, `requestType` and `requestId`, and with `match`, the last one's properties hold it. See [stubs and forced failures](#stubs-and-forced-failures).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `expect: { effect: true }`                | The interaction just before it did something. Must directly follow a click, open, fill, select, press or back.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

`expect.calls` takes `{ request: requestId, pageId, count }`: request ids are scoped to a page, and two pages often share one such as `save`, so `pageId` names the page; it defaults to the page the person is on when the step runs. It compares once, without waiting for the count to change, because "not called" can only be judged after the moment has passed.

Before a step runs, every block, request, endpoint and `goto` page it names is checked against the app's build, and so is an `as` name on a journey with `data`. A misspelt one fails the step and names it, so `expect: { hidden: nosuchblock }` or `expect: { calls: { request: nosuchrequest, count: 0 } }` cannot pass by finding nothing. Blocks and requests are looked for on the page the person is on, and blocks also on the page the journey opened, so a step on a page that sent the person elsewhere still fails as not visible. A block inside a List matches by its `$` id, so `rows.0.name` matches `rows.$.name`, and a block of [dynamic page content](/dynamic-page-content) matches once the page shows it; `expect.state` paths are not checked.

`expect.effect` fails when the interaction before it ran no event, changed nothing on the page, called no request or endpoint and left the URL as it was. It reads what the runner saw during that interaction, so it does not wait. After a click that should do something and does not, it makes the journey fail until the control does something.

### App errors

A journey also fails at the step that causes an app error, even when every expectation after it holds. An app error is:

- an action that fails with an error, such as a `Request` or `CallAPI` whose request throws, or an operator that throws,
- an uncaught exception in the page, or an error the page reports to the dev server,
- a request or endpoint that throws on the server, or answers with a 5xx. An error the routine's own `:catch` handled does not count: the journey is judged by the routine's answer. The server still logs it in the terminal.

Errors raised while the journey's first page opens (its `onInit` and `onMount` requests) fail the journey `on open`, before any step runs. Expected outcomes never fail a journey: a failed `Validate`, a `Throw` action or any other user error, and a 401 or 403 refusal. Only errors the journey's own browsers cause count: an error you raise in your own tab on the same dev server while journeys run does not fail them, and a journey's errors are reported in its result, not in the dev server's build status.

```
FAIL  member saves a ticket
      file: /my-app/tests/journeys/tickets.yaml
      step 2: { click: save }
      server-error  MongoDB: MongoDB rejected the MongoDBInsertOne command.  pages/tickets.yaml:42
      action-error  Request "save_ticket" failed in save.onClick with ServiceError.  pages/tickets.yaml:88
```

When the dev server loses its web server, a request gets no answer and the journey fails with a `dev-server` line instead. That says nothing about the app: check the dev server log for a restart or crash, then run the journey again.

Each error line gives its kind, its message and the config file and line it came from, when known. Fix the app in most cases. When the error is the outcome the app means, such as a unique index violation that a `catch` action shows as "already exists", either make it a user error in config (a `Throw` action is one), or assert it with `expect: { error: text }` straight after the interaction:

```yaml
- click: save
- expect: { error: duplicate key }
- expect: { visible: already_exists }
```

The expectation claims the errors of that interaction whose message contains `text`, with the failed action that reported them, and fails when none matches. Any other error the interaction raised still fails it.

### Recorded values: `from`

`fill`, `select` and `expect.state` take an optional `from`, which marks a value taken from a recording:

- `from: recorded` marks a value observed in a trace. The step runs as usual; the marker tells you the value is whatever that recording happened to use, so review it.
- `from: shape` marks a placeholder, `value: null`, for a value the trace could not hold: a value typed in production, or a password the dev recorder did not keep. The runner refuses a journey that holds one before it opens a browser, naming the step. Fill the value from your test data or the journey's user, then remove `from`.

A `fill` or `select` with `value: null` and no `from: shape` is a grammar error.

The full grammar, including the failure shape the route returns, is documented with the [journey tool](/ai-agent-docs). The CLI and the MCP tool share one implementation, so a journey an agent verifies interactively can be committed as-is.

### Targets

A `blockId` reaches a block's own control — its button, input or link. Some controls are not blocks: the Edit and Delete buttons a grid renders in every row, the OK and Cancel of a confirm dialog, the items of a dropdown menu, the cards and buttons a `ClickableHtml` block draws in its html. Wherever a step takes a `blockId`, it also takes a target object that narrows the search:

| Key          | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blockId`    | The block to search inside.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `row`        | A grid row, zero-based as displayed (`AgGrid*`, `Table` and `TableInput` blocks). Needs `blockId`. Browser only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `rowKey`     | The grid row whose key is this, compared as text: the field the AgGrid `rowId` property names, else `id`, else `_id`; the `Table` `rowKey` property, else `_id`, else `id`. Clicks the row's first cell. Stays put when the grid sorts, and runs headless too. With `control` on a `ClickableHtml`, the element's `data-id`. Needs `blockId`; not with `row`. A row whose data gives no key gets a generated one (`__row_<n>`) that changes between renders, so a `rowKey` that matches only a generated key fails: give rows an `id` or set `rowId`.                                                                                |
| `column`     | A grid cell in that row, by the column's `field`, `colId` or `key`. Needs `blockId`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `control`    | A control the block draws, by its key: `ok` or `cancel` on a `Modal` or `ConfirmModal`; a `DropdownButton` item's `eventName`; a `DropdownMenu` link's `id`; a `Menu` link's `pageId`, else `id`; with `rowKey`, the `eventName` of a grid cell's button, menu item or switch (`column` narrows it to one cell); a `ClickableHtml` element's `data-event`, and `ok` or `cancel` on the confirm its event asks. Found wherever the block draws it, popups included, and a closed dropdown, or the `ClickableHtml` popover that holds it, is opened first. Runs headless too. Needs `blockId`; not with `text`, `containing` or `nth`. |
| `text`       | The interactive control whose visible text is exactly this (a button label, a tab, a menu item). On a `click`, `visible` or `hidden` it runs [headless](#headless-runs) when the control is in a `ClickableHtml`; otherwise browser only.                                                                                                                                                                                                                                                                                                                                                                                            |
| `containing` | The innermost element whose visible text contains this, as the page shows it, even across elements (`Assigned to <b>Jane</b>`, a label and value side by side): a row of a list a person picks by the name or email it shows. On a `click`, `visible` or `hidden` it runs [headless](#headless-runs) when the element is in a `ClickableHtml`; otherwise browser only.                                                                                                                                                                                                                                                               |
| `nth`        | When several elements match, the zero-based one to use. Beside `text` or `containing` it runs where they do; on its own, browser only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

`click` takes `rowKey` and `control`, alone or together: `{ blockId, rowKey }`, `{ blockId, rowKey, column }`, `{ blockId, rowKey, control }` and `{ blockId, control }`. `expect.visible` and `expect.hidden` take the same targets (headless, a `control` there is read on a `ClickableHtml` only; on another block the run leaves that step to the browser), and `expect.text` takes `rowKey`, with or without `column`, so "the row is gone" is a check that runs headless. `fill`, `select` and `open` take neither, and `expect.text` takes no `control`: reach an input in a grid row with `row` and `column`, and read a control's text with its `text`.

`row`, `text`, `containing` and `nth` read the page as it is drawn, so they keep a journey in the browser. The exception is a `click`, `visible` or `hidden` by `text` or `containing` that lands in a `ClickableHtml`, which a [headless](#headless-runs) run reads from the block's html. To run a journey headless wherever its controls are drawn, name the row with `rowKey` and the control with `control` on its block. A control target also holds when the text changes.

```yaml
- click: { blockId: invoices, rowKey: inv-0042, column: actions, control: void } # the row's Void button
- click: { blockId: void_modal, control: ok } # the modal's OK
- expect: { hidden: { blockId: invoices, rowKey: inv-0042 } }
- click: { blockId: invoice_actions, control: export } # opens the dropdown, then clicks its item
```

A `ClickableHtml` block's elements are controls too: each `data-event` element whose event the block's `dataEvents` lists is named by that event, and by its `data-id` when it has one. Give every element that stands for a row a `data-id`, as a grid row has a key:

```yaml
- click: { blockId: issue_cards, control: onOpenIssue, rowKey: issue-17 } # <div data-event="onOpenIssue" data-id="issue-17">
- click: { blockId: pairs_list, control: onMerge, rowKey: pair-1 } # dataEvents asks first
- click: { blockId: pairs_list, control: ok } # the confirm's OK fires onMerge
- expect: { hidden: { blockId: pairs_list, control: onMerge, rowKey: pair-1 } } # the pair is gone
- click: { blockId: issue_cards, control: onRefresh } # one element, no data-id
```

A target that matches no element fails and lists the elements the block has; one that matches several fails with the count, so name it with its `data-id`. An element in `data-popover` content is clicked once its popover opens. Headless, the runner reads the block's rendered `html` and fires the event with the element's other `data-*` attributes as the event object, as the browser does.

`text` on its own, with no `blockId`, searches the whole page — front-most layer first: an open dropdown menu, then an open dialog, then the page. That is how a confirm dialog's button is clicked while the grid behind its mask has a button with the same label.

A `click`, `open`, `fill` or `select` whose `text` or `containing` matches more than one visible element fails rather than guess which one you meant. The failure says how many it matched and where, for example `Matched 3 controls with text "Delete" in the page; add nth: 0..2, or a blockId/row to narrow it.` Add `nth`, or narrow the target with `blockId`, `row` or `column`, so it names one element. Expectations are not strict: `expect.visible` passes when any match is visible, and `expect.hidden` when none is.

```yaml
- name: member deletes a control from the grid
  pageId: controls
  user: { roles: [admin] }
  steps:
    - click: { blockId: controls_grid, row: 1, text: Delete } # the row's Delete cell button
    - expect: { visible: { text: Are you sure? } }
    - click: { text: Delete } # the confirm dialog's OK, not the grid's
    - wait: { request: delete_control }
    - expect: { text: { blockId: controls_grid, row: 1, column: title, contains: Key rotation } }
    - click: { blockId: controls_grid, row: 0, column: actions } # the cell's first control
    - click: { blockId: controls_grid, row: 0, column: more, nth: 0 } # an icon-only menu trigger
    - click: { text: Archive } # the open menu's item
```

Some rows are neither a block nor a control, such as the cards of a `ListSelector`. `containing` clicks the text a person would click on, and the click reaches the row's own handler:

```yaml
- click: { blockId: members_list, containing: ada@example.test } # opens Ada's row
```

`fill`, `select` and `expect.text` always need a `blockId`; a value is typed into a block's input, never into a page-wide control. A target with a key the grammar does not know (`colum`) is rejected before the browser opens, so a typo cannot pass as a step that happened to find nothing.

A `Search` block keeps its input in a modal outside its own element. Open it with `click: <blockId>`, then `fill: { blockId, value }` types the query, and `click: { text: <result title> }` picks a result and fires `onSelect`. The result title is the text of the row when the search has no `description` mapped; with a description, pick it with `containing`.

## Page-less journeys

A journey with no `pageId` opens no page: it tests endpoint and server logic by calling the server directly. Its steps may only be `call`, `request`, `webhook`, `hold`, `release`, `as`, `wait: { ms }` and the checks that need no page: `expect` on `error`, `status`, `db`, `sunk` and `calls` (for a request, with its `pageId`). Run it headless: `lowdefy test --build` in CI, or `lowdefy test` and the `lowdefy_run_journey` tool with `headless: true` while you edit.

Nothing in a journey is evaluated with operators while it runs. Payloads, headers, `match` and expected values are sent and compared as written, so a payload can carry an operator object a page never would. A value a check would compute, such as a price or a total, is written into the journey, or into a row of its [case table](#case-tables).

### Calls, requests and the database

A `call` or `request` step calls the server as a page would never call it: another organization's ids, an operator object, a caller without the role. A refusal or an error is the step's answer, not a failure: `expect: { status }` and `expect: { error }` read it. `as` picks the caller for that call only and does not switch who the journey acts as. A request a page sends is reached through its own event instead, so the payload is the one the page's config builds.

```yaml
name: a member is refused the auditor endpoint
data: roles
user: member
steps:
  - call: { endpoint: auditor_only }
  - expect: { status: 403 }
  - expect: { error: API Endpoint "auditor_only" does not exist. }
```

`expect: { db }` proves what a write stored, or that a refused one stored nothing. With `expect: { calls }`, a [headless run](#headless-runs) also checks the payload the page sent and the response it got, as partial matches on the last call. `expect: { calls }` counts the calls of the person acting when it runs; a call made `as` another user counts on that user. In a headless run, a `CallApi` with `detached: true` counts as a call to its endpoint, with the payload its step built, on the person whose call made it (on the person acting for a `webhook` step). A browser run does not see it.

```yaml
name: a member saves an item with the name they typed
pageId: home
data: harden
user: member
steps:
  - fill: { blockId: name_input, value: Docs item }
  - click: save_button
  - wait: { request: save_item }
  - expect: { calls: { request: save_item, count: 1, payload: { name: Docs item } } }
  - expect: { db: { collection: items, match: { name: Docs item }, count: 1 } }
```

`expect: { db }` reads documents as a MongoDB request answers with them: an ObjectId as its hex string, a date as its ISO string, and a [decimal](/_decimal) as `{ '~dec': '0.30' }`, with the string as MongoDB prints it. `match` takes the markers a [fixture](/journey-data-sets) does, `{ _oid: '<hex>' }`, `{ '~d': '<ISO date>' }` and `{ '~dec': '<decimal>' }`, so it can find a document by an ObjectId, a date or an exact decimal. MongoDB compares decimals by value, so `match: { total: { '~dec': '0.3' } }` finds a stored `0.30`:

```yaml
- expect:
    db:
      collection: invoices
      match: { total: { '~dec': '0.3' } }
      equals: [{ total: { '~dec': '0.30' } }]
```

### Case tables

Many cases of one check are one journey with a `cases` table. The journey runs once per row, named `<journey> [<row name>]`, each run on a fresh session of its data set. `{ _case: <key> }` anywhere in the journey, `user`, `data` and `pageId` included, reads that key of the row. Each row needs a `name`, unique in the table:

```yaml
# tests/journeys/cases.yaml
- name: logs an activity from each source
  data: cases
  user: member
  cases:
    _ref: tests/shared/activity-sources.yaml
  steps:
    _ref: tests/shared/log-activity-steps.yaml
```

Here the rows and the steps live in [shared files](#shared-files); either can sit in the journey instead. The rows:

```yaml
# tests/shared/activity-sources.yaml
- { name: form, source: form }
- { name: import, source: import }
- { name: api, source: api }
```

The steps each row runs, with `source` read from the row:

```yaml
# tests/shared/log-activity-steps.yaml
- call: { endpoint: log_activity, payload: { source: { _case: source } } }
- expect: { status: 200 }
- expect:
    db:
      collection: items
      match: { kind: activity, source: { _case: source } }
      count: 1
- expect:
    db:
      collection: items
      match: { kind: activity }
      count: 2
```

This runs `logs an activity from each source [form]`, `[import]` and `[api]`; `--filter "[api]"` picks one. A row runs as one user: a journey with `cases` and a `user` list is refused, so write a row per user, with `user: { _case: user }`. An empty table, two rows with one name and a `_case` naming a key its row lacks are refused, and so is a `_case` in a journey with no `cases` table, or inside a row's value, since it would be sent as written.

### Shared files

`_ref` anywhere in a journey file reads another file into it when tests are found: a case table, a list of steps, one step or a stub. Its path is from the config root, as everywhere in a Lowdefy app, and it takes the plain forms only: `_ref: <path>` or `_ref: { path }`, to a `.yaml`, `.yml` or `.json` file. `vars`, resolvers, transformers and `.njk` templates are refused, as is a `_ref` with other keys beside it. A referred file may refer on; a loop fails the file.

Keep shared files under `tests/shared/`: every file under `tests/journeys/` is read as a journey. A changed shared file changes the hash of every journey that refers to it, so their [exercised](#hardening-journeys) entries go stale. [Data sets](/journey-data-sets) do not take `_ref`.

The `lowdefy_run_journey` tool runs one inline journey, with no file to refer from, so it takes neither `cases` nor `_ref`: a journey sent with `cases` is refused. A `_case` or `_ref` where a file's would stand for part of the journey (a step, a step list, a stub or the stub list, `user`, `data`, `pageId`, or `pathParams` and `urlQuery` or one of their values) is refused, naming where it is. Inside a value, such as a payload, a stub's answer or a `match`, it is sent as written. Run a journey file that has them with `lowdefy test` or the `lowdefy_run_tests` tool.

### Stubs and forced failures

Under a data set, a request to an outside service (an HTTP API, email, payments) is recorded and answers `null`, and nothing is sent. A journey's `stubs` give the answers a routine needs, and force a failure of any request, to show the routine handles it:

```yaml
name: a run is priced at the rate service's rate, after a failed write stores nothing
data: stubs
user: finance
stubs:
  - connectionType: AxiosHttp
    requestType: AxiosHttp
    endpoint: price_run
    answer: { status: 200, data: { rate: 1.5 } }
  - requestId: save_price
    endpoint: price_run
    fail: Price write failed on purpose
steps:
  - call: { endpoint: price_run, payload: { id: BR-1, currency: EUR } }
  - expect: { error: Price write failed on purpose }
  - expect: { db: { collection: items, match: { kind: price }, count: 0 } }
  - call: { endpoint: price_run, payload: { id: BR-1, currency: EUR } }
  - expect: { status: 200 }
  - expect: { db: { collection: items, match: { kind: price, run: BR-1, rate: 1.5 }, count: 1 } }
  - expect: { sunk: { requestId: fetch_rate, count: 2, match: { params: { currency: EUR } } } }
```

| Stub      | Fields                                                                                          | What it does                                                                                                                                                                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An answer | `connectionType`, `requestType`, `answer`; `requestId`, `endpoint`, `pageId`, `match` narrow it | The request answers `answer` in place of `null`. The first stub that matches answers, so one service can answer different requests differently. `match` is a partial match on the request's properties. The request is still recorded for `expect: { sunk }`. |
| A failure | `requestId`, `fail`; `endpoint`, `pageId` narrow it; `times`                                    | The request throws with the `fail` message before it runs, on any connection, MongoDB included, as an outage would, so the routine's own error handling runs. Every other request runs for real.                                                              |

- **How often.** A failure fires on the next matching request, once, so a journey can fail a write and then retry it to show the routine recovers. `times: 3` fails the next 3, and `times: all` every one, for a routine that runs the request in a loop.
- **A failure that never fired fails the journey**, naming it, so a check cannot pass while testing nothing.
- **An answer stub that never answered fails the journey** too, naming its types and what narrows it: no request matched it, or an earlier stub answered first. Only a stub that names its request (`requestId`, `endpoint`, `pageId` or `match`) must answer; one keyed only by `connectionType` and `requestType` is a fallback, such as a shared stub list or a case whose branch makes no outside call, and may go unused.
- **A forced failure is never an [app error](#app-errors).** A client only ever sees the generic message, so `expect: { error }` after the `call`, `request` or `webhook` reads the forced message from the server's record of the call. A webhook that fails answers its sender `500` with a fixed body, and `expect: { error }` still reads the forced message.
- **An answer for a type the app does not have is refused.** An answer stub whose `connectionType` or `requestType` the app has no connection or request of would never answer, so the journey fails, naming the stub and the types the app has.
- **`stubs` need `data`.** They live on the journey's data set session, and work the same headless, on the dev server and in the browser. So do `hold`, `release` and `expect: { sunk }`: a journey without `data` that uses them is refused, on every host. An answer computed from the request is a [test-utils test](/endpoint-tests)'s stub.

`expect: { sunk: { connectionType, requestType, requestId, count, match } }` checks what outside services were asked, stubbed requests included. `count` counts the matching requests; `match` is a partial match on the last one's properties.

### Races

`hold` stops the next routine that reaches a request, just before it runs, so a second call can run in between:

```yaml
name: two approvals race and only one claims the run
data: races
user: finance
steps:
  - hold: { requestId: claim_run }
  - call: { endpoint: approve_run, payload: { id: BR-1 } }
  - call: { endpoint: approve_run, payload: { id: BR-1 }, as: other_finance }
  - expect: { status: 200 }
  - release: claim_run
  - expect: { status: 200 }
  - expect: { error: Run already approved. }
  - expect:
      db:
        collection: items
        match: { _id: BR-1, approved_by: u_other_finance }
        count: 1
```

- A `call` or `request` that reaches the held request is parked, and its step passes; the steps after it run. `expect` steps right after a parked call read nothing from it.
- `release` lets the parked call go, waits for it to answer, and makes its answer the one the next `expect` steps read.
- A `hold` no call reached, or a call still parked when the journey ends, fails the journey.
- `hold` takes `requestId`, a request step's id in an endpoint routine or a page request's id, and `endpoint` or `pageId` when two routines share the id. `release` names the call to let go the same way: `release: <requestId>` lets the first call parked at that id go, and `release: { requestId, endpoint, pageId }` the one parked in that routine, so two holds on one id release in either order. Only `call` and `request` steps are parked: a click whose request reaches a held request fails the step. A page's double submit is the [`doubleSubmit` variant](#variants-lowdefy-journeys-variants)'s to test.
- Check the outcome in the database, as above. An `Api` endpoint's `:reject` answers `200` with the reject message as its error.

### System calls and webhooks

`call` with `as: system` runs an endpoint as a scheduled run does: no user, the endpoint's `auth` is not checked, and an `InternalApi` endpoint can be called. A data set user cannot be named `system`.

```yaml
name: only a system call closes the runs
data: outside
user: operator
steps:
  - call: { endpoint: close_runs, as: none }
  - expect: { status: 401 }
  - expect:
      db:
        collection: items
        match: { kind: run, closed: true }
        count: 0
  - call: { endpoint: close_runs, as: system }
  - expect: { status: 200 }
  - expect:
      db:
        collection: items
        match: { kind: run, closed: true }
        count: 2
```

A scheduled run reaches an endpoint that runs per organization through a `CallApi` with `organization`, and often `caller`, which binds the target to that organization. `as: { system: { organization, caller } }` gives a call the same binding: the tenant wall filters and stamps with `organization`, and `_user` is the stand-in caller `{ id, name, organization_id, system: true }`, exactly what that `CallApi` gives its target. `caller` is optional, as on `CallApi`; without it `_user` is null. When a call `as: system` with no organization is refused or its routine fails, the failing step says how to name one.

```yaml
name: a call bound to an organization runs as its stand-in caller
data: outside
user: operator
steps:
  - call:
      endpoint: record_caller
      payload: { id: nightly }
      as:
        system:
          organization: org_a
          caller: { id: nightly_close, name: Nightly close }
  - expect: { status: 200 }
  - expect:
      db:
        collection: items
        match: { _id: nightly }
        equals:
          - _id: nightly
            kind: caller
            caller: { id: nightly_close, name: Nightly close, organization_id: org_a, system: true }
```

An inline user object can not carry `system`: only the binding gives `_user.system`.

`webhook` posts to an endpoint with a `webhook` gate, as the service that sends it does, so its `verify` step runs against the raw body. `body` is sent as raw text: a string as written, anything else as JSON. A signature header is a literal: compute it once with the secret the app's verifier reads. A headless run, on a build or on the dev server, reads `test-secret-<NAME>` for every secret ([Secrets](/endpoint-tests#secrets)), so sign with that. A browser run posts through the dev server's own route, which reads the app's secret: give the secret that value there too, so one signature holds on both.

```yaml
name: a signed webhook writes its event and a wrong signature is refused
data: outside
user: operator
steps:
  - webhook:
      endpoint: payment_events
      body: { id: evt_1, type: payment.succeeded }
      headers:
        x-fixture-signature: 3ecf0c67fc28daabe7cfb765671cd717ec91ab45414e200920d67266cc200039
  - expect: { status: 200 }
  - webhook:
      endpoint: payment_events
      body: { id: evt_3, type: payment.succeeded }
      headers:
        x-fixture-signature: 3ecf0c67fc28daabe7cfb765671cd717ec91ab45414e200920d67266cc200039
  - expect: { status: 401 }
  - expect: { error: Webhook verification failed. }
  - expect:
      db:
        collection: items
        match: { kind: payment_event }
        equals:
          - { _id: evt_1, type: payment.succeeded }
```

A verifier that refuses an old timestamp needs a clock a journey cannot set: test it with [test-utils](/endpoint-tests).

`hold`, `release` and `as: system` run headless only: a browser run posts its calls over HTTP, so it can neither keep a call parked nor run an endpoint as the system. A browser run refuses them before it opens a page, naming the step.

## Testing sign-up and sign-in

A journey with `user: none` injects no user: it starts signed out, and the app's own auth decides who it is, exactly as in a real browser. Sign-up, email verification, sign-in, sign-out and organization switching all run for real, and the session cookie a sign-in sets carries through every later step.

```yaml
# tests/journeys/sign-up.yaml
- name: a new user signs up, verifies by email and signs in
  pageId: signup
  user: none
  timeout: 30000
  steps:
    - fill: { blockId: email, value: ada@example.test }
    - fill: { blockId: password, value: correct-horse-battery }
    - click: signup_button
    - email: { to: ada@example.test, subject: Verify your email address }
    - click: { text: Verify email address }
    - goto: login
    - fill: { blockId: email, value: ada@example.test }
    - fill: { blockId: password, value: correct-horse-battery }
    - click: login_button
    - goto: dashboard
    - expect: { text: { blockId: user_details, contains: ada@example.test } }
```

A journey that opens a protected page signed out lands on the sign-in page, the way a visitor would; assert where it landed with `expect: { url: ... }`.

Give journeys that sign people in a `timeout` of about 30000. They load many pages, reload the app after each sign-in and wait for real emails, so on a busy machine the 5 second default fails them at random steps.

### Emails

The `email` step reads the mail the development server captured. Start the server with `LOWDEFY_DEV_SMTP_PORT` set to a free port (in the shell or the app's `.env`; the mail sink starts with the server, so restart it after adding the variable), and point the app's SMTP connection at `127.0.0.1` on that port through its secrets. The server then receives the app's mail over SMTP and keeps it instead of delivering it: every message the app sends — verification, magic link, invitation, your own `SMTPMailSend` requests — is written to `.lowdefy/mail/` in the app directory, and the directory is emptied each time the server starts. Only the development server does this, and only with the variable set; nothing in a production build captures mail.

```yaml
connections:
  - id: email
    type: SMTP
    properties:
      from: app@example.com
      host:
        _secret: SMTP_HOST # 127.0.0.1 for tests
      port:
        _number.parseInt:
          on:
            _secret: SMTP_PORT # the LOWDEFY_DEV_SMTP_PORT value for tests
```

`email` opens the newest matching message that arrived since the journey started, waiting up to the step timeout for one to arrive. The email is shown in the actor's tab, so `click: { text: Verify email address }` follows its button the way a person does, and `expect: { visible: { text: ... } }` checks its content. Opening the same email again (following an invitation link a second time after signing up) opens the same message. When nothing matches, the step fails with the messages that did arrive.

A one-time code is typed, not clicked. `fill` with `fromEmail: { to, subject, match }` reads the same newest matching message, waiting for it the same way, and types the first match of the regular expression `match` (or its first capture group, when it has one) into the block. The actor stays on the page they are on, as a person reads the code on their phone and types it into the tab they started from. The match runs on the email's text, not its HTML markup. Anchor the pattern with `\b`, since the text can also hold the sign-in link, whose address may contain digits.

```yaml
- click: login_magic_send
- fill:
    blockId: otp
    fromEmail:
      to: ada@example.test
      subject: Your sign-in link
      match: '\b\d{6}\b'
- click: login_code_verify
```

### Several people

`as: invitee` switches the journey to another person with their own browser and cookies: an owner and the person they invite, or a member whose session stays open while the owner removes them. The journey starts as `main`. The first `as` for a name opens the journey's page in a new browser, as the journey's `user`, or as the data set user of that name on a journey with `data` (see [Journey data sets](/journey-data-sets)); switching back returns to that person's tab as they left it.

**Seeing what a second person sees.** On a journey with `data`, every person reads and writes the run's databases, so act as one user and then check, in the same run, what another user sees. The second user is a user of the data set, so no sign-in is needed:

```yaml
name: overriding a decision tells its owner
data: reviews
user: officer
pageId: review
steps:
  - click: override_decision
  - expect: { state: { path: decision.status, equals: overridden } }
  - as: owner # a user of the data set, in a browser of their own
  - goto: notifications/all
  - expect: { text: { blockId: inbox, contains: Kirsty changed your decision } }
```

What `officer` wrote is in the database `owner` reads, and nothing of `officer`'s session (the signed-in user, cached requests, page state) reaches `owner`, who has their own browser. `as: main` returns to `officer`'s tab as it was left. Because everyone in the run shares its databases, a dropped `CallApi` that sends the notification fails the journey, and a [config mutant](#mutants-lowdefy-journeys-harden) that drops it is killed. What the journey exercised is the union over everyone it acted as: the requests, events and blocks `officer` and `owner` each touched are recorded for the journey, so coverage, lint and `journeys harden` need no per-person bookkeeping. An `as` that names the person already acting is a lint warning ([L7](#lint)).

Each person also sends requests from their own client address, so auth rate limits (a few sign-in attempts per address every few seconds) count each person's attempts apart, as they would for people on different devices, instead of one budget for the whole run.

### The database

Journeys that act as injected users and need data of their own belong on a [data set](/journey-data-sets): each run gets a fresh in-memory database, and your own database is never touched. Sign-up and sign-in journeys go through the app's real auth, which a data set does not redirect, so they need a test database of their own:

Journeys perform real sign-ups, so they need a database that starts empty and is never a real one. Run them against a fresh test database each time: a sign-up journey run a second time finds its address already registered, and no verification email is sent. Give each journey its own addresses, so journeys in one run do not collide.

Keep journeys that write, like these, out of `tests/journeys/` when your everyday `lowdefy test` runs against a shared database. Put them in their own directory, such as `tests/auth-journeys/`, and run them only from a script that starts the test database, the mail sink and the server they need:

```
lowdefy test --journeys-directory tests/auth-journeys --url http://localhost:3290
```

A plain `lowdefy test`, and the `lowdefy_run_tests` agent tool, never read that directory.

## Running

```
pnpx lowdefy@7 test
```

With no options, `lowdefy test` prepares `.lowdefy/dev` exactly as `lowdefy dev` does, starts the development server on a free port without opening a browser, runs every journey that needs no browser [headless](#headless-runs), lists the ones that need a browser, prints the results and stops the server. See [Where each journey runs](#where-each-journey-runs).

`lowdefy test` needs only Node.js, pnpm and a Chromium the dev server can launch. The dev server uses Playwright's `chromium-headless-shell`, which it downloads itself the first time a browser tool needs it, and falls back to an installed Google Chrome meanwhile. Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to turn the download off.

To verify the change in hand, run all journeys, a folder or glob of them, or a tagged section:

```
lowdefy test                                   # every journey in tests/journeys/, sub-folders included, "_" folders left out
lowdefy test tests/journeys/review             # a folder, with its sub-folders
lowdefy test 'tests/journeys/**/review-*.yaml' # a glob, quoted so the CLI expands it
lowdefy test --tag smoke --tag review          # the journeys tagged smoke or review
lowdefy test --filter approve                  # the journeys whose name contains "approve"
lowdefy test --tier common                     # the most-used journeys, by production use
```

Paths, tags and filters combine: `lowdefy test tests/journeys/review --tag smoke` runs the smoke journeys in the review folder. Put the selections you use often in `package.json` scripts, such as `"test:smoke": "lowdefy test --tag smoke"`. The `lowdefy_run_tests` agent tool takes the same selections as `paths`, `tags`, `filter` and `tier`.

Once the journeys carry production [evidence](#evidence), `--tier` narrows the selection further to its most-used journeys, cut over that selection as described in [Usage and tiers](#usage-and-tiers): `lowdefy test --tier common` checks the happy paths in a fraction of the time, and `--tier edge` adds the edge cases real users still reach. Run `common` while you work on a change and `edge` before you call it done. `lowdefy test tests/journeys/review --tier common` is the happy paths of the review folder. A journey with a list of users is tiered once and runs as each of its users. Journeys with no counts for their current steps run in every tier, so a new or edited journey is always tested. A tiered run is refused when the selection has fewer than 100 journey matches in the usage window, or no evidence at all.

```
PASS  member creates a control  (5 steps, 412ms)  [headless]
FAIL  guest sees the empty state  [browser]
      file: /my-app/tests/journeys/controls.yaml
      step 0: { expect: { visible: empty_state } }
      expected: block "empty_state" to be visible
      actual:   Timeout 5000ms exceeded.
1 passed, 1 failed of 2 journeys
```

A failing journey stops at its first failing step and prints the step's index, the step itself, and the `expected` and `actual` values. Steps after the failure are not run.

A journey with production [evidence](#evidence) prints its tier, its rank in the run's selection, its rate and its failures over the usage window after its `PASS` line, then its mutants:

```
PASS  member assigns an open ticket  (5 steps, 2100ms)  common #2 · 13.7/day · 14 failed (3m) · 11/12 mutants  [browser]
PASS  member reopens a ticket  (4 steps, 650ms)  unranked  [headless]
```

`unranked` marks a journey with no counts for its current steps yet. A run without `--tier` never builds config to rank journeys, so a journey that clicks a data value (a grid row by its name) also shows `unranked` there; `--tier common`, `wide` or `edge` ranks it. With fewer than 100 journey matches in the usage window there is no ranking, and the line shows the rate and failures with no tier or rank. Persons and organisations are left out, since they do not add up across months; [`lowdefy journeys usage`](/cli#journeys-usage) shows them month by month. The mutants part is left out when there is no mutation report. `FAIL` lines carry no evidence.

A journey with `deprecated: true` is never run, even when named by path or `--filter`. It is listed with its recent rate, and the closing line counts it:

```
SKIP deprecated  member prints a ticket  0.4/day (3m)
```

### Where each journey runs

| Command                   | Where the journeys run                                                                                                                                                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lowdefy test`            | Only the journeys that need no browser, [headless](#headless-runs). A journey whose steps need a browser ([the table below](#headless-runs)), or that the headless run finds needs one partway through, is listed `BROWSER-ONLY` with the step and why: it neither passes nor fails the run. |
| `lowdefy test --thorough` | Each journey once: headless when it can, in the browser when it can't. A journey the headless run finds needs a browser partway through then runs in the browser too, from step 1, in the same run. Use it in CI.                                                                            |
| `lowdefy test --browser`  | Every journey in the browser.                                                                                                                                                                                                                                                                |
| `lowdefy test --headless` | As `lowdefy test`. Kept so scripts that pass it keep working.                                                                                                                                                                                                                                |

After the summary, a run that left journeys browser-only names each one with its file and the step that needs a browser, and prints the command that runs them there:

```
PASS  member creates a control  (5 steps, 412ms)
BROWSER-ONLY  copies the invite link  step 2 (click "copy_link"): CopyToClipboard needs the browser.
1 passed, 0 failed of 1 journeys, 1 browser-only not run
Not run, needs a browser:
  copies the invite link (tests/journeys/invites.yaml)  step 2 (click "copy_link"): CopyToClipboard needs the browser.
Run them in the browser: lowdefy test --thorough tests/journeys/invites.yaml
```

The exit code stays `0`: a browser-only journey is not a failure. A `--thorough` run ends each journey's line with where it ran, `[headless]` or `[browser]`.

`.lowdefy/test/headless-run.json` remembers each journey a headless run found needs a browser, with the journey and the build it was found on. While both are unchanged, the next `lowdefy test` lists the journey as browser-only without running its headless steps again, its line ending `found by an earlier run, not run again`, and `lowdefy test --thorough` sends it straight to the browser. On the development server, editing the journey or any file of the app's config (outside `tests/journeys/`) runs it headless again. With `--build`, so does each new `lowdefy build`. A Lowdefy upgrade that lets the headless runner take the step may leave the record standing: delete `headless-run.json` to run every journey headless again. A run of some journeys keeps the records of the others.

A journey with a `hold`, `release` or `call` as `system` step never goes to the browser, which cannot take those steps. If it also needs a browser, every run leaves it browser-only: the note after the summary says so and leaves its file out of the command. `--browser` refuses it.

A plain `lowdefy test` runs no journey in a browser. Run `lowdefy test --thorough` in CI, so the browser journeys run there.

`--browser`, `--thorough` and `--headless` each pick where the journeys run: pass at most one.

### Options

- `[paths...]`: Journey files, directories or globs to run instead of the whole suite, anywhere under the config directory, including the candidates in `tests/journeys/_candidates/`. A directory is read with all its sub-folders: `lowdefy test tests/journeys/_candidates/variants` runs every variant. A path containing `*`, `?` or `[` (including `**`) is a glob the CLI expands itself, so quote it: `lowdefy test 'tests/journeys/review/*.yaml'`. A glob that matches nothing is refused, like a path that does not exist. `--tag` and `--filter` apply on top.
- `--tag <tag>`: Only run journeys whose `tags` include the tag. Repeat it to run the journeys carrying any of the tags: `lowdefy test --tag smoke --tag review`.
- `--filter <name>`: Only run journeys whose `name` contains the string (case-insensitive). `lowdefy test --filter control` runs every journey with "control" in its name. Repeat it to run the journeys matching any of the strings.
- `--tier <tier>`: Only run the journeys in this popularity tier of the selection: `common` (p50), `wide` (p80), `edge` (p95) or `full` (every journey, the default). See [Usage and tiers](#usage-and-tiers).
- `--usage-window <months>`: The calendar months recent use is ranked over, for `--tier` and the `PASS` line, such as `6m`. The default is `3m`.
- `--repeat <n>`: Run each journey `n` times in a row (1 to 10) and classify it, as described in [Replaying candidates](#replaying-candidates).
- `--concurrency <n>`: Run up to `n` journeys at once, any `n` from 1 for headless journeys. The default is the machine's cores (less one above 4 cores), and no more than one per GiB of memory, on the development server and with `--build` alike. With `--thorough` or `--browser` it also sets the browser journeys at once (1 to 3); their default is 1, or the `LOWDEFY_JOURNEY_CONCURRENCY` environment variable. See [Journeys side by side](#journeys-side-by-side).
- `--lint`: Check the journeys for the [lint rules](#lint) and run nothing.
- `--thorough`: Run each journey headless when it can and in the browser when it can't, and run each journey found to need a browser partway through in the browser too, from step 1, in the same run. Use it in CI. See [Where each journey runs](#where-each-journey-runs).
- `--browser`: Run every journey in the browser.
- `--headless`: Run only the journeys that need no browser, in Node, and list the rest as browser-only: the default. See [headless runs](#headless-runs).
- `--build`: Run headless on the production build in this process. A run that also takes its browser journeys on the production build is not supported yet, so `--thorough` and `--browser` refuse it.
- `--server-directory <path>`: With `--build`, `--access` or `--update-access`, the built server to read, when it is not `.lowdefy/server`.
- `--access`: Only check the [access table](/access-table), `tests/access.yaml`, against the production build, and run no journeys.
- `--update-access`: Rewrite `tests/access.yaml` from the production build, and run nothing else. See [the first file](/access-table#the-first-file).
- `--journeys-directory <path>`: Read journeys from this directory instead of `tests/journeys/`, for journeys that need a server set up for them, such as [auth journeys](#the-database). A relative path is resolved from the current directory. The run fails when the directory holds no journeys.
- `--url <url>`: Run against a development server that is already running instead of starting one, for example `lowdefy test --url http://localhost:3000` while `lowdefy dev` is open in another terminal. This is the fastest way to iterate on a journey.
- `--port <port>`: The port to start the development server on. If it is in use the next free port is taken. The default is `3000`.
- `--config-directory`, `--dev-directory`, `--ref-resolver`, `--log-level`, `--disable-telemetry`: As for [`lowdefy dev`](/cli#dev).

### Journeys side by side

A headless run keeps as many journeys in flight as the machine has cores, and no more than one per GiB of memory. Above 4 cores it leaves one for the run itself. A 2-core CI runner with 7 GB runs 2 at once, a 4-core one 4, and a 10-core machine with 16 GB or more 9. `--concurrency <n>` sets another limit, and `--concurrency 1` runs one at a time.

With `--build`, the run's own process runs one journey and worker threads run the rest; each thread opens the production build once and runs one journey at a time, so the run uses that many cores.

On the development server, the server runs each headless journey in a worker thread of its own, so the run uses that many cores there too; the server builds their pages, and a page edit or config rebuild during a run is seen by the journeys that start after it. The server runs at most as many threads as that default allows, however many runs post to it: a `--concurrency` above it waits for a free thread. A thread with no journey for five minutes stops, so the next run's first journeys start new threads.

Browser journeys go one at a time by default. `lowdefy test --thorough --concurrency 2` keeps two browser journeys in flight; on a small app that about halves the browser part of a run. `LOWDEFY_JOURNEY_CONCURRENCY=2` sets the browser limit too. In a `--thorough` run, `--concurrency` sets both parts. The `lowdefy_run_tests` agent tool takes the same limit as `concurrency`.

- A journey on a [data set](/journey-data-sets) runs beside others, since each run has databases of its own. This changes a `--build` run in CI from one journey at a time to several: a journey whose outcome depends on timing or on state outside its data session (a step that waits a fixed time for background work, a file the app writes, state a plugin keeps in memory) needs `serial: true`. Outside services need no `serial`, since under a data set they are stubbed or sunk. To keep a CI run one at a time, pass `--concurrency 1`.
- A journey with no `data`, which runs against the database your app points at, and a journey marked `serial: true`, run alone with nothing else in flight, after the others.
- Results, `.lowdefy/test/results.json` and the run's other files keep the order the journeys were selected in. The output prints the journeys that ran side by side first, then the ones that ran alone, each in selection order.
- A `PASS` line shows the journey's own time, counted from when it got a browser. The wait for one is kept as `waitedMs` in the results file.
- The run goes one at a time under `--repeat` above 1, since a journey that fails only beside another is the flakiness `--repeat` is asked to find, and while the operating system reports memory pressure.
- No journey sees another's writes or page state: each has its own data set databases, its own session and its own page state, and a journey without a data set runs alone.
- A journey that fails while another journey is in flight is run again alone before it is reported: the run starts no new journey, waits for the ones in flight and runs it once more. If it passes alone, it is reported as a `PASS` with a line under it naming what it first failed on and pointing at `serial: true`, the closing line counts it, as in `48 passed (3 after an alone rerun)`, and the run takes one fewer journey at a time from then on. If it fails alone, it is reported as a `FAIL` with the alone run's failure. `.lowdefy/test/results.json` keeps `contended: true` and the first failure as `contendedFailure`, and the `lowdefy_run_tests` answer counts these journeys as `contended`. A journey that passed only alone counts as not passing in the run's measured coverage.

Every browser operation on the machine shares three browser slots: journeys, screenshots, state inspection and the other agent tools of every development server. At 2 or more, a screenshot or state inspection from another session can wait through several journeys for a free slot, up to its five-minute limit. With two test runs at 2 each on one machine, 7 of 13 screenshots taken during the runs waited over 60 seconds. Raise the limit when the machine is yours alone for the run.

### Exit codes

| Exit code | Meaning                                                                                                                                                                                                                                                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`       | Every journey passed, or `tests/journeys/` has no journeys (a note is printed).                                                                                                                                                                                                                                                                                                             |
| `1`       | At least one journey failed, the [access table](/access-table) differs from the build, a journey file was invalid, a path, glob, `--tag` or `--filter` matched no journey, or a `--journeys-directory` held no journeys. With `--repeat`, a journey was `FLAKY` or `FAIL`; with `--lint`, a lint error was found; with `--tier`, the selection had too little production use to cut a tier. |

A journey file that is not valid YAML, or does not match the journey format (a missing `name`, a step with two keys, an unknown step key, a step the grammar refuses, named by its index) is reported as a failed journey with the validation message and the file path. It never aborts the run, so one broken file cannot hide the results of the others.

## Headless runs

Most of what a journey checks is the app's own logic: an event runs its actions, a request runs, state changes, a block shows or hides, the database changes. None of that needs a browser. `lowdefy test` runs only the journeys that need no browser, in Node, on the development server while you edit, or on a production build with `--build`: their pages run on Lowdefy's client engine, with the page's own event chains, and their requests and endpoint calls run in the same process on the journey's data set and user. No block is rendered and no browser is started, so a journey takes about as long as its requests do.

Nothing in a journey says which kind it is. Its steps decide: a journey runs headless when every step and check is in the left column.

| Headless                                                                                                                                         | Needs the browser                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `click`, `open`, `fill`, `select`, `press: Enter`, `press: Escape`, `wait` (`ms`, `request`, `state`), `goto`, `back`, `as`                      | `screenshot`, `email`, `press` other than `Enter` or `Escape`, a `fill` from an email, a double click |
| Targets by `blockId`, `rowKey` (with or without `column`) and `control`; a `click`, `visible` or `hidden` by `text` or `containing` (with `nth`) | Other targets by `text`, `containing`, `row` or `nth`, and by `column` without `rowKey`               |
| `expect`: `state`, `visible`, `hidden`, `text` (by `blockId`), `calls`, `error`, `url`, `status`, `db`, `sunk`                                   | `expect`: `title`, `effect`, and `text` with `text`, `containing`, `row`, `rowKey`, `column` or `nth` |
| `call`, `request`, `webhook`, `hold`, `release`                                                                                                  |                                                                                                       |

`hold`, `release` and a `call` `as: system` run only headless; a browser run refuses them. A journey's `stubs` work in both.

`lowdefy test` lists every other journey as browser-only, with the first step that needs a browser, and neither passes nor fails it; `--thorough` runs it in the browser:

```
PASS  saves an item headless and sees it in state  (5 steps, 412ms)
BROWSER-ONLY  reads the page title  step 0 (expect: { title }): expect "title" reads the page in a browser
1 passed, 0 failed of 1 journeys, 1 browser-only not run
Not run, needs a browser:
  reads the page title (tests/journeys/title.yaml)  step 0 (expect: { title }): expect "title" reads the page in a browser
Run them in the browser: lowdefy test --thorough tests/journeys/title.yaml
```

A journey can also turn out to need a browser while it runs. An auth action (`Login`, `Logout`, the sign-up and two-factor family), an action that uses a browser API (`CopyToClipboard`, `ScrollTo`, `SetFocus`, `GeolocationCurrentPosition`, `SetDarkMode`, `SetLocale`, `PdfMake`), a click on a block with no `onClick` of its own (a browser lands it on a control inside the block), a `text` or `containing` target that no `ClickableHtml` shows (below), an `open`, a `rowKey` or a `control` target on a block the headless runner does not stand in for (it names the block and its type), or a `CallMethod` on such a block, such as one from the app's own plugin (it names the block, its type and the method; a plugin block can declare methods that run headless, below), a `Publish` to a websocket, or an `expect: { state }` or `wait: { state }` whose path reads a `Table`'s value (the table writes its view and selection there in a browser), stops the journey there and lists it as browser-only. When the page's own `onInit` or `onMount` reaches one, the journey is listed browser-only `on open`. `lowdefy test` remembers it and lists it without running it again while the journey and the build are unchanged, and `--thorough` runs it in the browser in the same run: see [Where each journey runs](#where-each-journey-runs).

A block from your own plugin says in its meta which of its methods run headless, in `headlessMethods`. A method that only fires one of the block's own events names that event, `{ run: 'onRun' }`: a headless `CallMethod` runs the event and waits for its actions. A method that changes only what the block draws, sets no state and calls nothing is declared `null`, `{ merge: null }`: a headless `CallMethod` on it does nothing, resolves with no value, and the journey goes on. Seeing what it drew still needs the browser: once a `CallMethod` has called such a method, an `expect: { text }` that may read that block runs only there, even when the block declares its text in `headlessText` (below). Declare `null` for nothing else: on a method that sets state or calls a request, or does more than fire one of its block's events, a headless run would do less than the browser, so a check could pass in one and fail in the other. Leave such a method out, and its `CallMethod` stays browser-only. A declared method runs headless only once the browser would render the block; while the block is hidden, a `CallMethod` on it is browser-only.

A page's websocket [subscriptions](/websocket-subscriptions) open headless as they do in a browser, and each one succeeds straight away: its `onSubscribe` runs and `_websocket` reads it connected. No message ever arrives, so a journey that only opens a page with a live feed runs headless, and one that waits for a live message fails on that wait, its failure naming the subscriptions the page held open. A headless run does not check `auth.websockets`: a subscription the journey's user may not hold succeeds headless and fails in the browser.

A `fill` on a `Selector`, `MultipleSelector`, `TreeSelector` or `TreeMultipleSelector` types into its search box headless too: the block fires `onSearch` with `{ value }` and keeps its value. The step waits for a debounced `onSearch` and the requests it runs, so a `select` straight after it finds the options the search loaded; on a `Selector` or `MultipleSelector`, an option the search hides fails the `select`, as the browser shows none. A click, `open` or `select` elsewhere, or a `fill` of another input, then closes the dropdown and clears the search, as in a browser: a `Selector` or `TreeSelector` fires `onSearch` with `{ value: '' }` once the next step's events have started (before a `select`'s `onChange` on a dropdown, which first clicks its own block open, and after it on a radio, checkbox, button or segmented selector, whose option is one click), a `TreeMultipleSelector` fires it before them, and a `MultipleSelector` fires nothing. `press: Enter` after such a fill picks the option the dropdown highlights, which only a browser shows, so the journey is listed browser-only there, and so is a `CallMethod` on the block. `onFocus` and `onBlur` fire in a browser and not headless. `onOpenChange` does not fire headless either, so a `fill` or `select` on a selector with `onOpenChange` actions, such as a picker that saves as its options close, is listed browser-only at that step; an `onOpenChange` with no actions is no reason to. A `Selector`, `MultipleSelector` or `DateSelector` with `autoOpen` opens its options as it shows; while the page shows one with `onOpenChange` actions, the next `click`, `open`, `fill`, `select` or `press` is listed browser-only, since in a browser it closes those options or acts in them.

A headless `fill` fires the block's `onChange` with `{ value }`, as a text, number or colour input does in a browser, so an `onChange` that reads `_event: value` runs. The value is the one the step gives: a `TextInput`'s `replaceInput` is not applied headless. A `NumberInput` reads the typed text as a number, as in a browser: `'120000'` sets `120000`. It drops characters other than letters, digits, `.`, `-` and `_` (`'$ 1 234.5'` is `1234.5`) and reads its `decimalSeparator` (when not empty) as the point. Text that is no number, a number outside `min` and `max`, or the number it already holds changes nothing and fires no `onChange`. `press: Enter` after it fires `onPressEnter`. A browser clamps the number into `min` and `max` and rounds it to `precision` on Enter and as the focus leaves the input, firing `onChange`; when that would change the number, the `press`, or the `click`, `open`, `fill` or `select` that moves the focus off, is listed browser-only. A `NumberInput` with a `parser`, a `fill` whose text holds a full-width stop `。`, or one in an app with `i18n` and no `decimalSeparator` given text other than digits and signs, is listed browser-only at the `fill`. On a `NumberInput` with a `formatter`, the `press: Enter`, or the step that moves the focus off it, is listed browser-only. A `fill` on a block that is not an input, such as a `Table` (whose toolbar has a search box) or a container, is listed browser-only: a browser types into the first text input the block draws. A headless `select` picks the option whose label shows `value` as its text. On the selectors that draw their labels as html (`Selector`, `MultipleSelector`, the radio, checkbox, button and segmented selectors and the tree selectors), a label such as `<span class="dot"></span><span>No space</span>` is picked with `value: No space`; other blocks, such as `AutoComplete`, are matched by the label as written. A label whose text `data-avatar`, `data-format` or `data-time` writes in the browser can't be read headless, so a `select` on its block is listed browser-only.

An `expect: { text: { blockId, contains } }` runs headless from the text each block draws from its properties, as a browser's text check reads the block (its `innerText`). Each block type the headless run knows has a text model: the properties it always draws as text, and the areas whose blocks it draws. `Html`, `ClickableHtml` and `DangerousHtml` read their `html` as the browser draws it (a flex or grid `.element` class or style lays its top-level elements out as blocks); `Title` and `Paragraph` their `content`; `Markdown`, `MarkdownWithCode` and `DangerousMarkdown` their `content` as react-markdown draws it; a `Button` its `title` (else its id); a `Tag` its `title`; an `Alert` its `message`, `description` and close text; a `Card`, `Modal` and `Drawer` their `title` (a `Modal` its OK and Cancel too); a `Descriptions` item its label and value (an item whose `style`, `labelStyle`, `contentStyle` or item option style may change how it reads sends the check to the browser); a `Label` its title and `extra`; a `Statistic` its title, prefix, value (grouped and rounded as antd does) and suffix; a `Divider` its `title`. `Box`, `Span`, `List`, `Flex`, `Icon` and `Img` draw no text of their own. A block's text is its own and that of the blocks inside it that are shown (as `visible` reads them, a `Modal` or `Drawer` only while open), in the areas its component draws. A `Modal` or `Drawer` inside the block is drawn in its own portal, so its text is not the block's: check it by its own `blockId`. A closed one whose content antd keeps in the page, hidden (one opened before, or with `forceRender`, unless `destroyOnHidden`), and a `Drawer` placed with `getContainer`, send the check to the browser, which reads that text. So does text under a block whose own `style` or `class`, or a slot's `style`, changes how it reads (a case transform, kept white space, `hidden` or `md:hidden`), or whose `layout` hides it at 1280px (a span of 0), and a check on a block that may itself be hidden that way, which the browser reads as its whole text content. Text only a hover, focus or open shows (tooltips, placeholders, a closed dropdown, an input's value) is not page text, as in a browser.

- The check passes once a stretch of text the browser draws as written holds `contains`, with white space collapsed where the page collapses it.
- While no layout of the block's text could show `contains` (case and white space ignored), the check waits, and fails at the timeout with the browser's message.
- It goes to the browser when the step runs if the block holds a block with no text model (a grid such as `AgGrid` or `Table`, an input, a `DropdownMenu`, a block from the app's own plugin), naming their types; or if the text may show in a way the run cannot read: across elements the page's layout may break, inside an element a class such as `hidden` or `md:hidden` may hide, in text an html enhancer writes (`data-time`, `data-format` and the like), under a case-changing class, behind a measured ellipsis, a loading `Statistic`, or a `Modal`'s OK and Cancel in an app with i18n locales. A headless run does not fail a text check a browser could pass, as far as the html, the blocks' properties and their own `style` and `class` say.

The run reads the html classes it knows (Tailwind's display, `hidden`, `collapse`, `sr-only`, `line-clamp`, white space and case classes, their important forms such as `hidden!`, arbitrary properties such as `[display:none]`, and block-utils' html attributes such as `data-truncate`), with Tailwind's breakpoints (`md:`, `max-lg:`, `min-[900px]:`, `max-[1199px]:`) read at the browser runner's 1280px width, not the app's own stylesheet. When the app sets its own breakpoints in `theme.tailwind`, `sm:` to `2xl:` may or may not apply, so text under them goes to the browser. A `<style>` element in the html sends the check to the browser. CSS of your own that hides, lays out or changes the case of text is not seen headless, and can make the two runs answer differently: a class that hides a word between two others lets a browser read them run together, where a headless check fails.

A block from your own plugin names the properties it draws as text in its meta, in `headlessText`: `headlessText: ['title', 'content']`, a list of property paths, in order. A value with no markup reads as written; one with markup (`<`, `&`) is read as html and as text, since the meta does not say which the block draws, and so never passes a check on its own. A plugin block's text covers only those properties: a check that needs the text of blocks inside it goes to the browser. Without `headlessText`, the block has no text model. Any other value for `headlessText` fails the build.

A `ClickableHtml` target (`{ blockId, control, rowKey }`) runs headless from the block's rendered `html`: the runner fires the event of the one listed element with that `data-event` and `data-id`, with its other `data-*` attributes as the event object, and asks first where the browser would, so the journey answers the confirm with `control: ok` or `cancel`. An element in popover content counts when no shown element matches, as the browser opens its popover; a disabled one refuses the click.

A `click`, `visible` or `hidden` by `text` or `containing` is decided when the step runs. The headless run looks for it in the `ClickableHtml` blocks the page shows: in the block a `blockId` names and the blocks inside it, or, with no `blockId`, on the whole page, including a `ClickableHtml`'s open popover and the OK and Cancel of its open confirm. It reads the html as the browser does. `text` matches an interactive control (a `button`, a link, a popover trigger) whose whole text is the text, so a `<div data-event>` row is picked with `containing`. A target with `row`, `rowKey`, `column` or `control` beside its `text` stays in the browser. `containing` matches the innermost element whose text holds it, ignoring case. Then:

- One match, or the `nth`, gets the click: its `data-event` fires with its other `data-*` attributes as the event object (or its confirm opens), or its popover opens or closes. An element in an open popover fires and closes the popover.
- Several matches and no `nth` fail, as in the browser, naming each match.
- No match in a `ClickableHtml` leaves the step to the browser, which may find the text in another block. So does a match the run cannot be sure of: another block on the page may show the same text (a block the headless run has no text model for, text its model leaves open, its text or any property value, or a message the app displayed), the match is behind an open `Modal` or `Drawer`, it depends on how the page lays out its text, on a class such as `hidden` the page's CSS may apply, on text an enhancer writes (`data-time`, `data-format` and the like) or on a tooltip under the pointer, it sits in a link or holds another control, the html draws its own `menu` or `dialog` role, or `nth` picks among matches in different places. With i18n locales, or under a `ConfigProvider` with a `locale`, the confirm's OK and Cancel go to the browser too, since their labels follow the locale. A click that a block around the `ClickableHtml` also answers (its `onClick`, unless the clicked `data-event` handles it) or that lands in a `DropdownMenu`'s content goes to the browser. With a `blockId`, a `Modal` or `Drawer` inside the block is left out, as it draws in its own portal.
- While a `ClickableHtml` popover or confirm is open, a click on anything but it, or the element that opened it, goes to the browser. antd draws the overlay over the page beside what opened it, and a browser's click on what it covers lands on the overlay.

`visible` holds once a `ClickableHtml` shows the text. `hidden` holds when none does and no other block may show it. A `control` target is still the better choice for an element with a `data-event`: it names the element by key, so it holds when the text changes and never needs the browser.

`press: Escape` closes the overlay that opened last, as in a browser. An open dropdown, a selector's search or a `ClickableHtml` confirm closes when no `Modal` or `Drawer` is open, or when it sits in the newest one. Otherwise the newest `Modal` fires `onCancel` and closes, and the newest `Drawer` fires `onClose` and closes, unless that event fails or the block's `keyboard` is `false` or another falsy value such as `null`. A `DropdownButton` or `DropdownMenu` fires `onOpenChange` with `{ open: false }`. A `Selector`, `TreeSelector` or `TreeMultipleSelector` clears its search and fires `onSearch` with `{ value: '' }`, while a `MultipleSelector` keeps its search, so a `select` after it still picks from what the search shows. A confirm drops its event. Escape is listed browser-only at its step when nothing is open, when two dropdowns are open, when a dropdown is open beside a `Modal` or `Drawer` it is not in, when a block binds `Escape` as a [keyboard shortcut](/keyboard-shortcuts) (an event's, or a tab's, menu link's (the app's `menus` included, for a menu or page layout block that draws them) or dropdown item's while no input has the focus), when a `Tour` is open, when the pointer rests on a block that can show a tooltip or popover there (a `Button` or `FloatButton` with a tooltip, a `Tooltip` or `Popover`, html with `data-tooltip` or `data-popover`, a table) and no `Modal` or `Drawer` mask covers it, when a `Modal` or `Drawer` on the page has `forceRender`, when the newest overlay is a `ConfirmModal`, or when the focus is in an input that handles Escape itself: a `TextInput` or `NumberInput` with an `onEscape` event, a date picker or an inline edit. A `fill` or `select` leaves the focus in its input, and a `click`, or an `open` that clicks, moves it off; an `open` that hovers a dropdown leaves it where it was. A `Modal` or `Drawer` that opens takes the focus, and as it closes it hands the focus back to the input that had it when it opened (not when `focusable.focusTriggerAfterClose` is false, or a `Modal`'s `mask` is off). A `NumberInput` the focus leaves this way, whose `min`, `max` or `precision` would change its number, sends the step to the browser. A browser run waits for overlays to finish opening or closing before it presses Escape, so it closes what a headless run closes.

`visible` and `hidden` read the block's `visible` and that of every block holding it, whether each `Modal` or `Drawer` around it is open, and whether a loading block around it shows its `skeleton` in its place, not what is drawn. Content behind a skeleton mounts, and fires `onMount`, only once its block stops loading, as in a browser. A journey whose meaning is "the person sees this" keeps an `expect: { text }`, which runs headless as below. The [lint](#lint) rule L8 names journeys that are browser-only only because of a target a `blockId` or a control key would replace, and text targets a control key would make sturdier.

### On a production build, for CI

```
lowdefy build
lowdefy test --build
```

`--build` runs on the production build in `.lowdefy/server` (or `--server-directory`), in the CLI's own process, with no dev server and no browser installed. A missing build, a build of another Lowdefy version and a build older than the config are refused with the command to run. Before any journey, the run checks the [access table](/access-table) against the build. Each journey gets a fresh in-memory database of its [data set](/journey-data-sets), as in a browser run. A `CallApi` with `detached: true` is recorded instead of sent, since it dispatches through the server's own route: the routine carries on as on a server, the endpoint it starts never runs, and `expect: { calls }` reads it as a call to that endpoint, with its payload. An auth step cannot run on a build, since no auth engine runs: it fails as a config error. A routine that handles the failure in the `:catch` of its `:try` still passes, see below. The results are written to `.lowdefy/test/headless-run.json`.

The app's real secrets are never read: every secret the build names reads the stand-in `test-secret-<NAME>`, and no `LOWDEFY_SECRET_*` variable reaches the run, whether it comes from the shell, CI or the app's `.env` file. A headless run on the dev server reads the same, see below. To give a secret a test value, set `LOWDEFY_TEST_SECRET_<NAME>` in the environment of the command:

```
LOWDEFY_TEST_SECRET_ORG_ID=org-a lowdefy test --build
```

Every journey of the run reads `org-a` for `_secret: ORG_ID`, and a secret with no test value keeps its stand-in. Use it for logic that compares a secret with data, such as an id the data set also holds. Set the same test values in CI, so the run gives the same answer there.

A sunk request's record has every secret value of 8 or more characters, test values and stand-ins included, replaced with `[REDACTED]`, so `expect: { sunk }` and a stub's `match` cannot match a secret value that is also a data-set id.

### While you edit

```
lowdefy test
```

A headless run does not count a server error that the routine's own `:catch` handled, and neither does a browser run: the routine dealt with it and answered, so the journey is judged by the answer and by what was written. An error that no `:catch` handles fails the journey at its step, and so does one the `:catch` passes on, as `:throw: { _error: true }` does.

Without `--build`, a headless run uses the development server: it starts one, or uses the one `--url` names. Pages are built on demand, so a config edit needs no rebuild, and every journey runs on its own [data set](/journey-data-sets) session. A headless journey's pages and calls read the secrets a `--build` run reads: `test-secret-<NAME>`, with the command's `LOWDEFY_TEST_SECRET_<NAME>` over them, never the `LOWDEFY_SECRET_*` the dev server holds, so it gives the same answer as on a build. That holds for a journey with no data set too: a request that needs a real secret, such as the app's database URI, fails as it does on a build, so give the journey a data set. A `CallApi` with `detached: true` is recorded and its endpoint never runs, as on a build. The dev server's own routes, and the journeys that run in a browser, keep the app's secrets, and a browser journey's detached calls still run. A headless run starts no browser, so it takes only its worktree's journey run slot: it waits for another run in the same app folder, which may stop the server it uses, but not behind browser runs elsewhere on the machine. What it exercised counts in `.lowdefy/test/exercised.json` for lint and `journeys harden`; it records no traces for session logs. The results are written to `.lowdefy/test/headless-run.json`.

The `lowdefy_run_tests` agent tool runs each journey where `lowdefy test` does, headless by default, and takes `browser: true`, `thorough: true` or `headless: true` as the CLI takes the flags. Its `summary` names the browser-only journeys and the `lowdefy_run_tests` call that runs them in the browser, and `.lowdefy/test/results.json` keeps each under `browserOnly`, never as passed or skipped. The `lowdefy_run_journey` tool takes `headless: true`, and `lowdefy_run_journey` needs no `pageId` for a [page-less journey](#calls-requests-and-the-database). A journey that needs a browser comes back with `browserOnly`, naming the step.

## Hardening journeys

A journey that passes does not prove much on its own: it may never check what its clicks did, it may pass only some of the time, and the edge cases around it are rarely written. These commands prove a journey is worth keeping.

### Replaying candidates

`lowdefy test --repeat 3 <paths>` runs each journey three times and classifies it:

```
PASS   member assigns an open ticket   (5 steps, 3/3, 2.1s each)
FLAKY  owner closes a ticket           (2/3 passed) run 2 failed at step 4 (click "close_submit"): ...
FAIL   admin bulk-imports contacts     (0/3) step 2 (click "import"): ... — fails every run: a finding, not a test to fix by retrying
```

A journey is kept, and a candidate moves into `tests/journeys/`, only after `--repeat 3` gives `PASS`. A `FLAKY` journey has a cause to fix, usually a missing `wait: { request }`, data that differs between runs, or a target that matches two elements; never add `wait: { ms }`. A `FAIL` is a finding: it breaks every time, so either the app has a bug or its behaviour changed.

Each run records what the journey exercised (the pages, requests, endpoints, events and blocks it touched) and a hash of the config it ran on in `.lowdefy/test/exercised.json`, which the lints, `journeys harden` and `journeys variants` read. Only a run of the whole suite, once, records as the suite's journey run.

### Lint

`lowdefy test --lint [paths...]` checks journeys without running them. It reads data sets from their files and needs no server. It prints one line per problem and exits `1` on any error:

```
L2  member assigns an open ticket  step 3 (click "assign_submit") is not followed by an expect or wait: { request } before step 4.
```

An **assertion step** is any `expect`, or a `wait: { request }`.

| Rule | Checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Severity |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| L1   | No placeholders: no `from: shape`, and no `fill` or `select` with `value: null`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | error    |
| L2   | A `click`, `open` or `press` whose target ran a Lowdefy event (in the journey's newest measured run), and every `goto` and `back`, is followed by an assertion step before the next action or input. A click that ran no event (a tab header) is exempt, as are `fill` and `select`. Unmeasured, every action is checked.                                                                                                                                                                                                                                                                                                         | error    |
| L3   | No `wait: { ms }`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | error    |
| L4   | A journey whose newest run called a request or endpoint that writes declares `data:`. Unmeasured, it is a warning to run the journey once.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | error    |
| L5   | `user` names a user from the journey's data set (or a list of them, each checked), or is `none`. An inline user object, or no `user`, is a warning until the journey moves onto a data set.                                                                                                                                                                                                                                                                                                                                                                                                                                       | warning  |
| L6   | The last step is an assertion step.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | error    |
| L7   | An `as` step names the person who is already acting (`as: main` while still `main`, or the same name twice running), so it switches to nobody.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | warning  |
| L8   | A journey that needs a browser only because some targets read the page (`text`, `containing`, `nth` or `row`), or that runs headless only by reading text in a `ClickableHtml`: each such step, with the target that would let it run [headless](#headless-runs) without reading the page. For a click, it is the control its newest measured run clicked (a `ClickableHtml` element's `{ blockId, control, rowKey }`, a grid cell's button, a modal's OK); otherwise, on a target that names its block and no grid row or cell, the `{ blockId }` alone. A check of what the person sees, `expect: { text }`, is never reported. | warning  |

A journey written from a [session log](#session-logs), with event-less clicks and a final `wait: { request }`, lints without errors.

### Mutants: `lowdefy journeys harden`

`lowdefy journeys harden` measures whether your journeys fail when the feature they walk breaks. It breaks the config on purpose, one small change at a time and only in the journeys' own browsers, while you keep working in the same development server: your own tabs keep seeing the unchanged app.

Only journeys with a [data set](/journey-data-sets) (`data:`) are hardened: mutant runs write through the app's connections from parallel workers, and without a data set that is your own database. A selected journey with no `data:` is left out with an error naming it; when none is left, harden exits `1`.

1. Each selected journey runs once, unchanged. One that fails is left out, with a note to replay it.
2. The development server lists the mutants on what those runs exercised: a dropped action, a skipped validation, a flipped `visible` or `disabled`, swapped `_if` branches, a dropped payload key, a `Link` sent to `404`, a dropped block, a dropped endpoint step. A layout or template copied into several pages is one mutant, listed under the first page by id.
3. Each mutant runs against every journey whose path reached it, on any page it is copied onto, and is applied to the copy that journey reaches: a journey that fails with the mutant applied **kills** it; one that passes lets it **survive**. A failure where the mutant never reached the run says nothing about the mutant: it counts as an error and runs once more.

```
page tickets:
SURVIVED  drop-action   pages/tickets.yaml:88   drop-action SetState "set_status" (2 of 3) from assign_submit.onClick
          ran: member assigns an open ticket (passed)
SURVIVED  drop-block    pages/tickets.yaml:141  drop-block Alert "assign_success" from tickets
          ran: member assigns an open ticket (passed)
SCORE     12/14 killed, 3 unique  member assigns an open ticket  (tests/journeys/tickets.yaml)
42 mutants run · 38 killed · 4 survived · 0 unapplied · 0 errors · sampled 42 of 42 (seed 0) · 19 not exercised · 0 rebuilds · 3m 10s
```

While it runs, harden prints a line as the baseline runs (`Baseline 37/412 journeys (2 failed)`) and as mutants finish (`Mutants 12/45 run (3 survived)`), every few journeys or about every 15 seconds, so a long run is not silent.

A survivor is a change no journey noticed, with the source line it changed: add the assertion that would catch it (`expect.text` of the message, `expect.state`, `expect.visible`, `expect.hidden` or `expect.calls`) after the step that exercises it, and confirm with `lowdefy journeys harden --mutant <id>`. A mutant listed as **unapplied** never reached the journey's browser: that is a defect in harden, not a gap in the journey. Mutants no journey exercised are counted, not run.

The report is written to `.lowdefy/test/mutation.json`: each mutant with the journeys that ran it, the suite's score, and each journey's `killed` out of `total` and its `unique` kills (mutants no other journey kills). It is merged per journey: a run over some journeys replaces their scores and keeps every other journey's from earlier runs, until that journey is removed. An earlier mutant is kept only while the development server still lists it, so a removed or edited block, action or request stops counting, and each journey's score is recounted without it. `--mutant` runs write nothing. Survivors are findings, so the exit code is `0`; it is `1` only when the run could not finish. Editing the config during a run is fine: harden re-lists the mutants, keeps the verdicts no changed file touched and runs the rest again. The third change in one run stops it. harden never writes or deletes a journey.

- `[paths...]`, `--filter <name>`: The journeys to harden, as for `lowdefy test` (one `--filter`, and no `--tag`).
- `--page <pageId...>`: Only mutants on these pages, and the endpoint mutants a journey touching them called. The baseline run also skips journeys that cannot reach these pages: ones whose last measured run in `.lowdefy/test/exercised.json` touched none of them and whose `pageId` and `goto` steps name none. A journey with no record, a changed journey, or a record measured on a different config is always run, so run `lowdefy test` first to get the saving. A record belongs to a config by its content (a hash of the built pages, requests, endpoints and connections), not by when the dev server started, so `lowdefy test` and `lowdefy journeys harden`, which each start their own server, agree as long as the config is unchanged in between. The log says how many journeys were left out, and when journeys were kept whole it says why: no record, the journey changed, or the config changed since the last `lowdefy test`.
- `--operators <list>`: Only these operators, comma separated: `drop-action`, `skip-validate`, `flip-visible`, `swap-if`, `drop-payload`, `retarget-link`, `drop-block`, `drop-step`.
- `--max <n>`: Run at most `n` mutants, sampled the same way on every machine. The default is 200; `0` runs every mutant.
- `--seed <n>`: The sample's seed. Another seed draws another sample, so repeated runs can cover the rest. The default is `0`, recorded in the report.
- `--workers <n>`: How many journey runs at once, 1 to 16. The default is `4`. A journey never runs beside itself, and one that reads email runs alone.
- `--list`: Print the sampled mutants per operator and page and a time estimate, and run nothing.
- `--mutant <id>`: Run only this mutant, against the journeys on its path. The report file is left as it is.
- `--json`: Print the report as JSON.
- `--headless`: Run each journey that needs no browser, and every mutant run against it, [headless](#headless-runs) on the development server. Journeys that need a browser, and one the runner finds needs a browser at run time, run in the browser as before. The summary line adds how many mutant runs went each way (`31 pairs headless, 11 in the browser`); `--json` adds them as `pairs: { headless, browser }`. A headless journey kills the same mutants as in the browser, in a fraction of the time.
- `--url`, `--port`, `--config-directory`, `--dev-directory`, `--ref-resolver`, `--log-level`, `--disable-telemetry`: As for `lowdefy test`.

### Variants: `lowdefy journeys variants`

`lowdefy journeys variants <file>` writes edge-case candidates of a journey to `tests/journeys/_candidates/variants/<source>/<journey>-<kind>.yaml` and replays each three times. `<source>` is the journey file's path under `tests/journeys/` (or under the config directory, for a file outside it) without its extension, so two files with one name in different folders never share a folder. `<journey>` is the journey's name in lower case with each run of other characters replaced by `-`, so the journeys of one file never share a file. A kind with several variants numbers them: `<journey>-negative-1.yaml`, `<journey>-negative-2.yaml`. The same journey always gives the same files.

| Kind            | The variant                                                                                                                                                                                                                                                                                                                                                                       | Passes when                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `role`          | For each other role set (the page's role matrix from `journeys coverage`, else each data set user's role set), the same steps as a data set user with exactly that set. A set that holds none of the page's `auth.roles` is not written: which role reaches which page is the [access table](/access-table)'s to check.                                                           | That role can do the flow                                                                                                                  |
| `tenant`        | A user of another organization (with the same roles when one exists) walks to the first step that uses a fixture value, waits for their own organization's row there, then checks each of this organization's fixture values is hidden. For a journey that needs no browser, also a page-less journey in which that user sends each write the page sent, with the page's payload. | The other organization sees its own rows and none of this one's; each row a write names is left as the fixture wrote it (`expect: { db }`) |
| `empty`         | The journey's user, by name, on the `--empty-data` data set, up to the first step that uses data, then that step's block is visible.                                                                                                                                                                                                                                              | The page renders its empty state                                                                                                           |
| `volume`        | The same steps, as the journey's user by name, on the `--volume-data` data set.                                                                                                                                                                                                                                                                                                   | The flow completes within its timeouts                                                                                                     |
| `negative`      | For each `fill` before the submit click on a block with `required` or a `validate` rule: the field left empty (or a placeholder to fill, for a `validate` rule), then the submit.                                                                                                                                                                                                 | The message shows and nothing is sent                                                                                                      |
| `interrupt`     | A full reload of the start page just before the submit click, then the flow again.                                                                                                                                                                                                                                                                                                | The flow writes exactly once                                                                                                               |
| `double-submit` | The submit click as a double click (`count: 2`).                                                                                                                                                                                                                                                                                                                                  | The write happens once                                                                                                                     |

A variant of a journey that needs no browser is replayed [headless](#headless-runs) when it needs none either, and so is every page-less variant; the rest replay in the browser. The page-less `tenant` variants give a negative request suite for other organizations' rows that you generate rather than write; who reaches which page and endpoint is the [access table](/access-table)'s to check. The `tenant` call form replays the payloads a headless run of the journey records, so variants runs such a journey afresh, headless, before it writes them.

The **submit click** is the last `click` followed by a `wait: { request }` for a request that writes. Each variant is named `<journey> — <kind>: <detail>` and carries a `variant` key naming the journey it came from:

```yaml
name: 'member assigns an open ticket — double-submit: double click "assign_submit"'
pageId: tickets
variant:
  of: member assigns an open ticket
  kind: double-submit
  detail: double click "assign_submit"
steps:
  # ...
```

Each file starts with a header line naming the journey file it came from and holding a hash of what was generated. A file belongs to that journey file and the journey its `variant.of` names. A rerun rewrites a file it owns that is left as generated, keeps one you edited (a filled-in placeholder, a fix after a flaky replay) and says so, and removes an unedited file it owns that the journey no longer gives. A file another journey owns (two journey names that give one slug) is left alone and reported as `CONFLICT`: rename one of the journeys. A variant that passes is a candidate to keep; one that fails is a finding, a bug or a behaviour to assert as expected; a flaky one has a cause to fix. A granted `role` variant that passes is kept by adding its user to the original journey's `user` list ([one journey, several users](/journey-data-sets#one-journey-several-users)) and deleting the variant file, so the steps stay in one place; its first comment names the list. No `role` variant is written for a role that is refused the page: [`tests/access.yaml`](/access-table) checks who reaches which page and endpoint. A variant keeps the journey's `stubs`, so its outside calls are answered and its forced failures fail as the journey's do. Variants of a journey with a list of users or a [case table](#case-tables) keep the list or the table, and replay once per user or row. On a case table, the `role`, `tenant`, `empty` and `volume` kinds read each row's user: a variant keeps the rows it was made for, and names them when they are not every row. A granted `role` variant of a case table that passes is kept by adding its rows, with its user, to the table. The `role` and `tenant` kinds read the journey's data set file; a variant whose input is missing (no user with a role set, no fixture for the other organization, no `--empty-data`) is listed as skipped with what to add.

- `--name <journey>`: The journey to vary, when the file holds several.
- `--kinds <list>`: Only these kinds, comma separated.
- `--empty-data <name>`: The data set the `empty` variant runs on. It needs a user with the journey user's name.
- `--volume-data <name>`: The data set the `volume` variant runs on. It needs a user with the journey user's name.
- `--no-run`: Write the variants without replaying them.
- `--url`, `--port`, `--config-directory`, `--dev-directory`, `--log-level`, `--disable-telemetry`: As for `lowdefy test`.

### The `journeys-harden` skill

`lowdefy agent-setup` installs a `journeys-harden` skill that runs this section with you. It replays the journeys and candidates three times, lints them, sizes a `journeys harden` run with `--list` and asks before it starts, then takes each surviving mutant to you one at a time with the assertion that would catch it, confirming each with `--mutant <id>` and `lowdefy test --repeat 3`. It writes variants for the journeys you pick, refreshes `journeys evidence`, and reports journeys with no production backing (with their mutation kills), duplicate journeys and pages no journey reaches. It never deletes a journey or suggests deleting one, writes no step except an assertion you approved, and commits nothing.

## Journeys on autopilot

`lowdefy agent-setup` installs a `journeys-autopilot` skill for an app with no journeys, or with some. Start it once and leave it running: in Claude Code, `/loop /journeys-autopilot` (or a background session running `/journeys-autopilot`), from a shell that holds your app's secrets: exported variables, or a wrapper such as `infisical run -- claude`. It never reads or copies your `.env`; a variable the app needs and the shell lacks stops it with the variable named. It is one agent, with no sub-agents, one dev server and one test run at a time, in its own git worktree and branch, so your checkout and dev server are untouched.

The first cycle writes a [data set](/journey-data-sets) with made-up fixtures and a test user for each role, maps every page by role and every control that writes data, and records them in a ledger, `tests/autopilot.yaml`, committed in your app. When several `package.json` scripts run `lowdefy dev` and [`cli.devScript`](/cli#configuration) is not set, it sets `cli.devScript` to the one whose name marks it the development script, never one that names production or staging, and says why in the pull request; when no single script qualifies, it stops and names them. When your app already has a data set and journeys, it extends that data set (`extends: [<name>]`) without editing it, and enters each of your journeys in the ledger as covered: it never rewrites, moves or duplicates them. Each later cycle reads the ledger and takes the next gaps by value: writes, then the pages people use most, then edge cases. Which role reaches which page is the [access table](/access-table)'s to check, so it writes no journey for a role that cannot open a page. A control hidden from a role is a page journey for that role, and another tenant's rows are proved by the tenant variants. A control that writes data gets one journey, which uses the control and asserts what it stored with `expect: { db }`. Signed-out visits are skipped with a reason, since data set journeys run as signed-in users. A journey is kept only after three clean runs in a row (`lowdefy test --repeat 3`) and must assert a value only the fixtures hold. A flaky journey moves to `tests/journeys/_quarantine/` with its cause; a journey that exposes an app bug moves to `tests/journeys/_findings/` as a finding. Neither is deleted, and no journey is ever weakened to pass. Once every item is covered, the cycles turn to `lowdefy journeys harden` and `variants`, and to `coverage` when production analytics are pulled.

Each cycle ends with the ledger committed and its servers stopped, so you can interrupt it any time. Its work goes to one branch, `journeys-autopilot/main`, and one open pull request of journeys with a plain-language summary. Each cycle resumes from the pushed branch, so a run on another machine picks up where the last stopped. At about 20 journeys the pull request stops growing until you merge it; the next cycle then starts the branch afresh. Once the journeys that found an obvious, local app bug have merged, it fixes the bug in a separate small pull request that moves the failing journey into the suite, turning green; it writes up any other finding for you. It never merges, never pushes to the default branch, and never runs against production or a shared database. When the environment is broken (a missing variable, no clear dev script, a dev mock user in your config, a closed pull request, a rejected push) it records why in the ledger and stops.

## Dev recordings

`lowdefy dev` records how you use your app in the browser, so an agent can read what you just tried and write journeys for it. Recording is on by default and stays on your machine:

- Every tab you open on the development server records its clicks, typed values, key presses and page views, joined to the events they ran and the state those events wrote, to `.lowdefy/traces/dev/<date>/<session>.jsonl` in your config directory. `.lowdefy/` is not committed.
- Values you type are kept, so a recording can include data your app shows you. Password fields are never recorded: their values, and the state they write, are replaced with `null`.
- Recordings are kept for 7 days or 200 MB, whichever comes first. The development server deletes older ones at start and then every hour.
- Set `LOWDEFY_DEV_RECORD=false` in your shell or in the app's `.env` to turn recording off. Old recordings are still pruned.

`lowdefy test` records too, as `journey` traces under `.lowdefy/traces/journey/`, but only when it runs the whole suite once: no journey paths, no `--tag`, no `--filter`, no `--tier` but `full`, and only the first of `--repeat` runs. Skipping `deprecated: true` journeys still counts as the whole suite. Only journeys that run in the browser record, so a plain `lowdefy test` records nothing, `lowdefy test --thorough` records the ones it ran there, and `lowdefy test --browser` records the whole suite. Those traces show what the suite actually drives. Screenshots, state inspection and other agent tools never record.

### Session logs

`lowdefy journeys session` lists the recorded dev sessions, newest first, one line each: its id, when it ran, the pages it visited, how many interactions it holds and how many failed. Give it a session id and it prints that session as a log, one line per interaction with what the app did in response:

```
Session 20261003T140300Z-bbbbbb, 2026-10-03T14:03:00.000Z to 2026-10-03T14:21:40.000Z:
page ticket-new
fill title "Quarterly"
click save → Validate failed [priority]
fill priority "high"
click save → ran Validate, Link, request createTicket ok
page tickets
```

A failed attempt and its retry both show, values typed in dev show as typed, and ids the app generated show as values. The log asserts nothing: it is what you, or an agent, read to decide what a journey should prove, then write it and run it with `lowdefy test --repeat 3 <file>`. A `(config rebuilt)` line marks where a config edit reloaded the page.

- `--since <since>`: Only sessions with records at or after this time, as a duration back from now (`30m`, `2h`, `7d`) or an ISO date.
- `--source <dev|production>`: Where sessions are read from. `dev`, the default, is what the development server recorded; `production` reads the pulled cache, see [Production session logs](#production-session-logs).
- `--json`: Print the list or the log as JSON.

Agents connected to the development server read the same list and logs with the `lowdefy_journey_session` tool (optional `id` and `since`), which reads the app's own `.lowdefy/traces/dev/`.

`lowdefy agent-setup` installs a `journeys-from-dev` skill that uses these commands: it asks which session you meant, reads its log, decides what you were proving (a failed attempt and its fix are both worth a journey), writes the journeys with assertions on outcomes rather than on ids the app generated, runs each three times with `lowdefy test --repeat 3`, and leaves the ones that pass for you to keep.

## Production journeys

Journeys can be written from what your users do in production. Apps that send analytics with the [PostHog plugin](/PostHog) can pull them to your machine, read each session as a log, and see which journeys real use backs and what it does that no journey covers.

```
pnpx lowdefy@7 journeys pull posthog --since 30d
pnpx lowdefy@7 journeys session --source production --since 30d
pnpx lowdefy@7 journeys coverage --source production
pnpx lowdefy@7 journeys evidence --refresh
```

[`journeys pull posthog`](/cli#journeys-pull-posthog) needs `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST` and your own `POSTHOG_PERSONAL_API_KEY` with the Query Read scope. It writes one file per UTC day to `.lowdefy/traces/production/`. What it keeps:

- No value a user typed. PostHog never captures one, so a production session log's `fill` lines name the control only, and a journey written from it takes its values from your test data.
- Person and organisation ids hashed with a salt that never leaves your machine, so counts of people and organisations are the same on every machine while no raw id is stored.
- Page URLs with query parameter names only (`/tickets?id=&tab=`), never their values.
- The page each event happened on, by its page id, and the values of its [path](/page-paths) placeholders as `pathParams`. A page is never read from the URL path, so two records of one patterned page are two visits to it, and a journey that enters on a patterned page needs `pathParams`.
- No clicked text. The text of each clicked element is stored as a token, a hash under the same salt, so the same text groups and counts without being kept. Session logs, coverage and evidence turn a token back into text only when it is text from your app's config (pages, menus, i18n messages, block plugins' default messages, antd's own strings), collected with one full build of the app by the installed development server and cached until the config changes. Text that is not in the config, such as a customer's name in a grid cell, stays a token.
- No match index. A click on one of several controls with the same label, such as a grid's per-row Edit, carries no `nth`, so a step written from it as it stands targets every one of them. Narrow such a step by `blockId`, `row` or `containing`; a target that matches several controls fails the run rather than clicking the first. The `journeys-from-production` skill does this for you.

Pull, session logs and coverage read at most 30 days at a time: pick the window for the question, such as the last 30 days, the days since a deploy for a regression, or the days around a month-end for a periodic process. Evidence is not capped.

Upgrading from a version that stored clicked text: the first pull or production read deletes the day files pulled that way, any production candidates an earlier version wrote to `tests/journeys/_candidates/production/` and `.lowdefy/test/coverage.json`; the next pull and coverage write them again. Committed journeys are left as they are, so check any you promoted from production for text that came from your data rather than your config.

### Production session logs

`lowdefy journeys session --source production` reads the pulled window (`--since`, or `--from` and `--to`, at most 30 days) and works as it does for [dev sessions](#session-logs): without an id it lists the window's sessions, newest first; with one it prints that session as a log. Session ids are the analytics session ids the pulled cache holds (people and organizations in it are hashed). A production log shows the controls used and what the app did, never a typed value, and clicked text only when it is config text: a click on anything else reads `(text not in config)`. Rage and dead clicks are marked `(rage click)` and `(dead click)`. Production sees only the events that failed, so a line shows an outcome only when something failed.

```
page tickets
fill title
click save → Validate failed [priority]
click export (dead click)
```

Reading sessions one by one works until a window holds too many. From 100,000 rows in the window, [coverage](#coverage) and [usage](#usage-and-tiers) group sessions that do the same thing into flows and rank them by use instead; below that, they leave flows out and point to the session logs. `lowdefy journeys coverage --group` groups at any size, and `--no-group` never groups.

### Evidence

A committed journey can carry how much production use backs it, by calendar month:

```yaml
- name: member assigns an open ticket to a teammate
  pageId: tickets
  evidence:
    production:
      sequence: v1-3f9a12c0 # the flow these months were counted for
      pageId: tickets
      flow:
        - tickets ["click","assign",null,"Assign"]
        - tickets ["select","assignee",null,null]
      months:
        - { month: 2026-08, days: 31, sessions: 380, persons: 35, orgs: 9, failures: 12 }
        - { month: 2026-09, days: 30, sessions: 412, persons: 37, orgs: 9, failures: 14 }
        - { month: 2026-10, days: 3, sessions: 38, persons: 11, orgs: 5, failures: 1 }
    mutation: { killed: 11, total: 12, unique: 2 }
    refreshed: 2026-10-05
  steps:
    - click: { blockId: assign, text: Assign }
    - select: { blockId: assignee, value: Ann }
```

A session backs a journey when it does the journey's interactions in the same order, other clicks in between allowed, starting on the journey's page. A journey's click text counts only when it is text from your app's config: any other text reads as no text, so a click on a grid cell by a customer's name is backed by that column's clicks exactly as one with no text, and no command tells whether production showed that value. Only [`lowdefy journeys evidence --refresh`](/cli#journeys-evidence) writes the key, and it changes nothing else in the file: comments, key order and quoting stay as they are. `lowdefy test` reads it to print the PASS line and validates it strictly, so a typo in a hand edit fails before the browser opens. A `dev` subkey is refused, with a message to delete it. A committed `mutation` subkey keeps its value when its source is not on your machine; it is filled from a hardening run's report in `.lowdefy/test/mutation.json` when there is one.

Each month is a UTC calendar month. `days` is how many of its final days the refresh read: the pull re-pulls today and yesterday for late events, so they count only once a later pull marks them final. `sessions` counts the backing sessions that started in that month, so a session that crosses midnight counts once; `failures` counts those that hit a failed event; `persons` and `orgs` are distinct within the month and do not add up across months. A month read with no backing session is written with `sessions: 0`, and a month never pulled is missing.

Counts build up across pulls and machines without double counting. A refresh reads every final day in the cache, gaps and all, and rewrites a month only when the cache holds more final days of it than the committed entry. Refreshing twice changes nothing, two machines holding the same days never overwrite each other, a colleague's fuller pull wins, and a laptop that never pulled a month, or pruned it, leaves that month as committed.

Each pulled day records the filters it was pulled with: the PostHog project, `--environment` and `--include-test-accounts`. Days pulled with different filters count different people, so `journeys evidence`, `journeys coverage` and `journeys usage` refuse a cache that mixes them, naming each set of filters with its days, and say to pull them again with one set (`lowdefy journeys pull posthog --refetch`). A pull whose filters differ from days already in the cache warns which days need pulling again.

`flow` is what the journey's steps are matched on: one `<page> <step>` line per click, select, fill, press, back or open, with the block, grid column and clicked text (config text only, as above, so a click by a customer's name is the same flow as one with no text), and `sequence` names it. Waits, other expectations, typed or picked values, rows and `nth` leave it unchanged. When an edit changes it (a click's text or block, the order, a `goto`, or an `expect.url` path that moves later steps to another page), the next refresh moves the counted months to a deprecated flow and counts the new flow from the cache:

```yaml
production:
  sequence: v1-3f9a12c0
  # …
  deprecated:
    - sequence: v1-91be04d7
      pageId: tickets
      flow:
        - tickets ["click","assign_button",null,"Assign"]
      replaced: 2026-10-05
      months:
        - { month: 2026-09, days: 30, sessions: 40, persons: 12, orgs: 4, failures: 0 }
```

A deprecated flow is never run, and every refresh keeps counting it, so you can see whether users still follow the old way. A renamed label keeps its history: a refresh reads a clicked-text token as today's config text or as any click text a committed flow already holds, so after `Assign` becomes `Allocate` the old flow's clicks still read as `Assign` and a fuller pull does not recount its months to 0. Undo the edit and it becomes live again with its months. No command deletes one; delete it by hand once it shows no use. A `production` block in the older window shape (`sessions`, `share`, `window`) still validates, and the next refresh replaces it with months.

A journey can also be retired as a whole with `deprecated: true` at its top level, while you watch its flow drain from production: `lowdefy test` skips it in every run, refresh keeps counting it, and [coverage](#coverage) leaves it out, since a journey that never runs covers nothing. Remove the flag to run it again.

No command removes a journey for lack of production use. Three months cannot see yearly work, and a journey that is the only one to catch a mutant matters whatever its traffic. `journeys evidence` lists the journeys nothing backs over the last 3 months, beside their mutation numbers, and leaves the decision to you.

### Usage and tiers

[`lowdefy journeys usage`](/cli#journeys-usage) ranks the journeys by how much real use leans on them now:

```
pnpx lowdefy@7 journeys usage
pnpx lowdefy@7 journeys usage tests/journeys/review --tier common
pnpx lowdefy@7 journeys usage --json
```

A journey's rate is its production sessions over the final days its months hold in the usage window: the last 3 calendar months (`--usage-window 3m`), ending at the newest month any selected journey has, so every journey is ranked over the same calendar and a flow that launched last month is not buried under years of history. The report lists the journeys by rate with their tier, their sessions and failures over the window and all time, one line per month with that month's people and organisations, and their deprecated flows with their recent use. Below that come the production flows no journey covers, from the coverage report, ranked by their sessions in coverage's window, when coverage grouped them; otherwise the report says why it lists none.

A tier is a cut through the selected journeys, ranked by rate, most first:

| Tier     | Cut | Reads as                              |
| -------- | --- | ------------------------------------- |
| `common` | p50 | the happy paths                       |
| `wide`   | p80 | the usual variations                  |
| `edge`   | p95 | the edge cases real users still reach |
| `full`   | p0  | every journey                         |

Tier pX holds the shortest run of journeys, from the top, whose summed rates reach X% of the total. Tiers nest, and journeys with equal rates are never split across a boundary. Tiers are cut over the selection after paths, `--tag` and `--filter`, so `tests/journeys/review --tier common` is the happy paths of the review area. A session counts for every journey it backs, so a tier's share is a share of journey matches, not of sessions. A journey edited since the last refresh, or never refreshed, has no counts for its current flow: it is `unranked` and in every tier, since a new or changed journey is what a change needs tested. A `deprecated: true` journey is in no tier. With fewer than 100 journey matches in the window, tiers are noise, and every tier but `full` is refused.

### Coverage

[`lowdefy journeys coverage --source production`](/cli#journeys-coverage) reports five measures, each as covered out of total with the uncovered items ranked by use:

| Measure     | Counts                                                            | Covered when                                                          |
| ----------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| Interaction | each interaction in production sessions, by how often it happened | a journey does the same interaction on the same page                  |
| Flow        | production sessions, when grouped (100,000 rows or `--group`)     | a journey is backed by the session                                    |
| Failure     | distinct failed events (page, block, event, invalid fields)       | a passing journey produced the same failed event (see below)          |
| Frustration | rage- and dead-clicked blocks                                     | a journey clicks the block and asserts with an `expect` right after   |
| Role        | (page, role set) pairs seen in production                         | a journey visiting the page runs as a user with exactly that role set |

The flow measure groups sessions into flows only when the window holds 100,000 rows or more, or with `--group`; otherwise it is left out, the summary says why, and you read the sessions with [`lowdefy journeys session --source production`](#production-session-logs). `--no-group` leaves it out at any size. The other four measures are always computed. Journeys with `deprecated: true` are left out of every measure: they are never run, so a flow only a deprecated journey walks reads as uncovered. A journey runs as its inline user's role set, as each data set user its `user` names (read from its data set file), or signed out with no user; `user: none` signs in through the app, so it counts for no role set. Coverage has no tiers: its flows are counted over the mining window of at most 30 days, not by month, so they have no rate to rank by.

Coverage also reads the newest full test run that the development server recorded (`lowdefy test --thorough` or `--browser`, or `lowdefy_run_tests` with `thorough` or `browser`, with no paths, tags, filter or tier). It holds only the journeys that ran in the browser, so a plain `lowdefy test`, which runs none there, records nothing: run `lowdefy test --browser` for a measure of the whole suite. The interaction measure then adds a measured share beside the static one: the production interactions that run actually drove. Failure coverage becomes measured: a failure counts as covered when a journey that passed in that run produced the same failed event, because a journey that reaches a failure and still passes asserts it. The test runner keeps which journeys passed in `.lowdefy/test/run.json`. Without a recorded run, failure coverage is reported as reached: a journey does the interaction that failed, which does not show it checks the outcome.

It writes whether flows were grouped (`flowGrouping`), the measures, a production profile (the top flows per entry page when grouped, failure paths, frustrated blocks, role sets per page, entry pages, and per block and column the clicks, distinct clicked-text tokens and most-clicked tokens) and each journey's interactions to `.lowdefy/test/coverage.json`, which is rewritten on every run and not committed. With a mutation report, the suite's mutation score is added as a sixth number.

`lowdefy agent-setup` installs a `journeys-from-production` skill for your coding agent. The agent picks the window for the question and says why, pulls and measures, then reads each session's log (or, from 100,000 rows, the grouped flows) with the page's config, requests, actions and plugin code to decide what the person was doing and whether it deserves a journey: failures first, then routines that write data, move money, change access or end a process, then the rest by count. It writes each journey from what the session showed, filling typed values from your data set's fixtures and labels from your config, proves each with `lowdefy test --repeat 3`, refreshes evidence with `lowdefy journeys usage --json` read before and after, and reports what it wrote, what it skipped and why, the findings, the deprecated flows users still follow, and how the tiers moved. It reads tokens, never production text: it does not read the trace salt or your `.env`, and never queries PostHog directly. It asks you only about findings and dead clicks, commits nothing, and never deletes a journey or suggests deleting one. It never deletes a deprecated flow either; it may suggest you delete one that shows no use.
