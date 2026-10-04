# Config Tests

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

| Field      | Required | Description                                                                                                                                                                                                                         |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`     | Yes      | A short description. `--filter` matches against it, and it is printed in the results.                                                                                                                                               |
| `pageId`   | Yes      | The page to open.                                                                                                                                                                                                                   |
| `user`     | No       | The user to act as, as an inline user object such as `{ sub: u1, roles: [admin] }`. Leave it out to run as the default roleless headless user. On a journey with `data`, the name of one of the data set's users, such as `member`. |
| `data`     | No       | A [data set](/journey-data-sets) name. The journey runs against a fresh in-memory MongoDB database of its own, loaded with the data set, so it may write freely.                                                                    |
| `urlQuery` | No       | An object appended to the page URL as a query string, for pages that read `_url_query`.                                                                                                                                             |
| `steps`    | Yes      | At least one step. Each step is an object with exactly one key from the step grammar below.                                                                                                                                         |

`user: none` injects no user at all, so the journey signs in through the app's own auth — see [Testing sign-up and sign-in](#testing-sign-up-and-sign-in). It is refused on a data set journey while auth is configured.

`timeout` sets how long each step may wait, in milliseconds (a whole number from 1 to 60000, default 5000). Raise it on a slow machine or CI runner rather than adding `wait: { ms }` steps.

### Timeouts

The journey's `timeout` (the step timeout) bounds every wait a step makes for something to happen, and a step moves on as soon as it has:

| Wait                                                                       | Bound                                      |
| -------------------------------------------------------------------------- | ------------------------------------------ |
| A control becoming actionable for `click`, `fill`, `select`                | The step timeout.                          |
| `expect` (`state`, `visible`, `text`, `url`, `title`) matching             | The step timeout.                          |
| `wait: { request }` and `wait: { state }`                                  | The step timeout.                          |
| `back` loading the previous page                                           | The step timeout.                          |
| An email arriving for `email` or `fill.fromEmail`                          | The step timeout.                          |
| Opening a page: the journey's page, `goto`, the first `as` for a name      | The step timeout, but at least 15 seconds. |
| Settling after an interaction (`click`, `fill`, `select`, `press`, `back`) | The step timeout, but at most 5 seconds.   |
| `wait: { ms }`                                                             | Exactly `ms`; the timeout does not apply.  |

The settle after an interaction lets the page's own events and requests finish before the next step. It never fails a step: a page still busy after 5 seconds (an event that ends in a resend cooldown, for example) moves on, and the next step waits for what it needs itself. So raising `timeout` makes a slow journey pass without making a passing one slower.

## Steps

Blocks are addressed by their `blockId`. A step that does not complete within the step timeout (5 seconds, or the journey's [`timeout`](#timeouts)) fails the journey. An `expect` step waits, up to that timeout, for what it checks to become true, so a value a click leads to can arrive a moment later.

| Step                                      | Meaning                                                                                                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `click: target`                           | Click the block, or the control a [target](#targets) narrows to.                                                                                            |
| `click: { ...target, count: 2 }`          | Click 2 (or 3) times in quick succession, as a person's double click, before the runner waits for the page to settle. `count` defaults to 1.                |
| `fill: { blockId, value }`                | Type `value` into the input inside the block (or the grid cell a target names).                                                                             |
| `fill: { blockId, fromEmail }`            | Type text read from an [email](#emails) instead of a fixed value, such as a one-time sign-in code. The actor stays on the page.                             |
| `select: { blockId, value }`              | Open the selector block (or grid cell) and choose the option whose text is `value`. A radio, button or segmented selector's option is clicked by its label. |
| `press: Enter`                            | Press a key or chord. `Mod` in a chord (`Mod+k`) resolves to Cmd on macOS and Ctrl elsewhere.                                                               |
| `back: true`                              | Go back one page, like the browser's Back button. Fails when the journey has not navigated from an earlier page.                                            |
| `goto: pageId`                            | Load a page the way a typed URL does; `{ pageId, urlQuery }` adds a query string. A protected page may redirect (to sign in), so assert where it landed.    |
| `email: { to, subject }`                  | Open the newest [email](#emails) to `to` — with a subject containing `subject`, when given — that arrived during the journey, waiting for it if needed.     |
| `as: name`                                | Act as [another person](#several-people), each in their own browser. The journey starts as `main`.                                                          |
| `wait: { ms }`                            | Pause for `ms` milliseconds.                                                                                                                                |
| `wait: { request: requestId }`            | Wait until the request has finished loading.                                                                                                                |
| `wait: { state: path }`                   | Wait until the state value at `path` is defined.                                                                                                            |
| `screenshot: name`                        | Capture a screenshot. Screenshots are returned to agents using the MCP tool; the CLI runner ignores them.                                                   |
| `expect: { state: { path, equals } }`     | The page state at `path` deep-equals `equals`. A path that does not exist reads as `null`, so `equals: null` also passes for a misspelt path.               |
| `expect: { visible: target }`             | The block, or the control a target narrows to, is visible.                                                                                                  |
| `expect: { hidden: target }`              | Nothing the target names is visible: no element matches, or every match is hidden. Passes at once when nothing matches yet, so pair it with a presence.     |
| `expect: { calls: { request, count } }`   | This person's browser called the request `count` times since the journey started, counted once the page settles. `pageId` names the request's page.         |
| `expect: { calls: { endpoint, count } }`  | The same for an endpoint called with `CallAPI`. Counts survive full page loads, so `count: 0` after a reload checks a write was never sent.                 |
| `expect: { text: { blockId, contains } }` | The block's rendered text (or a grid row's or cell's) contains the string.                                                                                  |
| `expect: { url: { contains } }`           | The browser URL contains the string.                                                                                                                        |
| `expect: { title: { equals } }`           | The document title (the browser tab's text) is exactly the string; `{ contains }` checks part of it.                                                        |

`expect.calls` takes `{ request: requestId, pageId, count }`: request ids are scoped to a page, and two pages often share one such as `save`, so `pageId` names the page; it defaults to the page the person is on when the step runs. It compares once, without waiting for the count to change, because "not called" can only be judged after the moment has passed.

### Recorded values: `from`

`fill`, `select` and `expect.state` take an optional `from`, written by [`lowdefy journeys compile`](#candidates-from-recorded-traces) on the values it took from a recording:

- `from: recorded` marks a value observed in a trace. The step runs as usual; the marker tells you the value is whatever that recording happened to use, so review it.
- `from: shape` marks a placeholder, `value: null`, for a value the trace could not hold: a value typed in production, or a password the dev recorder did not keep. The runner refuses a journey that holds one before it opens a browser, naming the step. Fill the value from your test data or the journey's user, then remove `from`.

A `fill` or `select` with `value: null` and no `from: shape` is a grammar error.

The full grammar, including the failure shape the route returns, is documented with the [journey tool](/ai-agent-docs). The CLI and the MCP tool share one implementation, so a journey an agent verifies interactively can be committed as-is.

### Targets

A `blockId` reaches a block's own control — its button, input or link. Some controls are not blocks: the Edit and Delete buttons a grid renders in every row, the OK and Cancel of a confirm dialog, the items of a dropdown menu. Wherever a step takes a `blockId`, it also takes a target object that narrows the search:

| Key          | Meaning                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `blockId`    | The block to search inside.                                                                                 |
| `row`        | A grid row, zero-based as displayed (`AgGrid*` blocks). Needs `blockId`.                                    |
| `column`     | A grid cell in that row, by the column's `field` or `colId`. Needs `blockId`.                               |
| `text`       | The interactive control whose visible text is exactly this (a button label, a tab, a menu item).            |
| `containing` | The element whose visible text contains this: a row of a list a person picks by the name or email it shows. |
| `nth`        | When several controls match, the zero-based one to use.                                                     |

`text` on its own, with no `blockId`, searches the whole page — front-most layer first: an open dropdown menu, then an open dialog, then the page. That is how a confirm dialog's button is clicked while the grid behind its mask has a button with the same label.

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

Give journeys that sign people in a `timeout` of about 30000. They load many pages, reload the app after each sign-in and wait for real emails, so on a busy machine or a CI runner the 5 second default fails them at random steps.

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

A journey with an [`evidence`](#evidence) key prints it after its `PASS` line: `PASS  member creates a control  (5 steps, 1840ms)  412 sessions · 9 orgs · 11/12 mutants`. The organisations part is left out when the app sends none, the mutants part when there is no mutation report, and a journey nothing backs shows `0 sessions in window`. `FAIL` lines carry no evidence.

### Options

- `[paths...]`: Journey files or directories to run instead of `tests/journeys/*.yaml`, anywhere under the config directory, including the candidates in `tests/journeys/_candidates/`. `lowdefy test tests/journeys/_candidates/dev` runs every dev candidate. `--filter` applies on top.
- `--filter <name>`: Only run journeys whose `name` contains the string (case-insensitive). `lowdefy test --filter control` runs every journey with "control" in its name.
- `--repeat <n>`: Run each journey `n` times in a row (1 to 10) and classify it, as described in [Replaying candidates](#replaying-candidates).
- `--lint`: Check the journeys for the [lint rules](#lint) and run nothing.
- `--journeys-directory <path>`: Read journeys from this directory instead of `tests/journeys/`, for journeys that need a server set up for them, such as [auth journeys](#the-database). A relative path is resolved from the current directory. The run fails when the directory holds no journeys.
- `--url <url>`: Run against a development server that is already running instead of starting one, for example `lowdefy test --url http://localhost:3000` while `lowdefy dev` is open in another terminal. This is the fastest way to iterate on a journey.
- `--port <port>`: The port to start the development server on. If it is in use the next free port is taken. The default is `3000`.
- `--config-directory`, `--dev-directory`, `--ref-resolver`, `--log-level`, `--disable-telemetry`: As for [`lowdefy dev`](/cli#dev).

### Exit codes

| Exit code | Meaning                                                                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0`       | Every journey passed, or `tests/journeys/` has no journeys (a note is printed).                                                                                                                                                            |
| `1`       | At least one journey failed, a journey file was invalid, an explicit `--filter` matched no journey, or a `--journeys-directory` held no journeys. With `--repeat`, a journey was `FLAKY` or `FAIL`; with `--lint`, a lint error was found. |

A journey file that is not valid YAML, or does not match the journey format (a missing `name`, a step with two keys, an unknown step key, a step the grammar refuses, named by its index) is reported as a failed journey with the validation message and the file path. It never aborts the run, so one broken file cannot hide the results of the others.

## Candidates from recorded traces

Journeys can be compiled from real use. A recorded trace is a JSONL file of interactions (what was clicked, typed or pressed, on which block) joined to what the app did in response. Recorded traces live under `.lowdefy/traces/<source>/` in your config directory, one directory per source: `dev` for your own clicks in the development server, `explorer` for automated walks, and `production` for analytics from your users. `.lowdefy/` is not committed.

`lowdefy journeys compile` turns a pile of traces into candidate journeys:

```
pnpx lowdefy@5 journeys compile .lowdefy/traces/dev/2026-10-03/*.jsonl
```

Without trace files, `--source dev` or `--source explorer` reads every recording under `.lowdefy/traces/<source>/` (narrowed by `--since`):

```
pnpx lowdefy@5 journeys compile --source dev --since 2h
```

It cuts each browser tab's recording into segments (a fresh page load starts one), groups segments that do the same thing step by step, and writes one candidate per group to `tests/journeys/_candidates/<source>/<pageId>-<hash>.yaml`, ranked by how often the flow happened and how often it failed. `lowdefy test` does not read `_candidates/`, so candidates never run until you move them.

```yaml
# Recorded candidate, compiled by `lowdefy journeys compile`.
# ...
# origin:
#   source: dev
#   sequence_hash: 1a2b3c4d
#   sessions: 3
#   failures: 1
#   failure: tickets.save.onClick
#   ...
name: tickets recorded 1a2b3c4d
pageId: tickets
steps:
  - fill: { blockId: title, value: Printer jam, from: recorded }
  - select: { blockId: priority, value: High }
  # failed here: RequestError in Request (pages.tickets.blocks.4.events.onClick.0)
  - click: save
```

Every click, fill, pick and key press becomes a step, whether or not it ran an event. An event adds what to check: a `wait` for the last request it called and, for dev and explorer traces, `expect.state` for the state it wrote. A failing event ends the candidate at its step, so the candidate is a failing test until the bug is fixed. Date and object inputs, which no journey step drives, become a comment asking you to write that step by hand.

Values typed in production are never recorded, so production candidates carry `from: shape` placeholders, and a button or row label from production is kept only when at least 5 different people (in at least 2 organisations, when the traces hold several) clicked it.

To promote a candidate, move it into `tests/journeys/`, give it a name, fill every `from: shape` placeholder and review the `from: recorded` values. Compiling again updates only the origin comment of a candidate that already exists, so your edits survive.

### Options

- `[traceFiles...]`: The trace files to compile, wherever they are. Without them, `dev` and `explorer` recordings are read from `.lowdefy/traces/<source>/`.
- `--source <production|dev|explorer>`: Compile only records of this source. Required when no trace files are given; with files, the source comes from the records. `--source production` with no files reads the cache [`lowdefy journeys pull posthog`](#production-journeys) writes, and fails naming the pull to run when a day of the window is missing. Journey runs (`journey` traces) are coverage, not candidates, and are refused.
- `--since <since>`: Only records at or after this time, as a duration back from now (`30m`, `2h`, `7d`) or an ISO date. Production traces default to the last 30 days.
- `--from <YYYY-MM-DD>`, `--to <YYYY-MM-DD>`: Production only. An explicit window of whole UTC days instead of `--since`.
- `--build <id|current>`: Only segments whose records all ran on this build. `current` is the build the running development server for the app serves, which changes with every config edit; with no server running, the newest build in the records is used and the command says so.
- `--page <pageId>`: Only segments that visit this page.
- `--out <directory>`: Write candidates here instead of `tests/journeys/_candidates`. The source is appended.
- `--config-directory`, `--dev-directory`, `--log-level`, `--disable-telemetry`: As for [`lowdefy dev`](/cli#dev).

The compiler reads block types from the development server's build (or a production build) to tell date and object inputs apart. Without a build it still compiles and warns once.

## Hardening journeys

A journey that passes does not prove much on its own: it may never check what its clicks did, it may pass only some of the time, and the edge cases around it are rarely written. These commands prove a journey is worth keeping.

### Replaying candidates

`lowdefy test --repeat 3 <paths>` runs each journey three times and classifies it:

```
PASS   member assigns an open ticket   (5 steps, 3/3, 2.1s each)
FLAKY  owner closes a ticket           (2/3 passed) run 2 failed at step 4 (click "close_submit"): ...
FAIL   admin bulk-imports contacts     (0/3) step 2 (click "import"): ... — fails every run: a finding, not a test to fix by retrying
```

A candidate, from any source, moves into `tests/journeys/` only after `--repeat 3` gives `PASS`. A `FLAKY` journey has a cause to fix, usually a missing `wait: { request }`, data that differs between runs, or a target that matches two elements; never add `wait: { ms }`. A `FAIL` is a finding: it breaks every time, so either the app has a bug or its behaviour changed.

Each run records what the journey exercised (the pages, requests, endpoints, events and blocks it touched) in `.lowdefy/test/exercised.json`, which the lints, `journeys harden` and `journeys variants` read. Only a run of the whole suite, once, records as the suite's journey run.

### Lint

`lowdefy test --lint [paths...]` checks journeys without running them. It reads data sets from their files, so it needs a server only for L7: when a journey runs on a data set with a `snapshot`, the development server (the running one, or a fresh headless one) builds the pages L7 reads. It prints one line per problem and exits `1` on any error:

```
L2  member assigns an open ticket  step 3 (click "assign_submit") is not followed by an expect or wait: { request } before step 4.
```

An **assertion step** is any `expect`, or a `wait: { request }`.

| Rule | Checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Severity |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| L1   | No placeholders: no `from: shape`, and no `fill` or `select` with `value: null`.                                                                                                                                                                                                                                                                                                                                                                                                                                           | error    |
| L2   | A `click`, `open` or `press` whose target ran a Lowdefy event (in the journey's newest measured run), and every `goto` and `back`, is followed by an assertion step before the next action or input. A click that ran no event (a tab header) is exempt, as are `fill` and `select`. Unmeasured, every action is checked.                                                                                                                                                                                                  | error    |
| L3   | No `wait: { ms }`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | error    |
| L4   | A journey whose newest run called a request or endpoint that writes declares `data:`. Unmeasured, it is a warning to run the journey once.                                                                                                                                                                                                                                                                                                                                                                                 | error    |
| L5   | `user` names a user from the journey's data set, or is `none`. An inline user object, or no `user`, is a warning until the journey moves onto a data set.                                                                                                                                                                                                                                                                                                                                                                  | warning  |
| L6   | The last step is an assertion step.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | error    |
| L7   | On a data set with a `snapshot`, no value comes from the snapshot. Every `select` value, target `text` or `containing`, `expect.text` `contains`, `expect.title`, string in `expect.state` `equals` and `urlQuery` value must be text from the visited pages' config, the menus or the default locale's messages, a fixture or user value, or a value an earlier `fill` typed. A `fill` value found only in the pulled snapshot fails (skipped when it is not pulled here), and so does a grid `row` without `containing`. | error    |

A snapshot is pulled per developer, at different times, from a database others keep editing, so a journey that selects or asserts a snapshot value passes on one machine and fails on another; L7 keeps those values out. Journeys on fixtures-only data sets skip L7. A candidate compiled by `lowdefy journeys compile`, with event-less clicks and a final `wait: { request }`, lints without errors.

### Mutants: `lowdefy journeys harden`

`lowdefy journeys harden` measures whether your journeys fail when the feature they walk breaks. It breaks the config on purpose, one small change at a time and only in the journeys' own browsers, while you keep working in the same development server: your own tabs keep seeing the unchanged app.

1. Each selected journey runs once, unchanged. One that fails is left out, with a note to replay it.
2. The development server lists the mutants on what those runs exercised: a dropped action, a skipped validation, a flipped `visible` or `disabled`, swapped `_if` branches, a dropped payload key, a `Link` sent to `404`, a dropped block, a dropped endpoint step. A layout or template copied into several pages is mutated once.
3. Each mutant runs against every journey whose path reached it: a journey that fails **kills** it; one that passes lets it **survive**.

```
page tickets:
SURVIVED  drop-action   pages/tickets.yaml:88   drop-action SetState "set_status" (2 of 3) from assign_submit.onClick
          ran: member assigns an open ticket (passed)
SURVIVED  drop-block    pages/tickets.yaml:141  drop-block Alert "assign_success" from tickets
          ran: member assigns an open ticket (passed)
SCORE     12/14 killed, 3 unique  member assigns an open ticket  (tests/journeys/tickets.yaml)
42 mutants run · 38 killed · 4 survived · 0 unapplied · 0 errors · sampled 42 of 42 (seed 0) · 19 not exercised · 0 rebuilds · 3m 10s
```

A survivor is a change no journey noticed, with the source line it changed: add the assertion that would catch it (`expect.text` of the message, `expect.state`, `expect.visible`, `expect.hidden` or `expect.calls`) after the step that exercises it, and confirm with `lowdefy journeys harden --mutant <id>`. A mutant listed as **unapplied** never reached the journey's browser: that is a defect in harden, not a gap in the journey. Mutants no journey exercised are counted, not run.

The report is written to `.lowdefy/test/mutation.json`: each mutant with the journeys that ran it, the suite's score, and each journey's `killed` out of `total` and its `unique` kills (mutants no other journey kills). Survivors are findings, so the exit code is `0`; it is `1` only when the run could not finish. Editing the config during a run is fine: harden re-lists the mutants, keeps the verdicts no changed file touched and runs the rest again. The third change in one run stops it. harden never writes or deletes a journey.

- `[paths...]`, `--filter <name>`: The journeys to harden, as for `lowdefy test`.
- `--page <pageId...>`: Only mutants on these pages, and the endpoint mutants a journey touching them called.
- `--operators <list>`: Only these operators, comma separated: `drop-action`, `skip-validate`, `flip-visible`, `swap-if`, `drop-payload`, `retarget-link`, `drop-block`, `drop-step`.
- `--max <n>`: Run at most `n` mutants, sampled the same way on every machine. The default is 200; `0` runs every mutant.
- `--seed <n>`: The sample's seed. Another seed draws another sample, so repeated runs can cover the rest. The default is `0`, recorded in the report.
- `--workers <n>`: How many journey runs at once, 1 to 16. The default is `4`. A journey never runs beside itself, and one that reads email runs alone.
- `--list`: Print the sampled mutants per operator and page and a time estimate, and run nothing.
- `--mutant <id>`: Run only this mutant, against the journeys on its path. The report file is left as it is.
- `--json`: Print the report as JSON.
- `--url`, `--port`, `--config-directory`, `--dev-directory`, `--ref-resolver`, `--log-level`, `--disable-telemetry`: As for `lowdefy test`.

### Variants: `lowdefy journeys variants`

`lowdefy journeys variants <file>` writes edge-case candidates of a journey to `tests/journeys/_candidates/variants/<file>-<kind>.yaml` and replays each three times. The same journey always gives the same files.

| Kind            | The variant                                                                                                                                                                                                                                                                        | Passes when                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `role`          | Granted: for each other role set (the page's role matrix from `journeys coverage`, else each data set user's role set), the same steps as a data set user with exactly that set. Refused: when the page has `auth.roles` and a data set user holds none, that user opens the page. | Granted: that role can do the flow. Refused: the user lands on `/404` and does not see the journey's first block |
| `tenant`        | A user of another organization (with the same roles when one exists) walks to the first step that uses a fixture value, waits for their own organization's row there, then checks each of this organization's fixture values is hidden.                                            | The other organization sees its own rows and none of this one's                                                  |
| `empty`         | The journey's user, by name, on the `--empty-data` data set, up to the first step that uses data, then that step's block is visible.                                                                                                                                               | The page renders its empty state                                                                                 |
| `volume`        | The same steps, as the journey's user by name, on the `--volume-data` data set.                                                                                                                                                                                                    | The flow completes within its timeouts                                                                           |
| `negative`      | For each `fill` before the submit click on a block with `required` or a `validate` rule: the field left empty (or a placeholder to fill, for a `validate` rule), then the submit.                                                                                                  | The message shows and nothing is sent                                                                            |
| `interrupt`     | A full reload of the start page just before the submit click, then the flow again.                                                                                                                                                                                                 | The flow writes exactly once                                                                                     |
| `double-submit` | The submit click as a double click (`count: 2`).                                                                                                                                                                                                                                   | The write happens once                                                                                           |

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

A variant that passes is a candidate to keep; one that fails is a finding, a bug or a behaviour to assert as expected; a flaky one has a cause to fix. The `role` and `tenant` kinds read the journey's data set file; a variant whose input is missing (no user with a role set, no fixture for the other organization, no `--empty-data`) is listed as skipped with what to add.

- `--name <journey>`: The journey to vary, when the file holds several.
- `--kinds <list>`: Only these kinds, comma separated.
- `--empty-data <name>`: The data set the `empty` variant runs on. It needs a user with the journey user's name.
- `--volume-data <name>`: The data set the `volume` variant runs on. It needs a user with the journey user's name.
- `--no-run`: Write the variants without replaying them.
- `--url`, `--port`, `--config-directory`, `--dev-directory`, `--log-level`, `--disable-telemetry`: As for `lowdefy test`.

## Dev recordings

`lowdefy dev` records how you use your app in the browser, so an agent can turn what you just tried into journeys. Recording is on by default and stays on your machine:

- Every tab you open on the development server records its clicks, typed values, key presses and page views, joined to the events they ran and the state those events wrote, to `.lowdefy/traces/dev/<date>/<session>.jsonl` in your config directory. `.lowdefy/` is not committed.
- Values you type are kept, so a recording can include data your app shows you. Password fields are never recorded: their values, and the state they write, are replaced with `null`.
- Recordings are kept for 7 days or 200 MB, whichever comes first. The development server deletes older ones at start and then every hour.
- Set `LOWDEFY_DEV_RECORD=false` in your shell or in the app's `.env` to turn recording off. Old recordings are still pruned.

`lowdefy test` records too, as `journey` traces under `.lowdefy/traces/journey/`, but only when it runs the whole suite once: no journey paths, no `--filter`, and only the first of `--repeat` runs. Those traces show what the suite actually drives. Screenshots, state inspection and other agent tools never record.

`lowdefy journeys recordings` lists what was recorded, newest first: when each session ran, against which build, the pages it visited, how many attempts ended in an error, and how many of its interactions the newest test run already drove.

```
14:03–14:21   build 14:02   tickets → ticket → tickets   3 attempts, 1 failed (Validate on assign_submit: assignee)   4/11 interactions already covered by tests
13:40–13:44   build 13:31   settings   1 attempt   0/3 interactions already covered by tests
```

- `--since <since>`: Only sessions at or after this time, as a duration back from now (`30m`, `2h`, `7d`) or an ISO date.
- `--page <pageId>`: Only sessions that visited this page.
- `--build <id|current>`: Only sessions recorded against this build. `current` is the build the running development server serves.
- `--json`: Print the sessions as JSON, for agents.

`lowdefy agent-setup` installs a `journeys-from-dev` skill that uses these commands: it compiles the session you pick with `lowdefy journeys compile --source dev`, runs each candidate three times with `lowdefy test --repeat 3`, and leaves the candidates that pass for you to keep.

## Production journeys

Journeys can be mined from what your users do in production. Apps that send analytics with the [PostHog plugin](/PostHog) can pull them to your machine, compile candidates from them, and see which journeys real use backs and what it does that no journey covers.

```
pnpx lowdefy@5 journeys pull posthog --since 30d
pnpx lowdefy@5 journeys compile --source production --since 30d
pnpx lowdefy@5 journeys coverage --source production
pnpx lowdefy@5 journeys evidence --refresh
```

[`journeys pull posthog`](/cli#journeys-pull-posthog) needs `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST` and your own `POSTHOG_PERSONAL_API_KEY` with the Query Read scope. It writes one file per UTC day to `.lowdefy/traces/production/`. What it keeps:

- No value a user typed. PostHog never captures one, so a production candidate's `fill` steps carry `from: shape` placeholders for you to fill from your test data.
- Person and organisation ids hashed with a salt that never leaves your machine, so counts of people and organisations are the same on every machine while no raw id is stored.
- Page URLs with query parameter names only (`/tickets?id=&tab=`), never their values.
- The text of the clicked element, as PostHog already holds it. It stays in `.lowdefy/`, which is not committed, and the compiler keeps a text target only when enough different people clicked it.

### Evidence

A committed journey can carry how much production use backs it:

```yaml
- name: member assigns an open ticket to a teammate
  pageId: tickets
  evidence:
    production:
      sessions: 412 # sessions that did what this journey does
      persons: 37
      orgs: 9 # 0 when the app sends no organisation
      share: 0.31 # of the sessions entering on pageId
      failures: 14 # backing sessions that hit a failed event
      window: 2026-09-03/2026-10-02
    dev: { recordings: 2 } # dev sessions of the last 7 days that did it
    mutation: { killed: 11, total: 12, unique: 2 }
    refreshed: 2026-10-03
  steps:
    - click: assign
```

A session backs a journey when it does the journey's interactions in the same order, other clicks in between allowed, starting on the journey's page. Only [`lowdefy journeys evidence --refresh`](/cli#journeys-evidence) writes the key, and it changes nothing else in the file: comments, key order and quoting stay as they are. `lowdefy test` reads it to print the PASS line and validates it strictly, so a typo in a hand edit fails before the browser opens. `dev.recordings` counts the [dev recordings](#dev-recordings) of the last 7 days that back the journey, by the same rule. `dev`, `explorer` and `mutation` subkeys whose source is not on your machine keep their committed values; `mutation` is filled from a hardening run's report in `.lowdefy/test/mutation.json` when there is one.

No command removes a journey for lack of production use. A 30-day window cannot see quarterly or yearly work, and a journey that is the only one to catch a mutant matters whatever its traffic. `journeys evidence` lists the journeys nothing backs, beside their mutation numbers, and leaves the decision to you.

### Coverage

[`lowdefy journeys coverage --source production`](/cli#journeys-coverage) reports five measures, each as covered out of total with the uncovered items ranked by use:

| Measure     | Counts                                                            | Covered when                                                          |
| ----------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| Interaction | each interaction in production sessions, by how often it happened | a journey does the same interaction on the same page                  |
| Flow        | production sessions                                               | a journey is backed by the session                                    |
| Failure     | distinct failed events (page, block, event, invalid fields)       | a passing journey produced the same failed event (see below)          |
| Frustration | rage- and dead-clicked blocks                                     | a journey clicks the block and asserts with an `expect` right after   |
| Role        | (page, role set) pairs seen in production                         | a journey visiting the page runs as a user with exactly that role set |

Coverage also reads the newest full test run that the development server recorded (a plain `lowdefy test`, or `lowdefy_run_tests` with no paths or filter). The interaction measure then adds a measured share beside the static one: the production interactions that run actually drove. Failure coverage becomes measured: a failure counts as covered when a journey that passed in that run produced the same failed event, because a journey that reaches a failure and still passes asserts it. The test runner keeps which journeys passed in `.lowdefy/test/run.json`. Without a recorded run, failure coverage is reported as reached: a journey does the interaction that failed, which does not show it checks the outcome.

It writes the measures, a production profile (the top flows per entry page, failure paths, frustrated blocks, role sets per page and entry pages) and each journey's interactions to `.lowdefy/test/coverage.json`, which is rewritten on every run and not committed. With a mutation report, the suite's mutation score is added as a sixth number.

`lowdefy agent-setup` installs a `journeys-from-production` skill that runs this loop with you: it pulls, compiles and reads the coverage report, then takes uncovered failures first and flows next, one at a time. For each it shows you the flow and waits, fills typed values from your data set's fixtures, runs the candidate three times with `lowdefy test --repeat 3`, and moves it into `tests/journeys/` when all three pass. It finishes with `lowdefy journeys evidence --refresh` and commits nothing. It never deletes a journey or suggests deleting one.

## Continuous integration

`lowdefy test` needs only Node.js, pnpm and a Chromium the dev server can launch. The dev server uses Playwright's `chromium-headless-shell`, which it downloads itself the first time a browser tool needs it, and falls back to an installed Google Chrome meanwhile. Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to turn the download off. In CI, install the shell up front, together with the system libraries it needs. A GitHub Actions job looks like:

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
      - run: pnpx playwright install --with-deps chromium-headless-shell
      - run: pnpx lowdefy@5 test
        env:
          LOWDEFY_DISABLE_TELEMETRY: true
```

Set the same environment variables (`.env` values, connection secrets) the app needs in dev, and make sure the database the journeys write to is a test database — journeys perform real actions against real requests.
