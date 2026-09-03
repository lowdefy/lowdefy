---
'@lowdefy/server-dev': patch
---

fix(server-dev): reliable restarts, one dev feedback buffer, located run_request failures

The three dev feedback stores (browser errors, server errors, dev notices) share one ring buffer that collapses repeats with a count instead of letting one broken request evict every other entry, and notices reach the browser error bar again once more than fifty config sites have been seen. Dev notices ride the same event bus as every other dev event, and an unknown event can no longer break the code that published it. `lowdefy_run_request` failures report their `file:line` and appear under `serverErrors` in `build_status` like `run_endpoint` failures, a request or routine that returns nothing is reported as the success it is, and an unknown endpoint id is refused without building a context. The `build_status` field `tenantNotices` is renamed `devNotices` (it also carries `runAs` notices), and `lowdefy_restart` says that a restart discards them.

Restarts are serialised: the manager waits for the old server to release its port and coalesces concurrent triggers into one restart. Local plugins are watched at the entry point the server actually imports (usually `dist/`) and picked up when added mid-session, the MCP event stream no longer accumulates subscribers across reconnects, an edited client-side `_js` module is re-imported instead of served from the browser's module cache, server errors carry the first stack frame inside the config directory, and the error bar's "fails in prod" badge belongs to the entry the bar colour was chosen from. The dev manager lock records the public port so `lowdefy test` can reuse a running dev server.
