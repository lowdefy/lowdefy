---
'@lowdefy/e2e-utils': patch
---

fix: Set urlQuery through the app router.

`ldf.urlQuery('key').do.set(value)` called `history.pushState` directly, which changed the URL without notifying the Lowdefy router. The page config was never re-fetched, so a Dynamic page kept showing content resolved from the previous query and tests asserting on the update failed.

`do.set` now navigates through the app's router — the same path a `Link` or `SetUrlQuery` action takes — and waits for the re-resolved page config to arrive before resolving, so a following assertion cannot read stale content.
