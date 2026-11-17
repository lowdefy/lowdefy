---
'@lowdefy/server-dev': patch
---

perf(server-dev): Journey page loads keep the browser cache

A data set journey's browser is now kept off the dev server under another host by Chromium host resolver rules instead of a Playwright route. A route turned the HTTP cache off, so every `goto` refetched every dependency chunk; later page loads now take them from the cache. The headless browser is launched per origin, and a request to the dev server's port under another host still never leaves it and still fails the step.

The headless browsers now use a proxy only when the environment names one (`HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, with `NO_PROXY`), and never for the dev server's port, so no proxy can carry a journey's request to the dev server under another name. A proxy set only in the operating system is no longer used by them.
