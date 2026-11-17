---
'lowdefy': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

docs(docs, cli): Endpoint tests are documented, and the agent rules say when to use them

A new docs page, Endpoint Tests, covers `@lowdefy/test-utils`: the script an app runs, `openTestApp`, sessions, stubs, `sunk`, the access table, what endpoint tests do not cover, and why a config edit needs a build first. Every code sample on the page runs in the package's fixture suite.

The rules `lowdefy agent-setup` writes now tell agents to:

- Prove logic, permissions and writes while editing by calling the request or endpoint on the dev server, with `lowdefy_run_request` or `lowdefy_run_endpoint` and `user` and `data`. Never through a journey.
- Keep each check as a journey that needs no browser: blocks targeted by `blockId`, checked with `expect.state`, `expect.calls` or `expect: { db }`, and a journey with no `pageId` and `call` or `request` steps for what a page would never send.
- Add or update an endpoint test, where the app has them, for what a journey cannot say (table-driven cases, stubbed services, races, cron routines), and run them once before calling the change done. They read a build, so they are not for the edit loop.
- Check who reaches which page and endpoint with the committed `tests/access.yaml`, and say in the pull request which cells changed, and why.

Each journey skill carries the same rule. `journeys-autopilot` writes no refusal journeys for page and role reach, and a control that writes data gets one journey that asserts what it stored with `expect: { db }`. `lowdefy journeys variants` writes no role refusal variants.

Rerun `npx lowdefy@<app version> agent-setup` to get the new text.
