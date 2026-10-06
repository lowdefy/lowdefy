---
'lowdefy': minor
'@lowdefy/server-dev': minor
'@lowdefy/node-utils': minor
---

feat: Agent explores pull requests; `lowdefy journeys scope` replaces the explorer walker

- `lowdefy journeys scope [--base <ref>] [--json]` prints what a change touched: each page the change reached, why (its own config, a request, an endpoint, a connection, a websocket, an app-wide artifact, or a `_ref`'d file), the blocks added, changed or removed, and who can open the page, with the data set users under `tests/data/` that it admits. It builds the merge base and the working tree with the installed dev server's builder, and needs no running dev server. Without `--base` it lists every page.
- The `journeys-from-pr` skill has the coding agent explore a pull request itself. For each changed page and role, it looks at the page, writes a journey for every path a user can take, and proves each one with `lowdefy test --repeat 3`. Journeys that pass join the suite. A journey that fails is reported as a finding, with that journey. A bug bash is the same skill given a goal sentence, so the `journeys-bug-bash` skill is gone.
- A journey's `name` is at most 100 characters. A new optional `description`, at most 60 words, states the journey's goal.
- On a journey with a data set, a click on a block whose events reach a connection the data set does not redirect (anything but `MongoDBCollection`), or run an auth action, now fails at that step and names the block and the connection or action. Before, the click went through to the real service.
- Removed: `lowdefy journeys explore` with its walks, model policies, charters and bug bash files, the dev server's explorer walk routes, the `explorer` trace source and `evidence.explorer`. `@lowdefy/node-utils` no longer exports `compileTrace` or `collectKnownText`, which only the explorer used.
