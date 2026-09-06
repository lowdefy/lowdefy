---
'@lowdefy/server-dev': patch
---

fix(server-dev): a dev tab now holds one event-stream connection instead of two. The dev server runs on HTTP/1.1, where browsers allow six connections per host, and each open event stream keeps one for the life of the tab. With the config-reload stream and the inspector stream both open per tab, three tabs of the same app saturated the pool and the next request on any of them queued forever — the page sat on its loading skeleton with a request pending and no server error. The inspector now listens on the reload stream and reports page navigation with a small POST instead of reconnecting. The manager's proxy also now closes the upstream request when a browser tab disconnects, so closed tabs leave the inspectable-tab registry instead of lingering and shadowing live ones.
