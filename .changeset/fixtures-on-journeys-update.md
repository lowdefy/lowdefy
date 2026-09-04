---
'lowdefy': minor
'@lowdefy/node-utils': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(test): journeys name their fixtures; `lowdefy test --update` records state expectations

A `tests/journeys/*.yaml` journey takes `fixtures: [names]`, seeded into the runner's in-memory MongoDB before its page opens and cleared between tests, exactly as a request test's `fixtures`/`seed` are, so journeys and request tests share one seeding session; a journey that seeds needs a server `lowdefy test` started (`--url` is refused). The `lowdefy_run_journey` tool and `POST /lowdefy-docs/journey` accept `fixtures` too, seeding the dev database through the connection layer behind the same `allowWriteRequests` opt-in. A state expectation can be written as `expect: { state: { path } }` with no value: `lowdefy test --update` runs the journey, fills `equals` from the state it observes and writes it back into the file, editing only that node so comments and every other journey in the file survive, stamped `from: recorded`. Without `--update`, an unfilled expectation fails the journey and exits 1 rather than passing while asserting nothing.
