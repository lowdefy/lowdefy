---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/node-utils': minor
---

feat: The coding agent explores pull requests, with `lowdefy journeys scope` to say what a change touched

- `lowdefy journeys scope [--base <ref>] [--json]` prints what a change touched: each page the change reached, including pages from modules, why (its own config, a request, an endpoint, a connection, a websocket, an app-wide artifact, or a `_ref`'d file), the blocks added, changed or removed, and who can open the page, with the data set users under `tests/data/` that it admits. It builds the merge base and the working tree with the installed dev server's builder, installing it into `.lowdefy/dev` when none is installed, and needs no running dev server. Without `--base` it lists every page.
- `lowdefy agent-setup` installs a `journeys-from-pr` skill that has the coding agent explore a pull request itself. For each changed page and role, it looks at the page, writes a journey for every path a user can take, and proves each one with `lowdefy test --repeat 3`. Journeys that pass join the suite. A journey that fails is reported as a finding, with that journey. Given a goal sentence instead, the same skill runs a bug bash.
- A journey's `name` is at most 100 characters, checked as authored (before a `[user]` suffix). An optional `description`, at most 60 words, states the journey's goal.
- On a journey with a data set, a click on a block whose events reach a connection the data set cannot run (a type that declares no `meta.dataSet`, a connection with no artifact, or an `external` type with no request types to sink) fails at that step, naming the block and the connection's declaration: `Block "export" reaches connection "reports_db" (Knex, no dataSet declaration), which a data set cannot redirect, so a data-set journey cannot click it.` A click that runs an auth action (`Login`, `Logout`, `SetActiveOrganization`, `UpdateSession` and the rest) fails the step, naming the block and the action, when the action executes; one the click skips (a failed `Validate`, a true `skip:`) passes.
