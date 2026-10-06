Config tests let you test a Lowdefy app in the same language you build it in. A **journey** is a YAML file that names a page, a user to act as, and a list of steps — click this block, fill that input, wait for a request, expect this state — and `lowdefy test` runs every journey in your app and reports which passed.

Journeys need no JavaScript, no Playwright setup and no separate test build. The runner boots your app's development server headless, drives each journey through the dev server's [journey route](/ai-agent-docs) (the same one the `lowdefy_run_journey` MCP tool uses), and prints a pass/fail line per journey. Because the format is declarative, an AI coding agent can write a journey for a page it just changed, run it, and read the failing step.

> Config tests run against the **development server**. For tests against a production build, or tests that need custom browser code, use the Playwright based [e2e testing](/e2e-introduction) toolkit instead.

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

Files run in path order, and journeys run one at a time — each journey opens its own browser context, but they all share your app's database, so parallel journeys would interfere with one another.

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

| Field        | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`       | Yes      | A short description. `--filter` matches against it, and it is printed in the results.                                                                                                                                                                                                                                                                                                                                                                         |
| `pageId`     | Yes      | The page to open.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `user`       | No       | The user to act as, as an inline user object such as `{ sub: u1, roles: [admin] }`. Leave it out to run as the default roleless headless user, or as `auth.dev.mockUser` when one is active; a `user` given here wins over the mock user. On a journey with `data`, the name of one of the data set's users, such as `member`, or a list of them, such as `[admin, member]`, to [run the journey once as each](/journey-data-sets#one-journey-several-users). |
| `data`       | No       | A [data set](/journey-data-sets) name. The journey runs against a fresh in-memory MongoDB database of its own, loaded with the data set, so it may write freely.                                                                                                                                                                                                                                                                                              |
| `urlQuery`   | No       | An object appended to the page URL as a query string, for pages that read `_url_query`.                                                                                                                                                                                                                                                                                                                                                                       |
| `pathParams` | No       | An object of strings, one per placeholder of the page's [`path`](/page-paths), for pages that read `_path_params`. Leave it out for a page whose path has no placeholders.                                                                                                                                                                                                                                                                                    |
| `tags`       | No       | A list of tags naming the sections of the suite the journey belongs to, such as `[smoke, review]`. `lowdefy test --tag smoke` runs the journeys tagged `smoke`. Tags are lowercase letters, digits, `-` and `_`.                                                                                                                                                                                                                                              |
| `steps`      | Yes      | At least one step. Each step is an object with exactly one key from the step grammar below.                                                                                                                                                                                                                                                                                                                                                                   |

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

| Step                                      | Meaning                                                                                                                                                                                                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `click: target`                           | Click the block, or the control a [target](#targets) narrows to.                                                                                                                                                                                                                  |
| `click: { ...target, count: 2 }`          | Click 2 (or 3) times in quick succession, as a person's double click, before the runner waits for the page to settle. `count` defaults to 1.                                                                                                                                      |
| `open: target`                            | Open an input's dropdown or picker popup (Selector, MultipleSelector, AutoComplete, DateSelector, Cascader...) and wait for it to show, so a following `screenshot` or `select` sees the options. A block with no popup is clicked; one whose click opens nothing fails the step. |
| `fill: { blockId, value }`                | Type `value` into the input inside the block (or the grid cell a target names).                                                                                                                                                                                                   |
| `fill: { blockId, fromEmail }`            | Type text read from an [email](#emails) instead of a fixed value, such as a one-time sign-in code. The actor stays on the page.                                                                                                                                                   |
| `select: { blockId, value }`              | Open the selector block (or grid cell) and choose the option whose text is `value`. A radio, button or segmented selector's option is clicked by its label.                                                                                                                       |
| `press: Enter`                            | Press a key or chord. `Mod` in a chord (`Mod+k`) resolves to Cmd on macOS and Ctrl elsewhere.                                                                                                                                                                                     |
| `back: true`                              | Go back one page, like the browser's Back button. Fails when the journey has not navigated from an earlier page.                                                                                                                                                                  |
| `goto: pageId`                            | Load a page the way a typed URL does; `{ pageId, pathParams, urlQuery }` adds the values of a [page path](/page-paths)'s placeholders and a query string. A protected page may redirect (to sign in), so assert where it landed.                                                  |
| `email: { to, subject }`                  | Open the newest [email](#emails) to `to` — with a subject containing `subject`, when given — that arrived during the journey, waiting for it if needed.                                                                                                                           |
| `as: name`                                | Act as [another person](#several-people), each in their own browser. The journey starts as `main`. On a journey with `data`, the name is `main` or one of the data set's users.                                                                                                   |
| `wait: { ms }`                            | Pause for `ms` milliseconds.                                                                                                                                                                                                                                                      |
| `wait: { request: requestId }`            | Wait until the request has been called since the last interaction (`click`, `open`, `fill`, `select`, `press`, `back`, `goto` or `as`; the page open before the first) and has finished loading. A call the page made before that interaction does not count.                     |
| `wait: { state: path }`                   | Wait until the state value at `path` is defined.                                                                                                                                                                                                                                  |
| `screenshot: name`                        | Capture a screenshot. Screenshots are returned to agents using the MCP tool; the CLI runner ignores them.                                                                                                                                                                         |
| `expect: { state: { path, equals } }`     | The page state at `path` deep-equals `equals`. A path that does not exist reads as `null`, so `equals: null` also passes for a misspelt path.                                                                                                                                     |
| `expect: { visible: target }`             | The block, or the control a target narrows to, is visible.                                                                                                                                                                                                                        |
| `expect: { hidden: target }`              | Nothing the target names is visible: no element matches, or every match is hidden. Passes at once when nothing matches yet, so pair it with a presence.                                                                                                                           |
| `expect: { calls: { request, count } }`   | This person's browser called the request `count` times since the journey started, counted once the page settles. `pageId` names the request's page.                                                                                                                               |
| `expect: { calls: { endpoint, count } }`  | The same for an endpoint called with `CallAPI`. Counts survive full page loads, so `count: 0` after a reload checks a write was never sent.                                                                                                                                       |
| `expect: { text: { blockId, contains } }` | The block's rendered text (or a grid row's or cell's) contains the string.                                                                                                                                                                                                        |
| `expect: { url: { contains } }`           | The browser URL contains the string. It checks where the browser landed and never names a page: open a page with `pageId` or `goto`, with its `pathParams`.                                                                                                                       |
| `expect: { title: { equals } }`           | The document title (the browser tab's text) is exactly the string; `{ contains }` checks part of it.                                                                                                                                                                              |
| `expect: { error: text }`                 | The interaction just before it raised an [app error](#app-errors) whose message contains `text`. Must directly follow a click, open, fill, select, press or back.                                                                                                                 |
| `expect: { effect: true }`                | The interaction just before it did something. Must directly follow a click, open, fill, select, press or back.                                                                                                                                                                    |

`expect.calls` takes `{ request: requestId, pageId, count }`: request ids are scoped to a page, and two pages often share one such as `save`, so `pageId` names the page; it defaults to the page the person is on when the step runs. It compares once, without waiting for the count to change, because "not called" can only be judged after the moment has passed.

Before a step runs, every block, request, endpoint and `goto` page it names is checked against the app's build, and so is an `as` name on a journey with `data`. A misspelt one fails the step and names it, so `expect: { hidden: nosuchblock }` or `expect: { calls: { request: nosuchrequest, count: 0 } }` cannot pass by finding nothing. Blocks and requests are looked for on the page the person is on, and blocks also on the page the journey opened, so a step on a page that sent the person elsewhere still fails as not visible. A block inside a List matches by its `$` id, so `rows.0.name` matches `rows.$.name`, and a block of [dynamic page content](/dynamic-page-content) matches once the page shows it; `expect.state` paths are not checked.

`expect.effect` fails when the interaction before it ran no event, changed nothing on the page, called no request or endpoint and left the URL as it was. It reads what the runner saw during that interaction, so it does not wait. The journey explorer writes it after a click that did nothing, so the journey fails until the control does something.

### App errors

A journey also fails at the step that causes an app error, even when every expectation after it holds. An app error is:

- an action that fails with an error, such as a `Request` or `CallAPI` whose request throws, or an operator that throws,
- an uncaught exception in the page, or an error the page reports to the dev server,
- a request or endpoint that throws on the server, or answers with a 5xx.

Errors raised while the journey's first page opens (its `onInit` and `onMount` requests) fail the journey `on open`, before any step runs. Expected outcomes never fail a journey: a failed `Validate`, a `Throw` action or any other user error, and a 401 or 403 refusal. Only errors the journey's own browsers cause count: an error you raise in your own tab on the same dev server while journeys run does not fail them, and a journey's errors are reported in its result, not in the dev server's build status.

```
FAIL  member saves a ticket
      file: /my-app/tests/journeys/tickets.yaml
      step 2: { click: save }
      server-error  MongoDB: MongoDB rejected the MongoDBInsertOne command.  pages/tickets.yaml:42
      action-error  Request "save_ticket" failed in save.onClick with ServiceError.  pages/tickets.yaml:88
