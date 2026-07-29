---
'@lowdefy/e2e-utils': patch
---

fix: Set urlQuery through the app router.

`ldf.urlQuery('key').do.set(value)` called `history.pushState` directly, which changed the URL without notifying the Lowdefy router. The page config was never re-fetched, so a Dynamic page kept showing content resolved from the previous query and tests asserting on the update failed.

`do.set` now navigates through the app's router — the same path a `Link` or `SetUrlQuery` action takes. On a Dynamic page it waits for the engine to rebuild the page context from the newly resolved config, so a following assertion or `value()` read cannot see content resolved from the previous query.
