---
'lowdefy': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat: A journey runs once per user in a `user` list

A journey's `user` can now be a list of data set user names, such as `user: [admin, member]`, on a journey with `data:`. `lowdefy test` and the `lowdefy_run_tests` MCP tool run the journey once as each user, each in a fresh database, and report each run on its own line as `<name> [<user>]`. `--filter` matches that name (`--filter "[member]"` runs one user's run), recordings and coverage see each run apart, and `--repeat` repeats each run. `as:` steps are unchanged: the first actor is the run's user.

- A list holds distinct data set user names only and needs `data:`; `none` and inline user objects stay single values. Anything else is refused as an invalid journey file before a server starts.
- `lowdefy test --lint` reads such a journey once, and L5 checks every listed name against the data set.
- `lowdefy_run_journey` takes the same list and returns `{ passed, runs: [{ user, ... }] }`. `POST /lowdefy-docs/journey` still runs one user per call and refuses a list with a 400.
- `lowdefy journeys variants` skips the role sets a journey's listed users already have, and a granted role variant's first comment names the user list to set on the original journey. The `journeys-harden` skill keeps a passing granted role variant by adding its user to that list and deleting the variant file, rather than committing a copy of the journey. A refused role stays a journey of its own.
