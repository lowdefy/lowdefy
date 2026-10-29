---
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
---

fix: A request that runs past `config.requestTimeout` no longer reports a second error when its handler finally returns. The 504 still goes out on time; the middleware that ran on the late result threw `TypeError: Response body object should not be disturbed or locked` (seen under `compress`), which was logged and sent to Sentry under the request's route, hiding the timeout behind a misleading title. That late error is now one warning line.