```

Each error line gives its kind, its message and the config file and line it came from, when known. Fix the app in most cases. When the error is the outcome the app means, such as a unique index violation that a `catch` action shows as "already exists", either make it a user error in config (a `Throw` action is one), or assert it with `expect: { error: text }` straight after the interaction:

```yaml
- click: save
- expect: { error: duplicate key }
- expect: { visible: already_exists }
```

The expectation claims the errors of that interaction whose message contains `text`, with the failed action that reported them, and fails when none matches. Any other error the interaction raised still fails it.

### Recorded values: `from`

`fill`, `select` and `expect.state` take an optional `from`, which marks a value taken from a recording, as the explorer's candidates do:

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
| `nth`        | When several elements match, the zero-based one to use.                                                     |

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

With no options, `lowdefy test` prepares `.lowdefy/dev` exactly as `lowdefy dev` does, starts the development server on a free port without opening a browser, runs every journey, prints the results and stops the server.

Journeys run on your machine, never in CI. `lowdefy test` needs only Node.js, pnpm and a Chromium the dev server can launch. The dev server uses Playwright's `chromium-headless-shell`, which it downloads itself the first time a browser tool needs it, and falls back to an installed Google Chrome meanwhile. Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to turn the download off.

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
PASS  member creates a control  (5 steps, 1840ms)
FAIL  guest sees the empty state
      file: /my-app/tests/journeys/controls.yaml
      step 0: { expect: { visible: empty_state } }
      expected: block "empty_state" to be visible
      actual:   Timeout 5000ms exceeded.
1 passed, 1 failed of 2 journeys
```

