Your coding agent explores a pull request before it merges, and what it leaves behind is more of your suite. For each page the pull request changed, and each role that can open it, the agent looks at the page, reads its config and lists the goal of every path a user can take there. These are not only edge cases and problems, but also behaviour no journey documents yet. It writes one [journey](/config-tests) per goal and proves each one with `lowdefy test --repeat 3`:

- A journey that passes joins the suite in `tests/journeys/`.
- A journey that fails, with an [app error](/config-tests#app-errors) or because its goal is not met, is a **finding**. The agent reports it with that journey, which fails under `lowdefy test` until the bug is fixed and is the regression test after.

The agent never reports a finding without a journey that fails with it. What it thinks looks broken, or looks fine, is not a finding.

Exploring runs on pull requests only, with a person there to read the findings. It never runs nightly or in CI. The journeys it adds are what your app runs on its own schedule.

## With a coding agent

`lowdefy agent-setup` installs the `journeys-from-pr` skill. Ask your agent to explore a pull request, and it:

1. Reads the pull request with `gh pr view`, and works in a checkout at its head (it makes a worktree if this one is not).
2. Starts that checkout's dev server and runs `lowdefy journeys scope --base <the pull request's base branch> --json`.
3. For each page and role in the scope, takes a screenshot of the page and reads its config as one of the data set users that role allows, then writes down the goals.
4. Writes a journey per goal on a [journey data set](/journey-data-sets), with `name` and a `description` stating the goal, and runs each with `lowdefy test --repeat 3 <file>`.
5. Keeps the journeys that pass, and reports the ones that fail as findings, each with its journey file and failure. It asks you before it posts anything on the pull request.

**A bug bash** is the same skill given a goal sentence instead of a pull request, such as "try to break the invoice form with odd input". The agent takes the pages from the sentence, or from the pages you name, and explores them the same way.

## Journeys carry their goal

A journey's `name` is at most 100 characters. An optional `description`, at most 60 words, says what the journey proves. `lowdefy test` checks both, and does not print the description: it is for the people and agents who read the suite.

```yaml
# tests/journeys/invoices/send-reminder.yaml
name: a member sends a payment reminder for an overdue invoice
description: An overdue invoice shows a reminder button to members. Sending it records the reminder on the invoice and shows when it was sent.
pageId: invoice
data: invoices
user: member
pathParams:
  invoiceId: inv-overdue
steps:
  - click: send_reminder_button
  - wait: { request: send_reminder }
  - expect: { text: { blockId: reminder_sent, contains: 'Reminder sent' } }
```

## Clicks a data set journey refuses

Journeys on a data set never reach a real service. A click on a block whose events reach a connection the data set does not redirect (any connection that is not a `MongoDBCollection`), or run an auth action such as `Logout`, fails at that step and names the block and the connection or action. See [Clicks a data set journey refuses](/journey-data-sets#clicks-a-data-set-journey-refuses).

## lowdefy journeys scope

`lowdefy journeys scope` prints what a change touched: the pages, why each is in scope, and who can open it.

```bash
# The changes since the merge base with the pull request's base branch
lowdefy journeys scope --base origin/main

# As JSON, for an agent
lowdefy journeys scope --base origin/main --json

# Every page of the app, for a bug bash with no pull request
lowdefy journeys scope
```

| Option                  | Description                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `--base <ref>`          | Compare with the merge base of this branch or commit and `HEAD`. Without it, every page of the head is listed, with the reason `head`. |
| `--json`                | Print the scope as JSON instead of the summary.                                                                                        |
| `--config-directory`    | The app directory. Default is the current working directory.                                                                           |
| `--dev-directory`       | The installed dev server, whose builder builds both revisions. Default is `<config-directory>/.lowdefy/dev`.                           |
| `--ref-resolver <path>` | A `_ref` resolver function for both builds.                                                                                            |

The command needs no running dev server and no data set. It needs the dev server installed once (run `lowdefy dev` once in the app), because that is where the full builder and your plugins live.

### What is in scope

The scope builds the config twice in full: once at the base (the merge base with `--base`), once at the head (your working tree, uncommitted changes included). Both builds use the head's installed Lowdefy, so a version bump does not show up as a change. It strips the build's location markers before comparing, so moving a block down a file changes nothing.

A page is in scope when:

- its own config changed, or it is new (reason `page`);
- one of its requests changed, was added or was removed (`request:<requestId>`);
- it calls an endpoint, directly or through endpoints that call endpoints, whose config changed (`endpoint:<endpointId>`);
- a request or endpoint it reaches uses a connection whose config changed (`connection:<connectionId>`);
- it subscribes to a websocket source whose config changed (`websocket:<websocketId>`).

A change in a file that pages `_ref` shows on every page that refs it, with the reason `page`, and each changed block's `source` names that file and line.

A change to an **app-wide** artifact (app events, menus, global, app, config, i18n, theme, auth, dynamic policies or tenant targets) can affect any page. It adds the three pages most production sessions start on (from `.lowdefy/test/coverage.json`, see [Coverage](/config-tests#coverage)), or the home page, with the reason `app-wide`.

Removed pages are listed, not put in scope. Changes the diff cannot see (plugin code, notification or agent artifacts) are listed as "changed but not compared". The base is built with the plugins the head installs, so a plugin whose version changed is listed: its type changes are not in the diff. If the base cannot be built (for example, it lists a plugin the head no longer installs), every page is in scope (`base-not-built`) and the scope says why.

### Who can open each page

Each page in scope carries `roles`, read from the head build's page auth:

- `access`: `public`, `signed-in` (any signed-in user) or `roles` (a user holding one of `roles`);
- `users`: the users of every data set under `tests/data/` that the page admits, as `{ dataSet, user, roles }`. A journey on the page names one of them as its `user`.

### JSON output

```json
{
  "base": "1f643731f…",
  "head": "8741420c9…",
  "dirty": false,
  "pages": [
    {
      "pageId": "invoice",
      "reasons": ["page", "request:send_reminder"],
      "authChanged": false,
      "blocks": [
        {
          "blockId": "send_reminder_button",
          "type": "Button",
          "change": "added",
          "label": "Send reminder",
          "source": "pages/invoice.yaml:42"
        }
      ],
      "roles": {
        "access": "roles",
        "roles": ["member"],
        "users": [{ "dataSet": "invoices", "user": "member", "roles": ["member"] }]
      }
    }
  ],
  "appWide": [],
  "uncompared": [],
  "plugins": { "missingFromHead": [], "versionChanged": [] },
  "removedPages": []
}
```

`blocks` lists each block the change added, changed or removed, with its type, label and source. `authChanged` is true when the page's auth differs from the base.

### Caching

Base checkouts and clean builds are cached under `.lowdefy/scope/`, keyed by commit and by the installed Lowdefy version, and removed after 14 days unused. A dirty head is built for each run and the build is removed afterwards. The scope writes nothing else.
