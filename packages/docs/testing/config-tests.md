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

| Field      | Required | Description                                                                                                                                    |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`     | Yes      | A short description. `--filter` matches against it, and it is printed in the results.                                                          |
| `pageId`   | Yes      | The page to open.                                                                                                                              |
| `user`     | No       | The user to act as, as an inline user object such as `{ sub: u1, roles: [admin] }`. Leave it out to run as the default roleless headless user. |
| `urlQuery` | No       | An object appended to the page URL as a query string, for pages that read `_url_query`.                                                        |
| `steps`    | Yes      | At least one step. Each step is an object with exactly one key from the step grammar below.                                                    |

`user: none` injects no user at all, so the journey signs in through the app's own auth — see [Testing sign-up and sign-in](#testing-sign-up-and-sign-in).

## Steps

Blocks are addressed by their `blockId`. Every step has a 5 second timeout by default; a step that does not complete in time fails the journey.

| Step                                      | Meaning                                                                                                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `click: target`                           | Click the block, or the control a [target](#targets) narrows to.                                                                                            |
| `fill: { blockId, value }`                | Type `value` into the input inside the block (or the grid cell a target names).                                                                             |
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
| `expect: { text: { blockId, contains } }` | The block's rendered text (or a grid row's or cell's) contains the string.                                                                                  |
| `expect: { url: { contains } }`           | The browser URL contains the string.                                                                                                                        |
| `expect: { title: { equals } }`           | The document title (the browser tab's text) is exactly the string; `{ contains }` checks part of it.                                                        |

The full grammar, including the failure shape the route returns, is documented with the [journey tool](/ai-agent-docs). The CLI and the MCP tool share one implementation, so a journey an agent verifies interactively can be committed as-is.

### Targets

A `blockId` reaches a block's own control — its button, input or link. Some controls are not blocks: the Edit and Delete buttons a grid renders in every row, the OK and Cancel of a confirm dialog, the items of a dropdown menu. Wherever a step takes a `blockId`, it also takes a target object that narrows the search:

| Key       | Meaning                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------ |
| `blockId` | The block to search inside.                                                                      |
| `row`     | A grid row, zero-based as displayed (`AgGrid*` blocks). Needs `blockId`.                         |
| `column`  | A grid cell in that row, by the column's `field` or `colId`. Needs `blockId`.                    |
| `text`    | The interactive control whose visible text is exactly this (a button label, a tab, a menu item). |
| `nth`     | When several controls match, the zero-based one to use.                                          |

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

`fill`, `select` and `expect.text` always need a `blockId`; a value is typed into a block's input, never into a page-wide control. A target with a key the grammar does not know (`colum`) is rejected before the browser opens, so a typo cannot pass as a step that happened to find nothing.

## Testing sign-up and sign-in

A journey with `user: none` injects no user: it starts signed out, and the app's own auth decides who it is, exactly as in a real browser. Sign-up, email verification, sign-in, sign-out and organization switching all run for real, and the session cookie a sign-in sets carries through every later step.

```yaml
# tests/journeys/sign-up.yaml
- name: a new user signs up, verifies by email and signs in
  pageId: signup
  user: none
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

### Several people

`as: invitee` switches the journey to another person with their own browser and cookies: an owner and the person they invite, or a member whose session stays open while the owner removes them. The journey starts as `main`. The first `as` for a name opens the journey's page in a new browser, as the journey's `user`; switching back returns to that person's tab as they left it.

Each person also sends requests from their own client address, so auth rate limits (a few sign-in attempts per address every few seconds) count each person's attempts apart, as they would for people on different devices, instead of one budget for the whole run.

### The database

Journeys perform real sign-ups, so they need a database that starts empty and is never a real one. Run them against a fresh test database each time: a sign-up journey run a second time finds its address already registered, and no verification email is sent. Give each journey its own addresses, so journeys in one run do not collide.

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