A failing journey stops at its first failing step and prints the step's index, the step itself, and the `expected` and `actual` values. Steps after the failure are not run.

A journey with production [evidence](#evidence) prints its tier, its rank in the run's selection, its rate and its failures over the usage window after its `PASS` line, then its mutants:

```
PASS  member assigns an open ticket  (5 steps, 2100ms)  common #2 · 13.7/day · 14 failed (3m) · 11/12 mutants
PASS  member reopens a ticket  (4 steps, 1650ms)  unranked
```

`unranked` marks a journey with no counts for its current steps yet. A run without `--tier` never builds config to rank journeys, so a journey that clicks a data value (a grid row by its name) also shows `unranked` there; `--tier common`, `wide` or `edge` ranks it. With fewer than 100 journey matches in the usage window there is no ranking, and the line shows the rate and failures with no tier or rank. Persons and organisations are left out, since they do not add up across months; [`lowdefy journeys usage`](/cli#journeys-usage) shows them month by month. The mutants part is left out when there is no mutation report. `FAIL` lines carry no evidence.

A journey with `deprecated: true` is never run, even when named by path or `--filter`. It is listed with its recent rate, and the closing line counts it:

```
SKIP deprecated  member prints a ticket  0.4/day (3m)
```

### Options

- `[paths...]`: Journey files, directories or globs to run instead of the whole suite, anywhere under the config directory, including the candidates in `tests/journeys/_candidates/`. A directory is read with all its sub-folders: `lowdefy test tests/journeys/_candidates/variants` runs every variant. A path containing `*`, `?` or `[` (including `**`) is a glob the CLI expands itself, so quote it: `lowdefy test 'tests/journeys/review/*.yaml'`. A glob that matches nothing is refused, like a path that does not exist. `--tag` and `--filter` apply on top.
- `--tag <tag>`: Only run journeys whose `tags` include the tag. Repeat it to run the journeys carrying any of the tags: `lowdefy test --tag smoke --tag review`.
- `--filter <name>`: Only run journeys whose `name` contains the string (case-insensitive). `lowdefy test --filter control` runs every journey with "control" in its name. Repeat it to run the journeys matching any of the strings.
- `--tier <tier>`: Only run the journeys in this popularity tier of the selection: `common` (p50), `wide` (p80), `edge` (p95) or `full` (every journey, the default). See [Usage and tiers](#usage-and-tiers).
- `--usage-window <months>`: The calendar months recent use is ranked over, for `--tier` and the `PASS` line, such as `6m`. The default is `3m`.
- `--repeat <n>`: Run each journey `n` times in a row (1 to 10) and classify it, as described in [Replaying candidates](#replaying-candidates).
- `--lint`: Check the journeys for the [lint rules](#lint) and run nothing.
- `--journeys-directory <path>`: Read journeys from this directory instead of `tests/journeys/`, for journeys that need a server set up for them, such as [auth journeys](#the-database). A relative path is resolved from the current directory. The run fails when the directory holds no journeys.
- `--url <url>`: Run against a development server that is already running instead of starting one, for example `lowdefy test --url http://localhost:3000` while `lowdefy dev` is open in another terminal. This is the fastest way to iterate on a journey.
- `--port <port>`: The port to start the development server on. If it is in use the next free port is taken. The default is `3000`.
- `--config-directory`, `--dev-directory`, `--ref-resolver`, `--log-level`, `--disable-telemetry`: As for [`lowdefy dev`](/cli#dev).

### Exit codes

| Exit code | Meaning                                                                                                                                                                                                                                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`       | Every journey passed, or `tests/journeys/` has no journeys (a note is printed).                                                                                                                                                                                                                                                   |
| `1`       | At least one journey failed, a journey file was invalid, a path, glob, `--tag` or `--filter` matched no journey, or a `--journeys-directory` held no journeys. With `--repeat`, a journey was `FLAKY` or `FAIL`; with `--lint`, a lint error was found; with `--tier`, the selection had too little production use to cut a tier. |

A journey file that is not valid YAML, or does not match the journey format (a missing `name`, a step with two keys, an unknown step key, a step the grammar refuses, named by its index) is reported as a failed journey with the validation message and the file path. It never aborts the run, so one broken file cannot hide the results of the others.

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

Each run records what the journey exercised (the pages, requests, endpoints, events and blocks it touched) in `.lowdefy/test/exercised.json`, which the lints, `journeys harden` and `journeys variants` read. Only a run of the whole suite, once, records as the suite's journey run.

### Lint

`lowdefy test --lint [paths...]` checks journeys without running them. It reads data sets from their files and needs no server. It prints one line per problem and exits `1` on any error:

```
L2  member assigns an open ticket  step 3 (click "assign_submit") is not followed by an expect or wait: { request } before step 4.
```

An **assertion step** is any `expect`, or a `wait: { request }`.

| Rule | Checks                                                                                                                                                                                                                                                                                                                    | Severity |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| L1   | No placeholders: no `from: shape`, and no `fill` or `select` with `value: null`.                                                                                                                                                                                                                                          | error    |
| L2   | A `click`, `open` or `press` whose target ran a Lowdefy event (in the journey's newest measured run), and every `goto` and `back`, is followed by an assertion step before the next action or input. A click that ran no event (a tab header) is exempt, as are `fill` and `select`. Unmeasured, every action is checked. | error    |
| L3   | No `wait: { ms }`.                                                                                                                                                                                                                                                                                                        | error    |
| L4   | A journey whose newest run called a request or endpoint that writes declares `data:`. Unmeasured, it is a warning to run the journey once.                                                                                                                                                                                | error    |
| L5   | `user` names a user from the journey's data set (or a list of them, each checked), or is `none`. An inline user object, or no `user`, is a warning until the journey moves onto a data set.                                                                                                                               | warning  |
| L6   | The last step is an assertion step.                                                                                                                                                                                                                                                                                       | error    |

A journey written from a [session log](#session-logs), with event-less clicks and a final `wait: { request }`, lints without errors.

### Mutants: `lowdefy journeys harden`

`lowdefy journeys harden` measures whether your journeys fail when the feature they walk breaks. It breaks the config on purpose, one small change at a time and only in the journeys' own browsers, while you keep working in the same development server: your own tabs keep seeing the unchanged app.

Only journeys with a [data set](/journey-data-sets) (`data:`) are hardened: mutant runs write through the app's connections from parallel workers, and without a data set that is your own database. A selected journey with no `data:` is left out with an error naming it; when none is left, harden exits `1`.

1. Each selected journey runs once, unchanged. One that fails is left out, with a note to replay it.
2. The development server lists the mutants on what those runs exercised: a dropped action, a skipped validation, a flipped `visible` or `disabled`, swapped `_if` branches, a dropped payload key, a `Link` sent to `404`, a dropped block, a dropped endpoint step. A layout or template copied into several pages is mutated once.
3. Each mutant runs against every journey whose path reached it: a journey that fails with the mutant applied **kills** it; one that passes lets it **survive**. A failure where the mutant never reached the run says nothing about the mutant: it counts as an error and runs once more.

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

The report is written to `.lowdefy/test/mutation.json`: each mutant with the journeys that ran it, the suite's score, and each journey's `killed` out of `total` and its `unique` kills (mutants no other journey kills). It is merged per journey: a run over some journeys replaces their scores and keeps every other journey's from earlier runs, until that journey is removed. `--mutant` runs write nothing. Survivors are findings, so the exit code is `0`; it is `1` only when the run could not finish. Editing the config during a run is fine: harden re-lists the mutants, keeps the verdicts no changed file touched and runs the rest again. The third change in one run stops it. harden never writes or deletes a journey.

- `[paths...]`, `--filter <name>`: The journeys to harden, as for `lowdefy test` (one `--filter`, and no `--tag`).
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

`lowdefy journeys variants <file>` writes edge-case candidates of a journey to `tests/journeys/_candidates/variants/<source>/<journey>-<kind>.yaml` and replays each three times. `<source>` is the journey file's path under `tests/journeys/` (or under the config directory, for a file outside it) without its extension, so two files with one name in different folders never share a folder. `<journey>` is the journey's name in lower case with each run of other characters replaced by `-`, so the journeys of one file never share a file. A kind with several variants numbers them: `<journey>-negative-1.yaml`, `<journey>-negative-2.yaml`. The same journey always gives the same files.

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

Each file starts with a header line naming the journey file it came from and holding a hash of what was generated. A file belongs to that journey file and the journey its `variant.of` names. A rerun rewrites a file it owns that is left as generated, keeps one you edited (a filled-in placeholder, a fix after a flaky replay) and says so, and removes an unedited file it owns that the journey no longer gives. A file another journey owns (two journey names that give one slug) is left alone and reported as `CONFLICT`: rename one of the journeys. A variant that passes is a candidate to keep; one that fails is a finding, a bug or a behaviour to assert as expected; a flaky one has a cause to fix. A granted `role` variant that passes is kept by adding its user to the original journey's `user` list ([one journey, several users](/journey-data-sets#one-journey-several-users)) and deleting the variant file, so the steps stay in one place; its first comment names the list. A refused `role` variant expects a different outcome and is kept as a journey of its own. Variants of a journey with a list of users keep the list, and replay once per user. The `role` and `tenant` kinds read the journey's data set file; a variant whose input is missing (no user with a role set, no fixture for the other organization, no `--empty-data`) is listed as skipped with what to add.

- `--name <journey>`: The journey to vary, when the file holds several.
- `--kinds <list>`: Only these kinds, comma separated.
- `--empty-data <name>`: The data set the `empty` variant runs on. It needs a user with the journey user's name.
- `--volume-data <name>`: The data set the `volume` variant runs on. It needs a user with the journey user's name.
- `--no-run`: Write the variants without replaying them.
- `--url`, `--port`, `--config-directory`, `--dev-directory`, `--log-level`, `--disable-telemetry`: As for `lowdefy test`.

### The `journeys-harden` skill

`lowdefy agent-setup` installs a `journeys-harden` skill that runs this section with you. It replays the journeys and candidates three times, lints them, sizes a `journeys harden` run with `--list` and asks before it starts, then takes each surviving mutant to you one at a time with the assertion that would catch it, confirming each with `--mutant <id>` and `lowdefy test --repeat 3`. It writes variants for the journeys you pick, refreshes `journeys evidence`, and reports journeys with no production backing (with their mutation kills), duplicate journeys and pages no journey reaches. It never deletes a journey or suggests deleting one, writes no step except an assertion you approved, and commits nothing.

## Dev recordings

`lowdefy dev` records how you use your app in the browser, so an agent can read what you just tried and write journeys for it. Recording is on by default and stays on your machine:

- Every tab you open on the development server records its clicks, typed values, key presses and page views, joined to the events they ran and the state those events wrote, to `.lowdefy/traces/dev/<date>/<session>.jsonl` in your config directory. `.lowdefy/` is not committed.
- Values you type are kept, so a recording can include data your app shows you. Password fields are never recorded: their values, and the state they write, are replaced with `null`.
- Recordings are kept for 7 days or 200 MB, whichever comes first. The development server deletes older ones at start and then every hour.
- Set `LOWDEFY_DEV_RECORD=false` in your shell or in the app's `.env` to turn recording off. Old recordings are still pruned.

`lowdefy test` records too, as `journey` traces under `.lowdefy/traces/journey/`, but only when it runs the whole suite once: no journey paths, no `--tag`, no `--filter`, no `--tier` but `full`, and only the first of `--repeat` runs. Skipping `deprecated: true` journeys still counts as the whole suite. Those traces show what the suite actually drives. Screenshots, state inspection and other agent tools never record.

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

A session backs a journey when it does the journey's interactions in the same order, other clicks in between allowed, starting on the journey's page. A journey's click text counts only when it is text from your app's config: any other text reads as no text, so a click on a grid cell by a customer's name is backed by that column's clicks exactly as one with no text, and no command tells whether production showed that value. Only [`lowdefy journeys evidence --refresh`](/cli#journeys-evidence) writes the key, and it changes nothing else in the file: comments, key order and quoting stay as they are. `lowdefy test` reads it to print the PASS line and validates it strictly, so a typo in a hand edit fails before the browser opens. A refresh removes a `dev` key an older version wrote. `explorer` and `mutation` subkeys whose source is not on your machine keep their committed values; `mutation` is filled from a hardening run's report in `.lowdefy/test/mutation.json` when there is one.

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

The flow measure groups sessions into flows only when the window holds 100,000 rows or more, or with `--group`; otherwise it is left out, the summary says why, and you read the sessions with [`lowdefy journeys session --source production`](#production-session-logs). `--no-group` leaves it out at any size. The other four measures are always computed. Journeys with `deprecated: true` are left out of every measure: they are never run, so a flow only a deprecated journey walks reads as uncovered. Coverage has no tiers: its flows are counted over the mining window of at most 30 days, not by month, so they have no rate to rank by.

Coverage also reads the newest full test run that the development server recorded (a plain `lowdefy test`, or `lowdefy_run_tests` with no paths, tags, filter or tier). The interaction measure then adds a measured share beside the static one: the production interactions that run actually drove. Failure coverage becomes measured: a failure counts as covered when a journey that passed in that run produced the same failed event, because a journey that reaches a failure and still passes asserts it. The test runner keeps which journeys passed in `.lowdefy/test/run.json`. Without a recorded run, failure coverage is reported as reached: a journey does the interaction that failed, which does not show it checks the outcome.

It writes whether flows were grouped (`flowGrouping`), the measures, a production profile (the top flows per entry page when grouped, failure paths, frustrated blocks, role sets per page, entry pages, and per block and column the clicks, distinct clicked-text tokens and most-clicked tokens) and each journey's interactions to `.lowdefy/test/coverage.json`, which is rewritten on every run and not committed. With a mutation report, the suite's mutation score is added as a sixth number.

`lowdefy agent-setup` installs a `journeys-from-production` skill for your coding agent. The agent picks the window for the question and says why, pulls and measures, then reads each session's log (or, from 100,000 rows, the grouped flows) with the page's config, requests, actions and plugin code to decide what the person was doing and whether it deserves a journey: failures first, then routines that write data, move money, change access or end a process, then the rest by count. It writes each journey from what the session showed, filling typed values from your data set's fixtures and labels from your config, proves each with `lowdefy test --repeat 3`, refreshes evidence with `lowdefy journeys usage --json` read before and after, and reports what it wrote, what it skipped and why, the findings, the deprecated flows users still follow, and how the tiers moved. It reads tokens, never production text: it does not read the trace salt or your `.env`, and never queries PostHog directly. It asks you only about findings and dead clicks, commits nothing, and never deletes a journey or suggests deleting one. It never deletes a deprecated flow either; it may suggest you delete one that shows no use.

