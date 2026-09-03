---
'@lowdefy/server-dev': minor
'@lowdefy/docs': patch
---

feat(server-dev): `lowdefy_checkpoint_to_mocks` is removed; checkpoint replay is explicit and bounded

Exporting a captured checkpoint into an `e2e/mocks.yaml` file made a second, silently diverging copy of the test data; fixtures and request tests are the single way to put data into a test. `lowdefy_load_state` takes a `replayRequests` option (default `true`) and its result reports it, because while replay is on every browser tab's page requests are answered from the checkpoint's recorded responses instead of the database. Replay ends deliberately: it is cleared by a rebuild, by `lowdefy_revert_checkpoint`, and by loading a checkpoint with replay off, and a replayed request is logged once per page and request with the checkpoint it was answered from. `lowdefy_run_request` never replays and reports `mockedElsewhere` when the request it just ran for real is being replayed for the app.
