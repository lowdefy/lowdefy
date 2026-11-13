---
'lowdefy': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

docs(docs, cli): Endpoint tests are documented, and the agent rules say when to use them

A new docs page, Endpoint Tests, covers `@lowdefy/test-utils`: the script an app runs, `openTestApp`, sessions, stubs, `sunk`, the access table and its committed snapshot, what endpoint tests do not cover, and why a config edit needs a build first. Every code sample on the page runs in the package's fixture suite.

The rules `lowdefy agent-setup` writes now tell agents to:

- Prove logic, permissions and writes while editing by calling the request or endpoint on the dev server, with `lowdefy_run_request` or `lowdefy_run_endpoint` and `user` and `data`. Never through a journey.
- Keep each check as a journey that needs no browser: blocks targeted by `blockId`, checked with `expect.state`, `expect.calls` or `expect: { db }`, and a journey with no `pageId` and `call` or `request` steps for what a page would never send.
- Add or update an endpoint test, where the app has them, for what a journey cannot say (table-driven cases, stubbed services, races, cron routines), and run them once before calling the change done. They read a build, so they are not for the edit loop.
- Say in the pull request when the access table snapshot changed, and why.

Each journey skill carries the same rule. `journeys-autopilot` writes refusal journeys only for what an access table snapshot cannot show, when the app keeps one, and a control that writes data gets one journey that asserts what it stored with `expect: { db }`. `lowdefy journeys variants` writes no `roleRefused` variant for an app that keeps an access table snapshot.

Rerun `npx lowdefy@<app version> agent-setup` to get the new text.
